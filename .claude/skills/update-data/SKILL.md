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
3. If the step worked, first look back over the run so far and update this file with anything that would have helped: a failure and how it was solved, a message or case the runbook didn't cover, a command whose output misled you, a check that missed something. Make the smallest edit that captures it, add a line to the report saying what changed, and skip this when nothing new came up. Then ask whether to continue with the next step by calling `AskUserQuestion`, naming that step in the question. Do not ask it as a ⚠️ item or in plain text. Offer "Continue with step N" (recommended) and "Stop here", and explain both in one plain sentence each in the message before the call. Do not start the next step until the user picks the continue option.
4. If the step failed or the result is unclear, stop and follow that step's "When it didn't" guidance. Say what you propose and wait. Never skip ahead.
5. Steps 1, 2 and 3 are run one after another, never in parallel, even though they are independent.
6. Steps 1–3 take minutes: run them in the background and wait for the completion notice. Don't poll the log.
7. Step 5 is by hand: ask whether to do it or skip it, and if the user does it, ask them for the KML file or the finished JSON. Step 7 serves the site: run the server in the background and ask the user to do the browser checks (or to say if you should). Stop the server afterwards.
8. Commit in step 8 and deploy in step 9 only when the user explicitly says so at that step. A yes to "continue with step 8" or "continue with step 9" is not that say-so: each step asks its own commit or deploy question. Never create a branch.

The rest of this file is the runbook.

This is the step-by-step plan for refreshing every layer the site shows: routes, accommodation, bike service shops, sightseeing and charging stations. Follow the steps in order. Each step says what to run, how to tell that it worked, and what to do when it didn't.

The whole update takes about an hour, most of it the route download. It changes files in `ids/` and `public/data/` only. Nothing reaches the live site until step 9.

See `AGENTS.md` in the repository root for how the data sources, folders and scripts fit together.

## Order

The steps run in order 0–9. Steps 1–3 take most of the time (the route download alone is 30–40 minutes). Everything from step 4 on needs all three to have finished.

## Rules that apply to every step

- **Run every command from the repository root.** The scripts use relative paths.
- **Read the output.** The downloaders exit with code 0 even when they stop on an error, so a returned prompt doesn't mean success. Each step below says what to search the log for.
- **Never run `bin/cleanup.js` after a download that stopped on an error.** Rerun the failed downloader until it finishes cleanly first. Step 3 explains the worst case.
- **Compare against the baseline, not `HEAD`.** Step 0 saves the starting commit in `logs/baseline.txt`, and the commands below read it as `BASE`. The user may commit while the run is going: in October 2026 they committed the routes and shops, then the sightseeing, between steps 2 and 3. After that `HEAD` already held the new data, and every comparison against it showed nothing. Before step 4, run `git log --oneline $(cat logs/baseline.txt)..HEAD`. If it lists commits, tell the user and keep using `BASE`.
- **A connection timeout is a network problem, not a script problem.** A stack trace with `ETIMEDOUT` after `Retrying:` lines (it can strike on the first request or after 1,500 requests) usually passes by itself. Before rerunning, check that the source answers: `curl -sS -m 15 -o /dev/null -w '%{http_code}\n' <url from the log>` must print 200. In October 2026 step 2 failed twice this way and finished on the third run. Each rerun starts from the first request. After two failures, stop and ask the user before a third.
- **Don't commit until step 8.** Until then, [Undo](#undo) brings everything back, unless the user committed during the run.

## Step 0: Before you start

1. Check Node. It must be version 18 or newer, because the scripts use the built-in `fetch`. If it is older, stop and ask the user to upgrade.

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

   If it prints anything, stop. Tell the user which files are listed and wait; do not commit, stash, restore or delete anything unless the user says to. If the user chooses stash, use `git stash -u`, because a plain stash leaves untracked files that [Undo](#undo) would delete. If `logs/` also holds logs, this may be a run in progress: ask which step was reached. Continue only when the command prints nothing (run it again to confirm). A clean start keeps the diff in step 8 limited to the update, and makes Undo safe.

4. Create a folder for the logs. `logs/` is gitignored.

   ```sh
   mkdir -p logs
   ```

5. Save the starting commit. Steps 4, 6 and 8 and Undo compare against it.

   ```sh
   git rev-parse HEAD > logs/baseline.txt
   ```

## Step 1: Routes

Downloads the SchweizMobil hiking, cycling and mountain-bike routes at all three levels: national, regional and local. SchweizMobil has no list of route numbers, so the script tries every number one after another: 1–9 for national, 1–99 for regional and 1–999 for local. That's about 3,300 requests.

```sh
node bin/route-downloader.js 2>&1 | tee logs/routes.log
```

**While it runs**, it prints one line per number it tries, for example `Wanderland-RoutenLokal: 109 (10%)`. The groups run in this order: `Mtbland` (mountain bike), `Veloland` (cycling), `Wanderland` (hiking). Within each group the order is `RoutenNational`, `RoutenRegional`, `RoutenLokal`.

**When it worked**, the last progress line is `Wanderland-RoutenLokal: 999 (99%)` and the search below prints `no matches`:

```sh
grep -nE '^Error (downloading file|getting ids):|^ +at |NO IDS FOUND|MORE THAN ONE FEATURE|DUPLICATED ID' logs/routes.log || { [ $? -eq 1 ] && echo "no matches"; }
```

A `Retrying:` line, followed by a line such as `Error: HTTP 503` or `TypeError: fetch failed`, is fine on its own. It means a request failed and is being tried again. The search above ignores these lines.

**When it didn't:**

- A stack trace (lines starting with `    at`) means the script stopped. The route lists finished before that point have been updated. The list being downloaded at that point has not, though some of its files were already overwritten.
  - Usually `Retrying:` lines come first, then `Error downloading file: <url>`. That means a request failed 3 times. Wait a few minutes and run the same command again. The script can't resume, so it starts over from route 1.
  - If `Error downloading file:` has no `Retrying:` lines before it, and the line after it is a `TypeError`, SchweizMobil has changed the format of its response. Rerunning won't help. The script needs updating.
- `MORE THAN ONE FEATURE: <url>` means SchweizMobil returned several routes for one number. The script skips that number, so it's missing from the new list, and step 6 will delete its old file. Open the URL in a browser to see what came back. Report the affected numbers to the user and let them decide.

Route numbers that don't exist are not errors. SchweizMobil answers them with an empty result, and the script just moves on.

## Step 2: Bike service shops and sightseeing

Downloads the SchweizMobil id lists for bike service shops (`Cycleservice`) and sightseeing (`Sightseeing`), then each place on those lists.

```sh
node bin/other-downloader.js 2>&1 | tee logs/other.log
```

**While it runs**, it prints `SERVICESHOP: <id> (<percent>%)` and then `SIGHTSEEING: <id> (<percent>%)`.

**When it worked**, the last progress line is a `SIGHTSEEING:` line at 99% and the search below prints `no matches`, or only `MORE THAN ONE FEATURE` lines, which are handled below and are not failures:

```sh
grep -nE '^Error (downloading file|getting ids):|^ +at |NO IDS FOUND|MORE THAN ONE FEATURE|DUPLICATED ID' logs/other.log || { [ $? -eq 1 ] && echo "no matches"; }
```

**When it didn't:**

- `Error getting ids:` means the id list couldn't be downloaded. `Error downloading file:` means a single place couldn't. In both cases the script stopped before writing that layer's id list. Rerun the same command. If no `Retrying:` lines come before the error, read step 1 first: the response format has probably changed.
- `NO IDS FOUND: <url>` means SchweizMobil returned an empty list. The address has probably changed. Open the URL in a browser before you rerun. If the address changed, update it in `bin/helpers.js`.
- `MORE THAN ONE FEATURE: <url>` means that place was skipped, but its id is still on the new list. If the place is new, it has no file, and check 2 in step 4 will report it (a new shop 1404 did in October 2026). If it existed before, it keeps its old file. Ask the user then: accept it (the site skips that place and logs one `Could not load` message), or remove its id from the list. The next download adds the id back.

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

**When it worked**, the last progress line is a `MOUNTAINHUT:` line at 99%. The script then spends a few more seconds on the three My Switzerland layers without printing anything. When the prompt returns, the search below must print `no matches` (`MORE THAN ONE FEATURE` lines are handled as in step 2):

```sh
grep -nE '^Error (downloading file|getting ids):|^ +at |NO IDS FOUND|MORE THAN ONE FEATURE|DUPLICATED ID' logs/accommodation.log || { [ $? -eq 1 ] && echo "no matches"; }
```

**When it didn't:**

- **Any error at all: rerun the whole script until it finishes cleanly, and don't move on to step 6 before that.** The campsite list combines two sources. The SchweizMobil step writes it, then the My Switzerland step adds its own ids. If the second step fails, the list holds only the SchweizMobil campsites. Running step 6 then would delete every My Switzerland campsite file.
- `DUPLICATED ID <number>: <id>` means two My Switzerland places got the same 9-digit number. Rerunning doesn't help, because the numbers are computed from the places' own ids. The id scheme in `bin/helpers.js` has to change.
- If a My Switzerland layer suddenly has no places, My Switzerland has probably changed its category ids. That doesn't stop the script, and rerunning won't help. In check 1 of step 4, hostels, B&Bs or group houses show `-> 0`. Campsites keep their SchweizMobil part, so they show a drop of about 70% instead. **Don't run step 6 until this is fixed.** For campsites, it would delete every My Switzerland file. Find the new category id and update it in `bin/accommodation-downloader.js`. `reference/my-switzerland-categories.json` holds the May-2024 names and ids for comparison.
- A stack trace with `HTTP <status>` or `fetch failed` and no `Error downloading file:` line before it means a My Switzerland request failed 3 times. Wait, then rerun the whole script.
- Any other `TypeError` with a stack trace into `bin/helpers.js` means a source has changed the format of its response. Rerunning won't help. The script needs updating; open the last URL in the log to see the new format.
- The other messages mean the same as in step 2.

SchweizMobil can renumber all of its accommodation ids (see Ids in `AGENTS.md`). When that happens, share links to those places stop working. That's expected.

## Step 4: Check the downloads

Run these three checks after steps 1–3 have all finished cleanly.

### Check 1: How much each list changed

Compares the ids each list had at the baseline commit with the ids it has now, as counts and as ids added (`+`) and removed (`-`). Equal counts alone don't prove the ids are the same:

```sh
BASE=$(cat logs/baseline.txt) node -e "
const fs = require('fs'), { execSync } = require('child_process')
for (const g of fs.readdirSync('ids')) for (const f of fs.readdirSync('ids/' + g)) {
  const p = 'ids/' + g + '/' + f
  const before = new Set(JSON.parse(execSync('git show ' + process.env.BASE + ':' + p)))
  const after = new Set(JSON.parse(fs.readFileSync(p, 'utf-8')))
  const added = [...after].filter((id) => !before.has(id)).length
  const removed = [...before].filter((id) => !after.has(id)).length
  console.log(p.padEnd(38), String(before.size).padStart(5), '->', String(after.size).padStart(5), ('+' + added + ' -' + removed).padStart(10), after.size < before.size * 0.9 ? '  <-- dropped more than 10%' : '')
}"
```

Small changes in both directions are normal, and a whole layer can be unchanged (`+0 -0`: all eight accommodation lists in October 2026). A list where `+` and `-` are close to its whole size means SchweizMobil renumbered it (all bike shops in October 2026: ids 2–634 became 1000–1490, with similar counts). That is expected, but tell the user: old share links to those places break, and step 6 will delete the old files. Look into any list marked `dropped more than 10%`, and any list that went to 0. The cause is usually a failed or partial download, so rerun that downloader. The two `favorites` lists never change in this step.

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
| `<list>: no data file for <id>`                                        | The id is on a list but has no file. The site will skip that place and log `Could not load` in the browser console.                                  | Look for `MORE THAN ONE FEATURE` with that id in the logs. If there is no such line, SchweizMobil returned nothing for that id. If one or two places are affected, accept it, or remove the id from the list if the user prefers no console message. If many are, rerun that downloader.    |
| `favorites/hiking: <id> is no longer a ... route`                      | SchweizMobil dropped that route number. Step 6 keeps its old file because a favorites list still refers to it, so the site shows the outdated route. | Find the route's new number on [map.schweizmobil.ch](https://map.schweizmobil.ch) and put it in `ids/favorites/hiking.json`, or delete the entry.                                                                    |
| `favorites/visit: <id> is no longer a ... place`                       | Same as above, for a favorite sightseeing place.                                                                                                     | Update or delete the entry in `ids/favorites/visit.json`.                                                                                                                                                            |
| `other/sightseeing: SchweizMobil id <id> overlaps the hand-made range` | SchweizMobil now uses ids of 10001 and up, so the download may have overwritten a hand-made entry with the same id.                                  | **Stop.** For each id listed, check whether it is in `ids/favorites/visit.json`. If not, nothing hand-made was overwritten: tell the user and carry on. If it is, restore the hand-made file under a new id with `git show $(cat logs/baseline.txt):public/data/other/sightseeing/<id>.json`, and update the file name, its inner `id` and the `visit.json` entry. Pick a new id above every id on `ids/other/sightseeing.json`. Rerun `node bin/other-downloader.js` so the SchweizMobil place gets its file back, then move the `10001` threshold in check 2 to the new range. |

To help the user find a favorite's new number, read the route's or place's name from its old file (`properties.title`, still on disk until step 6). If the user chooses to delete entries, edit the text and don't reformat: the favorites lists hold one id per line (`  659,`) with no newline at the end, and the downloaded lists are one line. Remove only `<id>,`, then confirm with `git diff --stat` that just those lines changed and run check 2 again. Step 6 will then delete the removed favorites' old files; name them in its confirmation.

### Check 3: Favorites that now point somewhere else

SchweizMobil sometimes gives an existing number to a different route or place. The favorite then quietly shows the new one. This check lists every favorite whose title changed:

```sh
BASE=$(cat logs/baseline.txt) node -e "
const fs = require('fs'), { execSync } = require('child_process')
const title = (json) => JSON.parse(json).properties.title
const lists = { 'favorites/hiking': 'hiking/local', 'favorites/visit': 'other/sightseeing' }
for (const [list, folder] of Object.entries(lists)) for (const id of JSON.parse(fs.readFileSync('ids/' + list + '.json', 'utf-8'))) {
  const file = 'public/data/' + folder + '/' + id + '.json'
  let before
  try { before = title(execSync('git show ' + process.env.BASE + ':' + file, { stdio: ['ignore', 'pipe', 'ignore'] })) } catch (e) { continue }
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

If the user chooses to do it, download the KML yourself first. The map is public, so no sign-in is needed (it worked in October 2026, 1.9 MB). Ask the user for the KML file or the finished JSON only if the download fails. If you convert the KML, use a throwaway script outside the repository, not a dependency. Put the download in its own new folder in the scratchpad and the script in another folder, and pass paths as arguments.

1. Download the [Bike Energy map](https://www.google.com/maps/d/u/0/viewer?mid=1wdyB_yGO8FqEWUbD-HJTvpQ-KRY) as KML:

   ```sh
   curl -sSL -m 60 -o <scratchpad>/kml/bikeenergy.kml 'https://www.google.com/maps/d/kml?mid=1wdyB_yGO8FqEWUbD-HJTvpQ-KRY&forcekml=1'
   ```

   It must answer `200` with `text/xml`. The file has five folders: `Ladestation`, `Ladestation in Planung`, `Ladekabel Verleih/Verkauf`, `Vertriebspartner` and `Ladestation E-Car`.
2. Keep only the `Ladestation` folder.
3. Convert the KML (XML) to JSON. Save just that folder's placemarks as `logs/chargingstations.json` (gitignored), then move it to `public/data/other/chargingstations/chargingstations.json` only once the check below passes. A small regex-based script is enough: split the file into `<Folder>` blocks, take the one named `Ladestation`, and for each `<Placemark>` write `name`, `description` (as `{ "__cdata": ... }`) and `Point.coordinates` (trimmed), as a JSON array with 2-space indentation. The site reads only those three fields (`buildChargingStations` and `chargingStationDetails` in `script.js`), so `styleUrl` and `ExtendedData` can be dropped, which also makes the file smaller. October 2026: 1,411 stations, of which 92 had new coordinates and 20 old ones were gone.

The site expects a JSON array where every entry looks like this:

```json
{
  "name": "Therme Bad Aibling",
  "description": { "__cdata": "<img src=\"...\" /><br>..." },
  "Point": { "coordinates": "12.0037651,47.8570573,0" }
}
```

`name` can be a plain string or `{ "__cdata": "..." }`. `coordinates` is a single string in the order longitude, latitude, altitude. `description` is optional. Other fields, such as `styleUrl` or `ExtendedData`, are ignored. The map also covers other countries, but the site only shows the stations inside a box around Switzerland, so the file can hold all of them.

Check the new file before moving it into place:

```sh
BASE=$(cat logs/baseline.txt) node -e "
const fs = require('fs'), { execSync } = require('child_process')
const list = JSON.parse(fs.readFileSync(process.argv[1], 'utf-8'))
const before = JSON.parse(execSync('git show ' + process.env.BASE + ':public/data/other/chargingstations/chargingstations.json', { maxBuffer: 1 << 28 })).length
const text = (v) => typeof v === 'string' ? v : v && v.__cdata
const bad = list.filter((e) => typeof text(e.name) !== 'string' || !e.Point || !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?/.test(e.Point.coordinates) || (e.description && typeof e.description.__cdata !== 'string'))
console.log(list.length + ' stations (' + before + ' before), ' + bad.length + ' malformed')
" logs/chargingstations.json
```

It must show `0 malformed` and a count within 10% of the previous one (1,339 before and 1,411 after the October 2026 refresh). If it doesn't, don't move the file into place. If the real file was already overwritten, run `git restore public/data/other/chargingstations/chargingstations.json`, then stop and tell the user. Step 6 never touches this file.

## Step 6: Delete files of places that disappeared

**Only run this step when steps 1–3 all finished cleanly and step 4 is clean.**

Before running it, list for each `ids/` list the ids that are in the baseline commit (`git show $(cat logs/baseline.txt):<list>`, as in check 1) but not in the new list, and say whether each had a data file. Put them in the ⚠️ item ("cleanup will delete about N files, including these ids: …") and wait for a yes.

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

If the script stops with `ENOENT`, an `ids/` list exists for a folder that `public/data/` doesn't have. Rerun the downloader for that layer. Files may already have been deleted, so run [Undo](#undo) if the user wants to start over.

The deletions are only on disk. Undo brings the files back until you commit.

## Step 7: Generate `public/ids.js` and test locally

```sh
./scripts/serve.sh
```

This runs `bin/ids-generator.js`, which writes `public/ids.js` from the `ids/` lists, then serves the site. If the generator fails with `ENOENT ... ids/<name>.json`, one of the lists is missing. Restore it with `git restore ids/<name>.json`.

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
git status --short public/data | grep -c '^ D' || true   # deleted data files
git status --short public/data | grep -c '^??' || true   # new data files
```

`public/ids.js` is gitignored and never committed.

The downloaded id lists and data files are stored as single-line JSON, so `git diff` shows each changed file as one long changed line. Check 1 in step 4 is the readable summary of the id lists. To compare a single data file, use `git show $(cat logs/baseline.txt):<path>` against the file on disk. If the user already committed part of the update during the run, the counts above cover only what is still uncommitted: say so, and ask the commit question only for the rest.

Show the counts, then end with a ⚠️ item asking "Commit `ids/` and `public/data/` now?" A yes to "continue with step 8" is not permission to commit. Only after a yes to that question, commit `ids/` and `public/data/` together, so each id list and its files always match:

```sh
git add ids public/data && git commit -m "<short message>"
```

Then `git status --short` must print nothing.

## Step 9: Deploy

Before deploying, `git status --short` must print nothing. If the user declined the commit, say the deploy would publish uncommitted data and ask again. The deploy question names the target: Firebase project `swiss-routes` (production).

```sh
./scripts/deploy.sh
```

This regenerates `public/ids.js` and deploys `public/` to Firebase Hosting. Then open https://swiss-routes.web.app and repeat a couple of the checks from step 7.

## Undo

Before you commit, this puts `ids/` and `public/data/` back exactly as they were in the baseline commit, even if you already ran `git add`. It deletes the newly downloaded files and restores changed and deleted ones:

```sh
git restore --source=$(cat logs/baseline.txt) --staged --worktree ids public/data
git clean -fd public/data
```

If the user committed during the run, this leaves the working tree differing from `HEAD` and does not remove their commits. Tell the user, and don't reset or revert anything unless they say to.

`git clean` deletes every untracked file under `public/data/`. That's safe only because step 0 started from a clean tree. Run `git clean -nd public/data` first to see what it would delete.
