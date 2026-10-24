---
name: update-data
description: Refresh all Swiss Routes map data (routes, accommodation, bike service shops, sightseeing, charging stations), review, commit and deploy, running one step at a time and waiting for the user's go-ahead between steps. Use when the user asks to update the data or runs /update-data.
disable-model-invocation: true
---

# Updating the map data

## How to run this skill

Run the steps below strictly one at a time:

1. Run only the current step, exactly as written. Start with step 0.
2. Report the result in the shape defined under Responses in the user's instructions: say what happened, and whether the step's "when it worked" criteria were met, with the evidence (command output, grep result).
3. If the step worked, end the message with a ⚠️ item asking whether to continue with the next step, and name that step. Do not start it until the user says yes.
4. If the step failed or the result is unclear, stop and follow that step's "When it didn't" guidance. Say what you propose and wait. Never skip ahead.
5. Steps 1, 2 and 3 are run one after another, never in parallel, even though they are independent.
6. Steps 1–3 take minutes: run them in the background and wait for the completion notice. Don't poll the log.
7. Step 5 is by hand: ask whether to do it or skip it. Step 7 serves the site: run the server in the background and ask the user to do the browser checks (or to say if you should). Stop the server afterwards.
8. Commit in step 8 and deploy in step 9 only when the user explicitly says so at that step. Never create a branch.

The rest of this file is the runbook.

This is the step-by-step plan for refreshing every layer the site shows: routes, accommodation, bike service shops, sightseeing and charging stations. Follow the steps in order. Each step says what to run, how to tell that it worked, and what to do when it didn't.

The whole update takes about an hour, most of it the route download. It changes files in `ids/` and `public/data/` only. Nothing reaches the live site until step 9.

See `AGENTS.md` in the repository root for how the data sources, folders and scripts fit together.

## Overview

| Step | What                                            | Command                                | Time          |
| :--- | :---------------------------------------------- | :------------------------------------- | :------------ |
| 0    | Check the tools and start from a clean checkout | `node --version`, `git status --short` | 1 minute      |
| 1    | Routes                                          | `node bin/route-downloader.js`         | 30–40 minutes |
| 2    | Bike service shops and sightseeing              | `node bin/other-downloader.js`         | ~10 minutes   |
| 3    | Accommodation                                   | `node bin/accommodation-downloader.js` | ~5 minutes    |
| 4    | Check the downloads                             | The three checks in step 4             | 1 minute      |
| 5    | Charging stations (optional, by hand)           | —                                      | 15 minutes    |
| 6    | Delete files of places that disappeared         | `node bin/cleanup.js`                  | seconds       |
| 7    | Generate `public/ids.js` and test locally       | `./scripts/serve.sh`                   | 10 minutes    |
| 8    | Review and commit                               | `git status`                           | 5 minutes     |
| 9    | Deploy                                          | `./scripts/deploy.sh`                  | 2 minutes     |

The times are estimates. Requests take about 0.5 seconds each, measured once in October 2026.

Steps 1, 2 and 3 don't depend on each other, but this skill runs them one after another. Everything from step 4 on needs all three to have finished.

## Rules that apply to every step

- **Run every command from the repository root.** The scripts use relative paths.
- **Read the output.** The downloaders exit with code 0 even when they stop on an error, so a returned prompt doesn't mean success. Each step below says what to search the log for.
- **Never run `bin/cleanup.js` after a download that stopped on an error.** Rerun the failed downloader until it finishes cleanly first. Step 3 explains the worst case.
- **Don't commit until step 8.** Until then, [Undo](#undo) brings everything back.

## Step 0: Before you start

1. Check Node. It must be version 18 or newer, because the scripts use the built-in `fetch`.

   ```sh
   node --version
   ```

2. Check the Firebase CLI, which steps 7 and 9 need.

   ```sh
   firebase --version
   ```

3. Make sure the working tree is clean. This command must print nothing:

   ```sh
   git status --short
   ```

   Commit or stash anything it lists first. A clean start keeps the diff in step 8 limited to the update, and makes [Undo](#undo) safe.

4. Create a folder for the logs. `logs/` is gitignored.

   ```sh
   mkdir -p logs
   ```

## Step 1: Routes

Downloads the SchweizMobil hiking, cycling and mountain-bike routes at all three levels: national, regional and local. SchweizMobil has no list of route numbers, so the script tries every number one after another: 1–9 for national, 1–99 for regional and 1–999 for local. That's about 3,300 requests.

```sh
node bin/route-downloader.js 2>&1 | tee logs/routes.log
```

**While it runs**, it prints one line per number it tries, for example `Wanderland-RoutenLokal: 109 (10%)`. The groups run in this order: `Mtbland` (mountain bike), `Veloland` (cycling), `Wanderland` (hiking). Within each group the order is `RoutenNational`, `RoutenRegional`, `RoutenLokal`.

**When it worked**, the last progress line is `Wanderland-RoutenLokal: 999 (99%)` and the search below finds nothing:

```sh
grep -nE '^Error (downloading file|getting ids):|^ +at |NO IDS FOUND|MORE THAN ONE FEATURE|DUPLICATED ID' logs/routes.log
```

A `Retrying:` line, followed by a line such as `Error: HTTP 503` or `TypeError: fetch failed`, is fine on its own. It means a request failed and is being tried again. The search above ignores these lines.

**When it didn't:**

- A stack trace (lines starting with `    at`) means the script stopped. The route lists finished before that point have been updated. The list being downloaded at that point has not, though some of its files were already overwritten.
  - Usually `Retrying:` lines come first, then `Error downloading file: <url>`. That means a request failed 3 times. Wait a few minutes and run the same command again. The script can't resume, so it starts over from route 1.
  - If `Error downloading file:` has no `Retrying:` lines before it, and the line after it is a `TypeError`, SchweizMobil has changed the format of its response. Rerunning won't help. The script needs updating.
- `MORE THAN ONE FEATURE: <url>` means SchweizMobil returned several routes for one number. The script skips that number, so it's missing from the new list, and step 6 will delete its old file. Open the URL in a browser to see what came back. If only a few numbers are affected, accept it and carry on.

Route numbers that don't exist are not errors. SchweizMobil answers them with an empty result, and the script just moves on.

## Step 2: Bike service shops and sightseeing

Downloads the SchweizMobil id lists for bike service shops (`Cycleservice`) and sightseeing (`Sightseeing`), then each place on those lists.

```sh
node bin/other-downloader.js 2>&1 | tee logs/other.log
```

**While it runs**, it prints `SERVICESHOP: <id> (<percent>%)` and then `SIGHTSEEING: <id> (<percent>%)`.

**When it worked**, the last progress line is a `SIGHTSEEING:` line at 99% and the search below finds nothing:

```sh
grep -nE '^Error (downloading file|getting ids):|^ +at |NO IDS FOUND|MORE THAN ONE FEATURE|DUPLICATED ID' logs/other.log
```

**When it didn't:**

- `Error getting ids:` means the id list couldn't be downloaded. `Error downloading file:` means a single place couldn't. In both cases the script stopped before writing that layer's id list. Rerun the same command. If no `Retrying:` lines come before the error, read step 1 first: the response format has probably changed.
- `NO IDS FOUND: <url>` means SchweizMobil returned an empty list. The address has probably changed. Open the URL in a browser before you rerun.
- `MORE THAN ONE FEATURE: <url>` means that place was skipped, but its id is still on the new list. If the place is new, check 2 in step 4 will report its missing file. If it existed before, it keeps its old file.

The hand-made sightseeing entries (ids 10001 and up) are safe. They are listed only in `ids/favorites/visit.json`, which no script writes, and step 6 keeps every file that a favorites list refers to.

## Step 3: Accommodation

Downloads, in this order:

| Order | Layer             | Source         | Prints progress  |
| :---- | :---------------- | :------------- | :--------------- |
| 1     | Campsites         | SchweizMobil   | `CAMPING:`       |
| 2     | Campsites         | My Switzerland | nothing          |
| 3     | Backpackers       | SchweizMobil   | `BACKPACKER:`    |
| 4     | Sleeping in straw | SchweizMobil   | `SLEEPINGSTRAW:` |
| 5     | Farm stays        | SchweizMobil   | `FARM:`          |
| 6     | Mountain huts     | SchweizMobil   | `MOUNTAINHUT:`   |
| 7     | Hostels           | My Switzerland | nothing          |
| 8     | B&Bs              | My Switzerland | nothing          |
| 9     | Group houses      | My Switzerland | nothing          |

```sh
node bin/accommodation-downloader.js 2>&1 | tee logs/accommodation.log
```

**When it worked**, the last progress line is a `MOUNTAINHUT:` line at 99%. The script then spends a few more seconds on the three My Switzerland layers without printing anything. When the prompt returns, the search below must find nothing:

```sh
grep -nE '^Error (downloading file|getting ids):|^ +at |NO IDS FOUND|MORE THAN ONE FEATURE|DUPLICATED ID' logs/accommodation.log
```

**When it didn't:**

- **Any error at all: rerun the whole script until it finishes cleanly, and don't move on to step 6 before that.** The campsite list combines two sources. The SchweizMobil step writes it, then the My Switzerland step adds its own ids. If the second step fails, the list holds only the SchweizMobil campsites. Running step 6 then would delete every My Switzerland campsite file.
- `DUPLICATED ID <number>: <id>` means two My Switzerland places got the same 9-digit number. Rerunning doesn't help, because the numbers are computed from the places' own ids. The id scheme in `bin/helpers.js` has to change.
- If a My Switzerland layer suddenly has no places, My Switzerland has probably changed its category ids. That doesn't stop the script, and rerunning won't help. In check 1 of step 4, hostels, B&Bs or group houses show `-> 0`. Campsites keep their SchweizMobil part, so they show a drop of about 70% instead (from 263 to about 70 in October 2026). **Don't run step 6 until this is fixed.** For campsites, it would delete every My Switzerland file. Find the new category id and update it in `bin/accommodation-downloader.js`. `reference/my-switzerland-categories.json` holds the May-2024 names and ids for comparison.
- The other messages mean the same as in step 2.

SchweizMobil can renumber all of its accommodation ids, as it did by October 2026. When that happens, share links to those places stop working. That's expected.

## Step 4: Check the downloads

Run these three checks after steps 1–3 have all finished cleanly.

### Check 1: How much each list changed

Compares how many ids each list had in the last commit with how many it has now:

```sh
node -e "
const fs = require('fs'), { execSync } = require('child_process')
for (const g of fs.readdirSync('ids')) for (const f of fs.readdirSync('ids/' + g)) {
  const p = 'ids/' + g + '/' + f
  const before = JSON.parse(execSync('git show HEAD:' + p)).length
  const after = JSON.parse(fs.readFileSync(p, 'utf-8')).length
  console.log(p.padEnd(38), String(before).padStart(5), '->', String(after).padStart(5), after < before * 0.9 ? '  <-- dropped more than 10%' : '')
}"
```

Small changes in both directions are normal. Look into any list marked `dropped more than 10%`, and any list that went to 0. The cause is usually a failed or partial download, so rerun that downloader. The two `favorites` lists never change in this step.

### Check 2: Missing files and broken favorites

```sh
node -e "
const fs = require('fs')
const read = (list) => JSON.parse(fs.readFileSync('ids/' + list + '.json', 'utf-8'))
const folders = { 'favorites/hiking': 'hiking/local', 'favorites/visit': 'other/sightseeing' }
let problems = 0
const report = (text) => { problems++; console.log(text) }
for (const g of fs.readdirSync('ids')) for (const f of fs.readdirSync('ids/' + g)) {
  const list = g + '/' + f.replace(/\.json$/, '')
  const folder = folders[list] ?? list
  for (const id of read(list)) if (!fs.existsSync('public/data/' + folder + '/' + id + '.json')) report(list + ': no data file for ' + id)
}
const local = new Set(read('hiking/local'))
for (const id of read('favorites/hiking')) if (!local.has(id)) report('favorites/hiking: ' + id + ' is no longer a hiking/local route')
const sightseeing = new Set(read('other/sightseeing'))
for (const id of read('favorites/visit')) if (id < 10001 && !sightseeing.has(id)) report('favorites/visit: ' + id + ' is no longer a sightseeing place')
for (const id of sightseeing) if (id >= 10001) report('other/sightseeing: SchweizMobil id ' + id + ' overlaps the hand-made range')
console.log(problems ? problems + ' problem(s)' : 'No problems')
"
```

It must print `No problems`. Otherwise:

| Message                                                                | Meaning                                                                                                                                              | What to do                                                                                                                                                                                                           |
| :--------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<list>: no data file for <id>`                                        | The id is on a list but has no file. The site will skip that place and log `Could not load` in the browser console.                                  | Look for `MORE THAN ONE FEATURE` with that id in the logs. If there is no such line, SchweizMobil returned nothing for that id. If one or two places are affected, accept it. If many are, rerun that downloader.    |
| `favorites/hiking: <id> is no longer a ... route`                      | SchweizMobil dropped that route number. Step 6 keeps its old file because a favorites list still refers to it, so the site shows the outdated route. | Find the route's new number on [map.schweizmobil.ch](https://map.schweizmobil.ch) and put it in `ids/favorites/hiking.json`, or delete the entry.                                                                    |
| `favorites/visit: <id> is no longer a ... place`                       | Same as above, for a favorite sightseeing place.                                                                                                     | Update or delete the entry in `ids/favorites/visit.json`.                                                                                                                                                            |
| `other/sightseeing: SchweizMobil id <id> overlaps the hand-made range` | SchweizMobil now uses ids of 10001 and up, so the download may have overwritten a hand-made entry with the same id.                                  | **Stop.** Run `git restore public/data/other/sightseeing/<id>.json` for each id listed. Then renumber the hand-made entries to a range SchweizMobil doesn't use, in both their files and `ids/favorites/visit.json`. |

### Check 3: Favorites that now point somewhere else

SchweizMobil sometimes gives an existing number to a different route or place. The favorite then quietly shows the new one. This check lists every favorite whose title changed:

```sh
node -e "
const fs = require('fs'), { execSync } = require('child_process')
const title = (json) => JSON.parse(json).properties.title
const lists = { 'favorites/hiking': 'hiking/local', 'favorites/visit': 'other/sightseeing' }
for (const [list, folder] of Object.entries(lists)) for (const id of JSON.parse(fs.readFileSync('ids/' + list + '.json', 'utf-8'))) {
  const file = 'public/data/' + folder + '/' + id + '.json'
  let before
  try { before = title(execSync('git show HEAD:' + file, { stdio: ['ignore', 'pipe', 'ignore'] })) } catch (e) { continue }
  if (!fs.existsSync(file)) continue
  const after = title(fs.readFileSync(file, 'utf-8'))
  if (before !== after) console.log(list + ' ' + id + ': \"' + before + '\" is now \"' + after + '\"')
}
console.log('done')
"
```

If it prints only `done`, there's nothing to do. A renamed route can also be a harmless title fix. For each real change, find the favorite's new number and update the favorites list, as in check 2.

If you edited a favorites list, run check 2 again.

## Step 5: Charging stations (optional, by hand)

The e-bike charging stations come from the Bike Energy map on Google My Maps, which has no download script. Skip this step if the stations don't need refreshing.

1. Open the [Bike Energy map](https://www.google.com/maps/d/u/0/viewer?mid=1wdyB_yGO8FqEWUbD-HJTvpQ-KRY) and download it as KML.
2. Keep only the `Ladestation` folder.
3. Convert the KML (XML) to JSON. Save just that folder's list of placemarks as `public/data/other/chargingstations/chargingstations.json`.

The site expects a JSON array where every entry looks like this:

```json
{
  "name": "Therme Bad Aibling",
  "description": { "__cdata": "<img src=\"...\" /><br>..." },
  "Point": { "coordinates": "12.0037651,47.8570573,0" }
}
```

`name` can be a plain string or `{ "__cdata": "..." }`. `coordinates` is a single string in the order longitude, latitude, altitude. `description` is optional. Other fields, such as `styleUrl` or `ExtendedData`, are ignored. The map also covers other countries, but the site only shows the stations inside a box around Switzerland, so the file can hold all of them.

Check the new file before moving on:

```sh
node -e "
const list = require('./public/data/other/chargingstations/chargingstations.json')
const bad = list.filter((e) => !e.name || !e.Point || typeof e.Point.coordinates !== 'string' || (e.description && !e.description.__cdata))
console.log(list.length + ' stations, ' + bad.length + ' malformed')
"
```

It should show a count similar to before (1,339 in October 2026) and `0 malformed`. Step 6 never touches this file.

## Step 6: Delete files of places that disappeared

**Only run this step when steps 1–3 all finished cleanly and step 4 is clean.**

```sh
node bin/cleanup.js
```

It deletes every file in `public/data/` that no `ids/` list refers to, and prints one line per folder:

```
hiking/local: deleted 3
accommodation/camping: deleted 12
...
```

A few deletions per folder are normal. Many deletions where step 4 showed little change mean SchweizMobil renumbered that layer, which is also fine. If a folder shows `skipped, an id list for it is empty`, that list is empty and step 4 should already have flagged it.

The deletions are only on disk. [Undo](#undo) brings the files back until you commit.

## Step 7: Generate `public/ids.js` and test locally

```sh
./scripts/serve.sh
```

This runs `bin/ids-generator.js`, which writes `public/ids.js` from the `ids/` lists, then serves the site. If the generator fails with `ENOENT ... ids/<name>.json`, one of the 21 lists is missing. Restore it with `git restore ids/<name>.json`.

Open the site at **http://localhost:5000**. The Google Maps key only works on that exact address, so another port or host shows a broken map.

Then check:

1. Turn on each route layer (hiking, cycling, mountain biking) and each place layer, one at a time. The markers or lines appear, and the loading bar finishes.
2. Click a few routes and places in each layer. The details panel shows a title, photo and description.
3. Open http://localhost:5000/?favorites=1 and turn on both favorites layers (Hikes and Places).
4. Turn on the charging stations layer.
5. Open the browser console. There must be no `Could not load` errors, other than any you accepted in step 4.

Stop the server with Ctrl+C.

## Step 8: Review and commit

```sh
git status --short | wc -l             # how many files changed
git status --short ids                 # which id lists changed
git status --short public/data | grep -c '^ D'   # deleted data files
git status --short public/data | grep -c '^??'   # new data files
```

`public/ids.js` is gitignored and never committed.

The downloaded id lists and data files are stored as single-line JSON, so `git diff` shows each changed file as one long changed line. Check 1 in step 4 is the readable summary of the id lists. To compare a single data file, use `git show HEAD:<path>` against the file on disk.

Commit `ids/` and `public/data/` together, so each id list and its files always match.

## Step 9: Deploy

```sh
./scripts/deploy.sh
```

This regenerates `public/ids.js` and deploys `public/` to Firebase Hosting. Then open https://swiss-routes.web.app and repeat a couple of the checks from step 7.

## Undo

Before you commit, this puts `ids/` and `public/data/` back exactly as they were in the last commit, even if you already ran `git add`. It deletes the newly downloaded files and restores changed and deleted ones:

```sh
git restore --source=HEAD --staged --worktree ids public/data
git clean -fd public/data
```

`git clean` deletes every untracked file under `public/data/`. That's safe only because step 0 started from a clean tree. Run `git clean -nd public/data` first to see what it would delete.

## Error messages

| Message                                                                                          | Meaning                                                                                                                          | What to do                                                                                                   |
| :----------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `Retrying: <url>`                                                                                | A request failed and will be tried again, up to 3 times with a 2-second pause. The next line gives the reason.                   | Nothing, unless `Error downloading file:`, `Error getting ids:` or a stack trace follows.                    |
| `Error downloading file: <url>` and a stack trace                                                | A SchweizMobil request failed 3 times, or its response couldn't be read. The script stopped before writing that layer's id list. | Wait, then rerun the same downloader. If no `Retrying:` lines come before it, see the `TypeError` row below. |
| `Error getting ids: <url>`                                                                       | A SchweizMobil id list couldn't be downloaded.                                                                                   | Same as above.                                                                                               |
| `NO IDS FOUND: <url>`                                                                            | SchweizMobil returned an empty id list. The script stopped.                                                                      | Open the URL in a browser. If the address has changed, update it in `bin/helpers.js`.                        |
| `MORE THAN ONE FEATURE: <url>`                                                                   | SchweizMobil returned several results for one id, so it was skipped.                                                             | See steps 1 and 2.                                                                                           |
| `DUPLICATED ID <number>: <id>`                                                                   | Two My Switzerland places got the same number.                                                                                   | Needs a code change in `bin/helpers.js`. See step 3.                                                         |
| A stack trace with `HTTP <status>` or `fetch failed`, no `Error downloading file` line before it | A My Switzerland request failed 3 times.                                                                                         | Wait, then rerun `node bin/accommodation-downloader.js`.                                                     |
| Any other `TypeError` with a stack trace into `bin/helpers.js`                                   | A source has changed the format of its response.                                                                                 | The script needs updating. Open the last URL in the log to see the new format.                               |
| `fetch is not defined`                                                                           | Node is older than 18.                                                                                                           | Upgrade Node.                                                                                                |
| `ENOENT` from `bin/cleanup.js`                                                                   | An `ids/` list exists for a folder that `public/data/` doesn't have.                                                             | Rerun the downloader for that layer.                                                                         |

In October 2026 the SchweizMobil feature address `map.schweizmobil.ch/api/4/...` redirects to `schweizmobil.ch/api/4/...`. Node follows redirects, so the scripts still work. If that redirect ever goes away, change the address in `bin/helpers.js`.
