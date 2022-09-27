import {
    getScriptureStyle,
    getScriptureHtml,
} from '@services/ScriptureService';
import {
    ResourceInfo,
    ScriptureChapter,
    ScriptureChapterString,
    ScriptureReference,
} from '@shared/data/ScriptureTypes';
import { getTextFromScrRef } from '@util/ScriptureUtil';
import { isValidValue } from '@util/Util';
import { useCallback, useEffect, useRef, useState } from 'react';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import usePromise from 'renderer/hooks/usePromise';
import useStyle from 'renderer/hooks/useStyle';
import {
    ScriptureTextPanelHOC,
    ScriptureTextPanelHOCProps,
} from './ScriptureTextPanelHOC';
import './TextPanel.css';

export interface ScriptureTextPanelProps extends ScriptureTextPanelHOCProps {
    scrChapters: ScriptureChapterString[];
}

/** The function to use to get the Scripture chapter content to display */
const getScrChapter = getScriptureHtml;

export const ScriptureTextPanel = ScriptureTextPanelHOC(
    ({
        shortName,
        editable,
        book,
        chapter,
        verse,
        scrChapters,
    }: ScriptureTextPanelProps) => {
        // Make a ref for the Scripture that works with react-content-editable
        const editableScrChapters = useRef<ScriptureChapter[]>([
            {
                chapter: -1,
                contents: 'Loading',
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
        const handleChange = (
            evt: ContentEditableEvent,
            editedChapter: number,
        ) => {
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
                              onChange={(e) =>
                                  handleChange(e, scrChapter.chapter)
                              }
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
    },
    getScrChapter,
);
