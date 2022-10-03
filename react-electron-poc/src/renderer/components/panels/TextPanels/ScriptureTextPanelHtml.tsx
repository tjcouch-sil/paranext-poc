import { getScriptureHtml } from '@services/ScriptureService';
import {
    ScriptureChapter,
    ScriptureChapterString,
} from '@shared/data/ScriptureTypes';
import { parseChapter, parseVerse } from '@util/ScriptureUtil';
import { isValidValue } from '@util/Util';
import { EventHandler, useCallback, useEffect, useRef, useState } from 'react';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import {
    ScriptureTextPanelHOC,
    ScriptureTextPanelHOCProps,
} from './ScriptureTextPanelHOC';
import './TextPanel.css';

/** Regex for parsing cvCHAPTER_VERSE ids in the html supplied by Paratext */
const regexpChapterVerseId = /cv(\d+)_(\d+)/;

export interface ScriptureTextPanelHtmlProps
    extends ScriptureTextPanelHOCProps {
    scrChapters: ScriptureChapterString[];
}

/** The function to use to get the Scripture chapter content to display */
const getScrChapter = getScriptureHtml;

export const ScriptureTextPanelHtml = ScriptureTextPanelHOC(
    ({
        shortName,
        editable,
        book,
        chapter,
        verse,
        scrChapters,
        updateScrRef,
    }: ScriptureTextPanelHtmlProps) => {
        /** Ref for the top-level editor div */
        const editorRef = useRef<HTMLDivElement>(null);

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

        /**
         * Whether or not the upcoming scrRef update is form this text panel.
         * TODO: Not a great way to determine this - should be improved in the future
         * */
        const didIUpdateScrRef = useRef(false);

        const tryUpdateScrRef = () => {
            const windowSel = window.getSelection();
            if (windowSel && windowSel.rangeCount > 0) {
                // Set reference to the current verse
                // We must be in a chapter
                let selectedChapter = -1;
                // Intro material should be shown as verse 0, so allow 0
                let selectedVerse = 0;

                // Get the selected node
                let node = windowSel.getRangeAt(0).startContainer;

                // Step up the node tree via previous siblings then parents all the way up until we find a chapter and verse
                while (node && node !== editorRef.current) {
                    if (node instanceof Element) {
                        if (selectedVerse <= 0 && node.className === 'usfm_v') {
                            // It's a verse, so try to parse its text and use that as the verse
                            const textParts = node.textContent?.split(' ');
                            if (textParts) {
                                const verseText =
                                    textParts[textParts.length - 1];
                                const verseNum = parseVerse(verseText);
                                if (isValidValue(verseNum)) {
                                    selectedVerse = verseNum;
                                }
                            }
                        } else if (
                            selectedChapter < 0 &&
                            node.className === 'usfm_c'
                        ) {
                            // It's a chapter, so try to parse its text and use that as the chapter
                            const textParts = node.textContent?.split(' ');
                            if (textParts) {
                                const chapterText =
                                    textParts[textParts.length - 1];
                                const chapterNum = parseChapter(chapterText);
                                if (isValidValue(chapterNum)) {
                                    selectedChapter = chapterNum;
                                }
                            }
                        }
                    }

                    if (selectedChapter >= 0) {
                        // We got our results! Done
                        break;
                    } else if (node.previousSibling) {
                        // This node has a previous sibling. Get the lowest node of the previous sibling and try again
                        node = node.previousSibling;
                        while (node.hasChildNodes()) {
                            node = node.lastChild as ChildNode;
                        }
                    } else {
                        // This is the first node of its siblings, so get the parent and try again
                        node = node.parentNode as ParentNode;
                    }
                }

                // If we found verse info, set the selection
                if (selectedChapter > 0) {
                    updateScrRef({
                        book,
                        chapter: selectedChapter,
                        verse: selectedVerse,
                    });
                    didIUpdateScrRef.current = true;
                }
            }
        };

        const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!event.altKey)
                switch (event.key) {
                    case 'ArrowDown':
                    case 'ArrowUp':
                    case 'ArrowLeft':
                    case 'ArrowRight':
                        // TODO: For some reason, the onKeyDown callback doesn't always have the most up-to-date editor.selection.
                        // As such, I added a setTimeout, which is gross. Please fix this hacky setTimeout
                        setTimeout(() => {
                            tryUpdateScrRef();
                        }, 1);
                        break;
                    default:
                        break;
                }
        };

        // When the scrRef changes, scroll to view
        useEffect(() => {
            // TODO: Determine if this window should scroll by computing if the verse element is visible instead of using hacky didIUpdateScrRef
            if (!didIUpdateScrRef.current && editorRef.current) {
                // Get the node for the specified chapter editor
                let editorElement: Element | undefined;
                let chapterElement: Element | undefined;
                // Get all the usfm elements (full chapters)
                const usfmElements =
                    editorRef.current.getElementsByClassName('usfm');
                for (let i = 0; i < usfmElements.length; i++) {
                    // If we already found our chapter, we're done
                    if (editorElement) break;

                    // Get the chapter element within the current usfm element
                    const chapterElements =
                        usfmElements[i].getElementsByClassName('usfm_c');
                    for (let j = 0; j < chapterElements.length; j++) {
                        // Check if this usfm element is the right one for this chapter
                        const idMatch =
                            chapterElements[j].id.match(regexpChapterVerseId);
                        if (
                            idMatch &&
                            idMatch.length >= 2 &&
                            parseChapter(idMatch[1]) === chapter
                        ) {
                            editorElement = usfmElements[i];
                            chapterElement = chapterElements[j];
                            break;
                        }
                    }
                }

                if (editorElement) {
                    // Get the element for the specified verse
                    let verseElement: Element | undefined;

                    // If the verse we're trying to scroll to is 0, scroll to the chapter
                    if (verse <= 0) {
                        verseElement = chapterElement;
                    } else {
                        // Get all the verse elements for this chapter
                        const verseElements =
                            editorElement.getElementsByClassName('usfm_v');
                        for (let i = 0; i < verseElements.length; i++) {
                            // Check if this verse element is the right one for this verse
                            const idMatch =
                                verseElements[i].id.match(regexpChapterVerseId);
                            if (
                                idMatch &&
                                idMatch.length >= 3 &&
                                parseVerse(idMatch[2]) === verse
                            ) {
                                verseElement = verseElements[i];
                                break;
                            }
                        }
                    }

                    if (verseElement)
                        verseElement.scrollIntoView({
                            block: 'center',
                            behavior: 'smooth',
                        });
                }
            }
            didIUpdateScrRef.current = false;
        }, [book, chapter, verse]);

        return (
            <div ref={editorRef} className="text-panel">
                {editable
                    ? editableScrChapters.current.map((scrChapter) => (
                          <ContentEditable
                              html={scrChapter.contents as string}
                              onChange={(e) =>
                                  handleChange(e, scrChapter.chapter)
                              }
                              // Couldn't use onSelect here because of what is likely a bug in ContentEditable - onSelect fired multiple times, sometimes going to the end of the div before restoring to the correct location
                              onClick={tryUpdateScrRef}
                              onKeyDown={onKeyDown}
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
