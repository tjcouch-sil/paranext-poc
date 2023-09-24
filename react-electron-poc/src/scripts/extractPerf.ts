import fs from 'fs';
import path from 'path';
import EpiteleteHtml from 'epitelete-html';
import { Proskomma } from 'proskomma';

console.log('Extract PERF from USFM/USX.');

if (process.argv.length !== 4) {
    console.log('USAGE: ts-node extractPerf.ts <USFM/USX Path>');
    process.exit(1);
}

const filePath = path.resolve(process.argv[3]);
let content: Buffer;

try {
    content = fs.readFileSync(filePath);
} catch (err) {
    console.log(`ERROR: Could not read from USFM/USX file '${filePath}'`);
    process.exit(1);
}

const fileType = filePath.split('.').pop();

console.log(`Loading ${fileType?.toUpperCase()} from '${filePath}' ...`);
console.log(`File content length ${content.length} B.`);

const proskomma = new Proskomma();

const parsedPath = path.parse(filePath);
const abbr = `${path.parse(parsedPath.dir).name}_${parsedPath.name}`;
const selectors = {
    lang: 'eng',
    abbr,
};

proskomma.importDocument(selectors, fileType, content);

const docSetId = `${selectors.lang}_${abbr}`;
const epiteleteHtml = new EpiteleteHtml({ proskomma, docSetId });

const writePath = path.join(parsedPath.dir, `${parsedPath.name}.perf.json`);
console.log('writePath', writePath);

(async () => {
    const perf = await epiteleteHtml.readPerf('PSA');
    fs.writeFileSync(writePath, JSON.stringify(perf));

    console.log('Finished.');
})();
