import fs from 'fs';
import path from 'path';
import { Proskomma } from 'proskomma';

console.log('Convert USX to JSON for Slate.');

if (process.argv.length !== 4) {
    console.log('USAGE: ts-node usx2slateJson.ts <USFM/USX Path>');
    process.exit(1);
}

const filePath = process.argv[3];
// const filePath = './assets/testScripture/NIV84/19-119.usx';
let content: Buffer;

try {
    content = fs.readFileSync(filePath);
} catch (err) {
    console.log(`ERROR: Could not read from USFM/USX file '${filePath}'`);
    process.exit(1);
}

const fileType = filePath.split('.').pop();

console.log(`Loading USX from '${filePath}' ...`);
console.log(`File content length ${content.length}B.`);

const pk = new Proskomma();

const parsedPath = path.parse(filePath);
const abbr = `${path.parse(parsedPath.dir).name}_${parsedPath.name}`;
const selectors = {
    lang: 'eng',
    abbr,
};

const docs: any = pk.importDocument(selectors, fileType, content);

// console.log(docs);
console.log(docs.sequences[docs.mainId].blocks[0]);

const query = '{id}';
pk.gqlQuery(query)
    .then((output) => console.log(JSON.stringify(output, undefined, 2)))
    .catch((err) => console.error(`ERROR: Could not run query: '${err}'`));

console.log('Finished.');
