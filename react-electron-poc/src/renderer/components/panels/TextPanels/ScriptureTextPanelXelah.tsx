import { useMemo } from 'react';
import { getScripture } from '@services/ScriptureService';
import EpiteleteHtml, { PerfDocument } from 'epitelete-html';
import { Selectors } from 'proskomma-react-hooks';
import { ScriptureTextPanelHOC } from './ScriptureTextPanelHOC';
import { ScriptureTextPanelSlateProps } from './ScriptureTextPanelSlate';
import Editor from './Xelah/Editor';
import perfJson from '../../../../../assets/testScripture/CSB/19PSACSB-combined.perf.json';
// import perfJson from '../../../../../assets/testScripture/CSB/19PSACSBempty.perf.json';
// import perfJson from '../../../../../assets/testScripture/CSB/19PSACSB.perf.json';
import '../../../../../node_modules/@xelah/type-perf-html/build/components/HtmlPerfEditor.css';
import '../../../../../node_modules/@xelah/type-perf-html/build/components/HtmlSequenceEditor.css';

const selectors: Selectors = {
    org: 'unknown',
    lang: 'eng',
    abbr: 'csb_psa_book',
};

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

    return (
        <div className="text-panel" onFocus={onFocus}>
            <Editor
                epiteleteHtml={epiteleteHtml}
                bookId="PSA"
                verbose={verbose}
                activeReference={{
                    bookId: 'PSA',
                    chapter: 1,
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
