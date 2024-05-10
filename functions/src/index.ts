import * as fs from "fs";
import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2/options";

setGlobalOptions({
  region: "europe-west6",
});

export const website = onRequest((request, response) => {
  const template = fs.readFileSync("static/index.html", "utf-8");
  response.status(200).send(template);
});
