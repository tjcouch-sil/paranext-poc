import { getScriptureUsx } from '@services/ScriptureService';
import { ScriptureChapterString } from '@shared/data/ScriptureTypes';
import { htmlEncode } from '@util/Util';
import { useLayoutEffect } from 'react';
import UsxEditor from 'usxeditor';
import {
    ScriptureTextPanelHOC,
    ScriptureTextPanelHOCProps,
} from './ScriptureTextPanelHOC';
import { EditorElements } from './ScriptureTextPanelSlate';

const UsxEditorParaMap =
    EditorElements.para.validStyles?.map((style) => style.style) || [];
const UsxEditorCharMap = Object.fromEntries(
    EditorElements.char.validStyles?.map((style) => [style.style, {}]) || [],
);

export interface ScriptureTextPanelUsxProps extends ScriptureTextPanelHOCProps {
    scrChapters: ScriptureChapterString[];
}

/**
 * Scripture text panel that inserts the chapter string into innerHTML or a contentEditable div.
 * Used internally only in this file for displaying different kinds of strings.
 * Originally built for Scripture HTML, so, if something doesn't work, it probably doesn't work because it's not an HTML panel.
 */
const ScriptureTextPanelUsxEditor = ({
    shortName,
    editable,
    book,
    chapter,
    verse,
    scrChapters,
    updateScrRef,
    onFocus,
}: ScriptureTextPanelUsxProps) => {
    useLayoutEffect(
        () =>
            console.debug(
                `Performance<ScriptureTextPanelUsxEditor>: finished rendering at ${performance.now()} ms from start.`,
            ),
        [],
    );

    return (
        <div className="text-panel" onFocus={onFocus}>
            {scrChapters.map((scrChapter) => (
                <UsxEditor
                    key={scrChapter.chapter}
                    usx={scrChapter.contents}
                    paraMap={UsxEditorParaMap}
                    charMap={UsxEditorCharMap}
                    onUsxChanged={() => {}}
                />
            ))}
        </div>
    );
};

/** Scripture text panel that displays USX Scripture */
export const ScriptureTextPanelUsx = ScriptureTextPanelHOC(
    ScriptureTextPanelUsxEditor,
    getScriptureUsx,
);
