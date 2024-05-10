import * as fs from 'fs';
import {onRequest} from 'firebase-functions/v2/https';
import {setGlobalOptions} from 'firebase-functions/v2/options';

setGlobalOptions({
  region: 'europe-west6',
});

export const website = onRequest((request, response) => {
  let template = fs.readFileSync('static/index.html', 'utf-8');

  // mountainbiking
  template = fillIds(template, 'MOUNTAINBIKING_NATIONAL_IDS', 'mountainbiking/national');
  template = fillIds(template, 'MOUNTAINBIKING_REGIONAL_IDS', 'mountainbiking/regional');
  template = fillIds(template, 'MOUNTAINBIKING_LOCAL_IDS', 'mountainbiking/local');

  // cycling
  template = fillIds(template, 'CYCLING_NATIONAL_IDS', 'cycling/national');
  template = fillIds(template, 'CYCLING_REGIONAL_IDS', 'cycling/regional');
  template = fillIds(template, 'CYCLING_LOCAL_IDS', 'cycling/local');

  // hiking
  template = fillIds(template, 'HIKING_NATIONAL_IDS', 'hiking/national');
  template = fillIds(template, 'HIKING_REGIONAL_IDS', 'hiking/regional');
  template = fillIds(template, 'HIKING_LOCAL_IDS', 'hiking/local');

  // accommodation
  template = fillIds(template, 'ACCOMMODATION_BACKPACKER_IDS', 'accommodation/backpacker');
  template = fillIds(template, 'ACCOMMODATION_CAMPING_IDS', 'accommodation/camping');
  template = fillIds(template, 'ACCOMMODATION_FARM_IDS', 'accommodation/farm');
  template = fillIds(template, 'ACCOMMODATION_MOUNTAINHUT_IDS', 'accommodation/mountainhut');
  template = fillIds(template, 'ACCOMMODATION_SLEEPINGSTRAW_IDS', 'accommodation/sleepingstraw');

  response.status(200).send(template);
});

const fillIds = (content: string, name: string, path: string): string => {
  const base = `const ${name} = `;
  const ids = JSON.parse(fs.readFileSync(`static/data/${path}.json`, 'utf-8'));

  return content.replace(`${base}[]`, `${base}${JSON.stringify(ids)}`);
};
