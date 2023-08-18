import { useMemo } from 'react';
import { getScripture } from '@services/ScriptureService';
import { ScriptureTextPanelHOC } from './ScriptureTextPanelHOC';
import { ScriptureTextPanelSlateProps } from './ScriptureTextPanelSlate';

/**
 * Scripture text panel that uses Lexical to render the Scripture in JSON format.
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

    return (
        <div className="text-panel" onFocus={onFocus}>
            <p>Lexical Placeholder</p>
            <pre>{scrChaptersPretty}</pre>
        </div>
    );
}

// eslint-disable-next-line import/prefer-default-export
export const ScriptureTextPanelLexical = ScriptureTextPanelHOC(
    ScriptureTextPanelJSON,
    getScripture,
);
