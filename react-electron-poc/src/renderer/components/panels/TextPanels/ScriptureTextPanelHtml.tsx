import {
    getScriptureHtml,
    getScriptureRaw,
    getScriptureUsx,
} from '@services/ScriptureService';
import {
    ScriptureChapter,
    ScriptureChapterString,
} from '@shared/data/ScriptureTypes';
import {
    getTextFromScrRef,
    parseChapter,
    parseVerse,
} from '@util/ScriptureUtil';
import { htmlEncode, isValidValue } from '@util/Util';
import { useCallback, useEffect, useRef, useState } from 'react';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import {
    ScriptureTextPanelHOC,
    ScriptureTextPanelHOCProps,
} from './ScriptureTextPanelHOC';
import './TextPanel.css';

/** Regex for parsing cvCHAPTER_VERSE ids in the html supplied by Paratext */
const regexpChapterVerseId = /cv(\d+)_(\d+)/;

export interface ScriptureTextPanelStringProps
    extends ScriptureTextPanelHOCProps {
    scrChapters: ScriptureChapterString[];
}

/**
 * Scripture text panel that inserts the chapter string into innerHTML or a contentEditable div.
 * Used internally only in this file for displaying different kinds of strings.
 * Originally built for Scripture HTML, so, if something doesn't work, it probably doesn't work because it's not an HTML panel.
 */
const ScriptureTextPanelString = ({
    shortName,
    editable,
    book,
    chapter,
    verse,
    scrChapters,
    updateScrRef,
    onFocus,
}: ScriptureTextPanelStringProps) => {
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
    const handleChange = (evt: ContentEditableEvent, editedChapter: number) => {
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

    /** Look for the selection's current BCV and update the ScrRef to it */
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
                if (node instanceof Element && node.id) {
                    const idMatch = node.id.match(regexpChapterVerseId);
                    if (idMatch && idMatch.length >= 2) {
                        const verseNum = parseVerse(idMatch[2]);
                        const chapterNum = parseChapter(idMatch[1]);
                        if (
                            isValidValue(verseNum) &&
                            isValidValue(chapterNum)
                        ) {
                            selectedVerse = verseNum;
                            selectedChapter = chapterNum;
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
            // TODO: Find a better way to wait for the DOM to load before scrolling and hopefully remove scrChapters from dependencies. Ex: Go between Psalm 118:15 and Psalm 119:150
            setTimeout(() => {
                // Get the node for the specified chapter editor
                let editorElement: Element | undefined;
                let chapterElement: Element | undefined;
                // Get all the usfm elements (full chapters)
                if (editorRef.current) {
                    const usfmElements =
                        editorRef.current.getElementsByClassName('usfm');
                    for (let i = 0; i < usfmElements.length; i++) {
                        // If we already found our chapter, we're done
                        if (editorElement) break;

                        // Get the chapter element within the current usfm element
                        const currChapterElement =
                            usfmElements[i].querySelector('.usfm_c');
                        if (currChapterElement) {
                            // Check if this usfm element is the right one for this chapter
                            const idMatch =
                                currChapterElement.id.match(
                                    regexpChapterVerseId,
                                );
                            if (
                                idMatch &&
                                idMatch.length >= 2 &&
                                parseChapter(idMatch[1]) === chapter
                            ) {
                                editorElement = usfmElements[i];
                                chapterElement = currChapterElement;
                                break;
                            }
                        }
                    }

                    if (editorElement) {
                        // Get the element for the specified verse
                        let verseElement: Element | undefined | null;

                        // If the verse we're trying to scroll to is 0, scroll to the chapter
                        if (verse <= 0) {
                            verseElement = chapterElement;
                        } else {
                            verseElement = editorElement.querySelector(
                                `#cv${chapter}_${verse}`,
                            );
                        }

                        if (verseElement)
                            verseElement.scrollIntoView({
                                block: 'center',
                            });
                    }
                }
            }, 1);
        }
        didIUpdateScrRef.current = false;
    }, [scrChapters, book, chapter, verse]);

    return (
        <div ref={editorRef} className="text-panel" onFocus={onFocus}>
            {editable
                ? editableScrChapters.current.map((scrChapter) => (
                      <ContentEditable
                          html={scrChapter.contents as string}
                          onChange={(e) => handleChange(e, scrChapter.chapter)}
                          // Couldn't use onSelect here because of what is likely a bug in ContentEditable - onSelect fired multiple times, sometimes going to the end of the div before restoring to the correct location
                          onClick={tryUpdateScrRef}
                          onKeyDown={onKeyDown}
                      />
                  ))
                : scrChapters.map((scrChapter) => (
                      <div
                          // The following line was removed to match Paratext. Uncomment to make a cursor show up for keyboard navigation
                          // contentEditable
                          key={scrChapter.chapter}
                          // eslint-disable-next-line react/no-danger
                          dangerouslySetInnerHTML={{
                              __html: scrChapter.contents as string,
                          }}
                          onClick={tryUpdateScrRef}
                          onKeyDown={onKeyDown}
                          role="textbox"
                          tabIndex={0}
                          aria-label={`Scripture Text Panel for ${shortName} ${getTextFromScrRef(
                              { book, chapter, verse },
                          )}`}
                          onBeforeInput={(e) => e.preventDefault()}
                      />
                  ))}
        </div>
    );
};

/** Scripture text panel that displays HTML-formatted Scripture */
export const ScriptureTextPanelHtml = ScriptureTextPanelHOC(
    ScriptureTextPanelString,
    getScriptureHtml,
);

/** Scripture text panel that displays raw USFM Scripture */
export const ScriptureTextPanelUsfm = ScriptureTextPanelHOC(
    ScriptureTextPanelString,
    getScriptureRaw,
);

/** Scripture text panel that displays USX Scripture */
export const ScriptureTextPanelUsx = ScriptureTextPanelHOC(
    ScriptureTextPanelString,
    async (shortName, bookNum, chapter) => {
        const scr = await getScriptureUsx(shortName, bookNum, chapter);
        return scr.map((scrChapter) => ({
            ...scrChapter,
            contents: htmlEncode(scrChapter.contents),
        }));
    },
);
