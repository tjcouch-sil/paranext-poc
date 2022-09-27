import {
    getScriptureStyle,
    getScriptureHtml,
} from '@services/ScriptureService';
import {
    ResourceInfo,
    ScriptureChapter,
    ScriptureReference,
} from '@shared/data/ScriptureTypes';
import { getTextFromScrRef } from '@util/ScriptureUtil';
import { isValidValue } from '@util/Util';
import { useCallback, useEffect, useRef, useState } from 'react';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
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
    // Pull in the project's stylesheet
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

    // Get the project's contents
    const [scrChapters] = usePromise<ScriptureChapter[]>(
        useCallback(async () => {
            if (!shortName || !isValidValue(book) || !isValidValue(chapter))
                return null;
            return getScriptureHtml(shortName, book, chapter);
        }, [shortName, book, chapter]),
        useState<ScriptureChapter[]>([
            {
                chapter: -1,
                contents: `Loading ${shortName} ${getTextFromScrRef({
                    book,
                    chapter,
                    verse: -1,
                })}...`,
            },
        ])[0],
    );

    // Make a ref for the Scripture that works with react-content-editable
    const editableScrChapters = useRef<ScriptureChapter[]>([
        {
            chapter: -1,
            contents: `Loading ${shortName} ${getTextFromScrRef({
                book,
                chapter,
                verse: -1,
            })}...`,
        },
    ]);
    // Need to force refresh with react-content-editable
    const [, setForceRefresh] = useState<number>(0);
    const forceRefresh = useCallback(
        () => setForceRefresh((value) => value + 1),
        [setForceRefresh],
    );

    // When we get new Scripture project contents, update react-content-editable
    useEffect(() => {
        editableScrChapters.current = scrChapters;
        forceRefresh();
    }, [scrChapters, forceRefresh]);

    // Keep react-content-editable's ref data up-to-date
    const handleChange = (evt: ContentEditableEvent, editedChapter: number) => {
        const editedChapterInd = editableScrChapters.current.findIndex(
            (scrChapter) => scrChapter.chapter === editedChapter,
        );
        editableScrChapters.current[editedChapterInd] = {
            ...editableScrChapters.current[editedChapterInd],
            contents: evt.target.value,
        };
    };

    return (
        <div className="text-panel">
            {editable
                ? editableScrChapters.current.map((scrChapter) => (
                      <ContentEditable
                          className="text-panel"
                          html={scrChapter.contents as string}
                          onChange={(e) => handleChange(e, scrChapter.chapter)}
                      />
                  ))
                : scrChapters.map((scrChapter) => (
                      <div
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
