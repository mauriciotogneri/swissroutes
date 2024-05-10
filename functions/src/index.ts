import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2/options";

setGlobalOptions({
  region: "europe-west6",
});

export const website = onRequest((request, response) => {
  response.status(200).send(`<!doctype html>
    <head>
      <title>Time</title>
    </head>
    <body>
      IT WORKS!
    </body>
  </html>`);
});
