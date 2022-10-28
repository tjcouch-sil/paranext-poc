import { performanceLog, startKeyDown } from '@services/PerformanceService';
import { getScriptureUsx } from '@services/ScriptureService';
import { ScriptureChapterString } from '@shared/data/ScriptureTypes';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState,
} from 'react';
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
    scrChapters,
    onFocus,
}: ScriptureTextPanelUsxProps) => {
    useLayoutEffect(
        () =>
            performanceLog({
                name: 'ScriptureTextPanelUsxEditor',
                operation: 'finished rendering',
                end: performance.now(),
                reportStart: true,
            }),
        [scrChapters],
    );

    /** performance.now() at the last time the keyDown event was run */
    const onKeyDown = useCallback(() => {
        startKeyDown.lastChangeTime = performance.now();
    }, []);

    // Hold scrChapters that we can edit in this USX Editor
    const [editableScrChapters, setEditableScrChapters] = useState<
        ScriptureChapterString[]
    >([...scrChapters]);
    // Update the editable scrChapters when scrChapters changes
    useEffect(() => {
        setEditableScrChapters([...scrChapters]);
    }, [scrChapters]);

    useLayoutEffect(() => {
        performanceLog({
            name: 'ScriptureTextPanelUsxEditor',
            operation: 'finished rendering',
            end: performance.now(),
            reportStart: true,
            reportChangeScrRef: true,
            reportKeyDown: true,
        });
    }, [editableScrChapters]);

    const onUsxChanged = useCallback(
        (editedChapter: number, updatedContents: string) => {
            const startWriteScripture = performance.now();
            performanceLog({
                name: 'ScriptureTextPanelUsxEditor.onUsxChanged',
                operation: 'starting onUsxChanged',
                end: startWriteScripture,
                reportKeyDown: true,
            });

            setEditableScrChapters((currentEditableScrChapters) => {
                const editedScrChapterIndex =
                    currentEditableScrChapters.findIndex(
                        (editableScrChapter) =>
                            editableScrChapter.chapter === editedChapter,
                    );

                if (editedScrChapterIndex >= 0) {
                    const editedScrChapters = [...currentEditableScrChapters];
                    const editedScrChapter =
                        editedScrChapters[editedScrChapterIndex];
                    editedScrChapters[editedScrChapterIndex] = {
                        ...editedScrChapter,
                        contents: updatedContents,
                    };
                    return editedScrChapters;
                }
                return currentEditableScrChapters;
            });
        },
        [setEditableScrChapters],
    );

    /** Memoized functions to set the editableScrChapter contents so we avoid rerendering the USX Editor when we can */
    const onUsxChangedPerScrChapter = useMemo<
        ((updatedContents: string) => void)[]
    >(() => {
        return scrChapters.map(
            (scrChapter) => (updatedContents: string) =>
                onUsxChanged(scrChapter.chapter, updatedContents),
        );
    }, [scrChapters, onUsxChanged]);

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div className="text-panel" onFocus={onFocus} onKeyDown={onKeyDown}>
            {scrChapters.map((scrChapter, ind) => (
                <UsxEditor
                    key={scrChapter.chapter}
                    usx={scrChapter.contents}
                    paraMap={UsxEditorParaMap}
                    charMap={UsxEditorCharMap}
                    onUsxChanged={onUsxChangedPerScrChapter[ind]}
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
