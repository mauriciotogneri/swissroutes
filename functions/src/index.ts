import * as fs from "fs";
import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2/options";

setGlobalOptions({
  region: "europe-west6",
});

export const website = onRequest((request, response) => {
  let template = fs.readFileSync("static/index.html", "utf-8");
  template = fillIds(template, "HIKING_NATIONAL_IDS", "hiking/national");
  template = fillIds(template, "HIKING_REGIONAL_IDS", "hiking/regional");
  template = fillIds(template, "HIKING_LOCAL_IDS", "hiking/local");

  response.status(200).send(template);
});

const fillIds = (content: string, name: string, path: string): string => {
  const base = `const ${name} = `;
  const ids = JSON.parse(fs.readFileSync(`static/data/${path}.json`, "utf-8"));

  return content.replace(`${base}[]`, `${base}${JSON.stringify(ids)}`);
};
