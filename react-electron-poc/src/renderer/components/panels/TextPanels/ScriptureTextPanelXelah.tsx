import { useMemo } from 'react';
import { getScripture } from '@services/ScriptureService';
import EpiteleteHtml from 'epitelete-html';
import { useProskomma, useImport } from 'proskomma-react-hooks';
import { useDeepCompareMemo } from 'use-deep-compare';
import { ScriptureTextPanelHOC } from './ScriptureTextPanelHOC';
import { ScriptureTextPanelSlateProps } from './ScriptureTextPanelSlate';
import Editor from './Xelah/Editor';
import data from '../../../../../assets/testScripture/LSG/86-TITfraLSG.usfm';
import '../../../../../node_modules/@xelah/type-perf-html/build/components/HtmlPerfEditor.css';
import '../../../../../node_modules/@xelah/type-perf-html/build/components/HtmlSequenceEditor.css';

const urlDocument = ({
    selectors,
    bookCode,
    ...props
}: {
    selectors: {
        /** Selector: Organization or Owner for context */
        org: string;
        /** Selector: Language abbreviation */
        lang: string;
        /** Selector: Abbreviation for Bible Translation (ULT) */
        abbr: string;
    };
    bookCode: string;
}) => ({
    selectors,
    bookCode,
    // url: `/assets/testScripture/LSG/86-TITfraLSG.usfm`,
    data,
});

const documents = [
    urlDocument({
        bookCode: 'tit',
        selectors: { org: 'KentR1235', lang: 'fr', abbr: 'lsg_tit_book' },
    }),
];

const onImport = (props: string) => console.log('Imported doc!', props);

/**
 * Scripture text panel that uses Xelah to render the Scripture in JSON format.
 * Used internally only in this file for displaying Slate JSON from different sources.
 */
function ScriptureTextPanelJSON(
    props: ScriptureTextPanelSlateProps,
): JSX.Element {
    const { scrChapters, onFocus } = props;

    const scrChaptersPretty = useMemo(
        () => JSON.stringify(scrChapters, undefined, 2),
        [scrChapters],
    );

    const verbose = true;
    const proskommaHook = useProskomma({ verbose });
    const { proskomma } = proskommaHook;

    const { importing, done } = useImport({
        ...proskommaHook,
        onImport,
        documents,
        verbose,
    });

    const ready = !importing && done;

    const docSetId = 'KentR1235/fr_lsg_tit_book';

    const epiteleteHtml = useDeepCompareMemo<EpiteleteHtml | undefined>(
        () =>
            ready
                ? new EpiteleteHtml({
                      proskomma,
                      docSetId,
                      options: { historySize: 100 },
                  })
                : undefined,
        [proskomma, ready, docSetId],
    );

    return (
        <div className="text-panel" onFocus={onFocus}>
            <Editor
                epiteleteHtml={epiteleteHtml}
                bookId="TIT"
                verbose={false}
                activeReference={{
                    bookId: 'TIT',
                    chapter: 1,
                    verse: 4,
                }}
            />
            <p>Scripture Chapter Data:</p>
            <pre>{scrChaptersPretty}</pre>
        </div>
    );
}

// eslint-disable-next-line import/prefer-default-export
export const ScriptureTextPanelXelah = ScriptureTextPanelHOC(
    ScriptureTextPanelJSON,
    getScripture,
);
