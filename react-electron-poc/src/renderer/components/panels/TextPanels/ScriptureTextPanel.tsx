import {
    getScriptureStyle,
    getScriptureHtml,
} from '@services/ScriptureService';
import {
    ResourceInfo,
    ScriptureChapter,
    ScriptureReference,
} from '@shared/data/ScriptureTypes';
import { isValidValue } from '@util/Util';
import { useCallback, useEffect, useRef, useState } from 'react';
import usePromise from 'renderer/hooks/usePromise';
import useStyle from 'renderer/hooks/useStyle';
import './TextPanel.css';

export interface ScriptureTextPanelProps
    extends ScriptureReference,
        ResourceInfo {}

export const ScriptureTextPanel = ({
    shortName,
    editable,
    book,
    chapter,
    verse,
}: ScriptureTextPanelProps) => {
    useStyle(
        useCallback(async () => {
            // TODO: Fix RTL scripture style sheets
            if (!shortName) return undefined;
            const style = await getScriptureStyle(shortName);
            return shortName !== 'OHEB' && shortName !== 'zzz1'
                ? style
                : undefined;
        }, [shortName]),
    );

    const [scrChapters] = usePromise<ScriptureChapter[]>(
        useCallback(async () => {
            if (!shortName || !isValidValue(book) || !isValidValue(chapter))
                return null;
            return getScriptureHtml(shortName, book, chapter);
        }, [shortName, book, chapter]),
        useState<ScriptureChapter[]>([
            { chapter: -1, contents: `Loading ${shortName}...` },
        ])[0],
    );

    return (
        <div className="text-panel">
            {scrChapters.map((scrChapter) => (
                <div
                    // TODO: Add chapter number to the index passed in
                    key={scrChapter.chapter}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                        __html: scrChapter.contents as string,
                    }}
                />
            ))}
        </div>
    );
};
