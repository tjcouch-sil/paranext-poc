import { useMemo } from 'react';
import { getScripture } from '@services/ScriptureService';
import EpiteleteHtml, { PerfDocument } from 'epitelete-html';
import { useProskomma, useImport, Selectors } from 'proskomma-react-hooks';
// import { useDeepCompareMemo } from 'use-deep-compare';
import { ScriptureTextPanelHOC } from './ScriptureTextPanelHOC';
import { ScriptureTextPanelSlateProps } from './ScriptureTextPanelSlate';
import Editor from './Xelah/Editor';
import perfJson from '../../../../../assets/testScripture/CSB/19PSACSB.perf.json';
import data from '../../../../../assets/testScripture/CSB/19PSACSB.usfm';
// import data from '../../../../../assets/testScripture/19PSAengWEB14.usfm';
// import data from '../../../../../assets/testScripture/zzz6/19PSAzzz6.usfm';
import '../../../../../node_modules/@xelah/type-perf-html/build/components/HtmlPerfEditor.css';
import '../../../../../node_modules/@xelah/type-perf-html/build/components/HtmlSequenceEditor.css';

const getDocument = ({
    selectors,
    bookCode,
}: {
    selectors: Selectors;
    bookCode: string;
}) => ({
    selectors,
    bookCode,
    data,
});

const selectors: Selectors = {
    org: 'unknown',
    lang: 'en',
    abbr: 'csb_psa_book',
};

const documents = [
    getDocument({
        bookCode: 'PSA',
        selectors,
    }),
];

const onImport = (props: Selectors & { bookCode: string }) =>
    console.log('Imported doc!', props);

const getDocSetId = ({ org, lang, abbr }: Selectors): string =>
    `${org}/${lang}_${abbr}`;

const epiteleteHtml = new EpiteleteHtml({
    docSetId: getDocSetId(selectors),
    options: { historySize: 100 },
});

(async () => {
    await epiteleteHtml.sideloadPerf('PSA', perfJson as PerfDocument);
})();

/**
 * Scripture text panel that uses Xelah to render the Scripture in JSON format.
 * Used internally only in this file for displaying Slate JSON from different sources.
 */
function ScriptureTextPanelJSON(
    props: ScriptureTextPanelSlateProps,
): JSX.Element {
    const { scrChapters, onFocus } = props;
    const debug = false;

    const scrChaptersPretty = useMemo(
        () => JSON.stringify(scrChapters, undefined, 2),
        [scrChapters],
    );

    const verbose = true;
    /*
    const proskommaHook = useProskomma({ verbose });
    const { proskomma } = proskommaHook;

    const { importing, done } = useImport({
        ...proskommaHook,
        onImport,
        documents,
        verbose,
    });

    const ready = !importing && done;

    const epiteleteHtml = useDeepCompareMemo<EpiteleteHtml | undefined>(
        () =>
            ready
                ? new EpiteleteHtml({
                      proskomma,
                      docSetId: getDocSetId(selectors),
                      options: { historySize: 100 },
                  })
                : undefined,
        [proskomma, ready, selectors],
    );
*/
    return (
        <div className="text-panel" onFocus={onFocus}>
            <Editor
                epiteleteHtml={epiteleteHtml}
                bookId="PSA"
                verbose={verbose}
                activeReference={{
                    bookId: 'PSA',
                    chapter: 119,
                    verse: 1,
                }}
            />
            {debug && <p>Scripture Chapter Data:</p>}
            {debug && <pre>{scrChaptersPretty}</pre>}
        </div>
    );
}

// eslint-disable-next-line import/prefer-default-export
export const ScriptureTextPanelXelah = ScriptureTextPanelHOC(
    ScriptureTextPanelJSON,
    getScripture,
);
