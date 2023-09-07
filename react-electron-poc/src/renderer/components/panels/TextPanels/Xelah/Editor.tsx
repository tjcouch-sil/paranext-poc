/**
 * Converted to typescript from UnfoldingWord uw-editor.
 * @see https://github.com/unfoldingWord/uw-editor/blob/main/src/components/Editor.jsx
 */

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/jsx-props-no-spreading */
import {
    useState,
    useEffect,
    useRef,
    useCallback,
    MouseEvent,
    useMemo,
} from 'react';
import { useDeepCompareCallback, useDeepCompareMemo } from 'use-deep-compare';
import isEqual from 'lodash.isequal';
import { HtmlPerfEditor } from '@xelah/type-perf-html';
import EpiteleteHtml, { HtmlPerf } from 'epitelete-html';
import { Skeleton, Stack } from '@mui/material';
import useEditorState from '../../../../hooks/useEditorState';
import Section from './Section';
import SectionHeading from './SectionHeading';
import SectionBody from './SectionBody';
import RecursiveBlock, { OnReferenceSelected } from './RecursiveBlock';
import Buttons from './Buttons';

type SectionIndices = { [sequenceId: string]: number };

type WObj = {
    word: string;
    occurrence: number;
    totalOccurrences: number;
};
type WordObj = { id?: string; wObj: WObj };
type ChObj = { [vNum: string]: WObj[] };
type WordsObj = { [chNum: string]: ChObj };
type FlatWordObj = { [key: string]: Omit<WordObj, 'id'> };

type XelahEditorProps = {
    /** Method to call when save button is pressed */
    onSave?(bookCode: string, usfmText: string): void;
    /** Instance of EpiteleteHtml class */
    epiteleteHtml?: EpiteleteHtml;
    /** bookId to identify the content in the editor */
    bookId: string;
    /** Whether to show extra info in the js console */
    verbose: boolean;
    /** Book, chapter, verse to scroll to and highlight */
    activeReference: {
        bookId: string;
        chapter: string | number;
        verse: string | number;
    };
    /** Callback triggered when a verse is clicked on */
    onReferenceSelected?: OnReferenceSelected;
};

export default function Editor(props: XelahEditorProps) {
    const {
        onSave,
        epiteleteHtml,
        bookId,
        verbose = false,
        activeReference,
        onReferenceSelected,
    } = props;

    const [htmlPerf, setHtmlPerf] = useState<HtmlPerf>();
    const [orgUnaligned, setOrgUnaligned] = useState<FlatWordObj>();
    const [brokenAlignedWords, setBrokenAlignedWords] = useState<string[]>();
    const [anchorEl, setAnchorEl] = useState<Element | null>(null);
    const [blockIsEdited, setBlockIsEdited] = useState(false);

    const bookCode = bookId.toUpperCase();

    const readOptions = { readPipeline: 'stripAlignmentPipeline' };
    const [sectionIndices, setSectionIndices] = useState<SectionIndices>({});
    const [hasIntroduction, setHasIntroduction] = useState(false);

    const [epLastSaveUndoInx, setEpLastSaveUndoInx] = useState<number>();
    const [epUndoInx, setEpUndoInx] = useState<number>();

    // Avoid sync problems (due to updates in two directions) by setting the below flag
    // i.e. always update in a single direction; either read from Epitelete-html or write to it...
    const [epCachedDataLoaded, setEpCachedDataLoaded] = useState(false);

    const hasUnsavedData =
        (epUndoInx !== null && epLastSaveUndoInx !== epUndoInx) || false;

    const getFlatWordObj = useCallback((obj: WordsObj) => {
        const arrayToObject = (array: WordObj[], keyField: keyof WordObj) =>
            array.reduce((res, item) => {
                if (keyField !== 'id') return res;
                const iCopy = { ...item };
                delete iCopy[keyField];
                const key = item[keyField];
                if (key) res[key] = iCopy;
                return res;
            }, {} as FlatWordObj);

        const resArray: WordObj[] = [];
        if (obj) {
            Object.entries(obj).forEach(([chNum, chObj]) => {
                Object.entries(chObj).forEach(([vNum, verseArr]) => {
                    verseArr.forEach((wObj) => {
                        const occurrenceStr =
                            wObj?.totalOccurrences > 1
                                ? `-${wObj?.occurrence}/${wObj?.totalOccurrences}`
                                : '';
                        resArray.push({
                            id: `${chNum}:${vNum}-${wObj?.word}${occurrenceStr}`,
                            wObj,
                        });
                    });
                });
            });
        }
        return arrayToObject(resArray, 'id');
    }, []);

    const setOrgUndoInx = useCallback(() => {
        if (!epCachedDataLoaded && epiteleteHtml?.history[bookCode]) {
            // Read data from Epitelete-html
            const prevUndoInx = epiteleteHtml?.history[bookCode]?.undoInx;
            const newEpLastSaveUndoInx =
                epiteleteHtml?.history[bookCode]?.lastSaveUndoInx;
            setEpUndoInx(prevUndoInx || 0);
            setEpLastSaveUndoInx(newEpLastSaveUndoInx || 0);
            setEpCachedDataLoaded(true);
        }
    }, [bookCode, epiteleteHtml?.history, epCachedDataLoaded]);

    useEffect(() => {
        // Initial update - called on initial mount
        setOrgUndoInx();
    }, [setOrgUndoInx]);

    useEffect(() => {
        if (epCachedDataLoaded && epiteleteHtml?.history[bookCode]) {
            // Write data to Epitelete-html
            // I.e cache a copy of these internal values externally (in Epitelete-html)
            const tmpObj = epiteleteHtml?.history[bookCode];
            if (epLastSaveUndoInx !== null)
                tmpObj.lastSaveUndoInx = epLastSaveUndoInx;
            if (epUndoInx !== null) tmpObj.undoInx = epUndoInx;
            epiteleteHtml.history[bookCode] = { ...tmpObj };
        }
    }, [
        epiteleteHtml,
        bookCode,
        epUndoInx,
        epLastSaveUndoInx,
        epCachedDataLoaded,
    ]);

    const setOrgHtml = useCallback(
        (newHtmlPerf: HtmlPerf) => {
            const _alignmentData = epiteleteHtml?.getPipelineData(bookCode);
            setOrgUnaligned(
                getFlatWordObj(_alignmentData?.unalignedWords as WordsObj),
            );
            setOrgUndoInx();
            setHtmlPerf(newHtmlPerf);
        },
        [epiteleteHtml, bookCode, getFlatWordObj, setOrgUndoInx],
    );

    useEffect(() => {
        // Roundtrip - get html and alignment data
        if (epiteleteHtml) {
            // eslint-disable-next-line promise/catch-or-return
            epiteleteHtml
                .readHtml(bookCode, { readPipeline: 'stripAlignmentPipeline' })
                .then((_htmlPerf) => setOrgHtml(_htmlPerf));
        }
    }, [bookCode, epiteleteHtml, setOrgHtml]);

    const handleUnalignedClick = (event: MouseEvent) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const setHtmlAndUpdateUnaligned = (newHtmlPerf: HtmlPerf) => {
        if (!orgUnaligned) return;

        const _alignmentData = epiteleteHtml?.getPipelineData(bookCode);
        const nextUnalignedData = getFlatWordObj(
            _alignmentData?.unalignedWords as WordsObj,
        );
        const diffUnaligned = Object.keys(orgUnaligned)
            .filter((x) => !nextUnalignedData[x])
            .concat(
                Object.keys(nextUnalignedData).filter((x) => !orgUnaligned[x]),
            );
        setBrokenAlignedWords(diffUnaligned);
        setHtmlPerf(newHtmlPerf);
    };

    const incUndoInx = () => setEpUndoInx((prev) => (prev ? prev + 1 : prev));

    const decUndoInx = () => {
        setEpUndoInx((prev) => (prev && prev > 0 ? prev - 1 : 0));
    };

    const onInput = () => {
        if (!blockIsEdited) {
            incUndoInx();
            setBlockIsEdited(true);
        }
    };

    const onHtmlPerf = useDeepCompareCallback(
        (_htmlPerf, { sequenceId }) => {
            setBlockIsEdited(false);
            const perfChanged = !isEqual(htmlPerf, _htmlPerf);
            if (perfChanged) setHtmlPerf(_htmlPerf);

            if (verbose) console.log('onhtmlperf', perfChanged);
            const saveNow = async () => {
                const writeOptions = {
                    writePipeline: 'mergeAlignmentPipeline',
                    readPipeline: 'stripAlignmentPipeline',
                };
                const newHtmlPerf = await epiteleteHtml?.writeHtml(
                    bookCode,
                    sequenceId,
                    _htmlPerf,
                    writeOptions,
                );
                if (verbose)
                    console.log({
                        info: 'Saved sequenceId',
                        bookCode,
                        sequenceId,
                    });

                const isPerfChanged = !isEqual(htmlPerf, newHtmlPerf);
                if (isPerfChanged && newHtmlPerf) {
                    setHtmlAndUpdateUnaligned(newHtmlPerf);
                }
            };
            saveNow();
        },
        [htmlPerf, bookCode, orgUnaligned, setBrokenAlignedWords, setHtmlPerf],
    );

    const handleSave = async () => {
        setEpLastSaveUndoInx(epUndoInx);
        setBlockIsEdited(false);
        const usfmText = await epiteleteHtml?.readUsfm(bookCode);
        if (onSave && usfmText) onSave(bookCode, usfmText);
    };

    const undo = async () => {
        decUndoInx();
        setBlockIsEdited(false);
        const newPerfHtml = await epiteleteHtml?.undoHtml(
            bookCode,
            readOptions,
        );
        if (newPerfHtml) setHtmlAndUpdateUnaligned(newPerfHtml);
    };

    const redo = async () => {
        incUndoInx();
        setBlockIsEdited(false);
        const newPerfHtml = await epiteleteHtml?.redoHtml(
            bookCode,
            readOptions,
        );
        if (newPerfHtml) setHtmlAndUpdateUnaligned(newPerfHtml);
    };

    const canUndo = blockIsEdited || epiteleteHtml?.canUndo(bookCode);
    const canRedo = !blockIsEdited && epiteleteHtml?.canRedo(bookCode);
    const canSave = blockIsEdited || hasUnsavedData;

    const {
        state: { sectionable, blockable, editable, preview },
        actions: { setSequenceIds, addSequenceId, setSequenceId, setToggles },
    } = useEditorState({
        sequenceIds: [htmlPerf?.mainSequenceId as string],
        ...props,
    });

    const sequenceIds: (string | undefined)[] = useMemo(
        () => [htmlPerf?.mainSequenceId],
        [htmlPerf?.mainSequenceId],
    );
    const sequenceId = htmlPerf?.mainSequenceId as keyof SectionIndices;

    const style = !sequenceId ? { cursor: 'progress' } : {};

    useEffect(() => {
        if (htmlPerf && !sequenceIds) {
            setSequenceIds([htmlPerf.mainSequenceId]);
            setSequenceId(htmlPerf.mainSequenceId);
        }
    }, [htmlPerf, sequenceIds, setSequenceId, setSequenceIds]);

    const sectionIndex = useDeepCompareMemo(
        () => sectionIndices[sequenceId] || 0,
        [sectionIndices, sequenceId],
    );

    // eslint-disable-next-line no-unused-vars
    const onSectionClick = useDeepCompareCallback(
        ({ content: _content, index }) => {
            const _sectionIndices = { ...sectionIndices };
            _sectionIndices[sequenceId] = index;
            setSectionIndices(_sectionIndices);
        },
        [setSectionIndices, sectionIndices],
    );

    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const firstChapterHeading = editorRef.current?.querySelector(
            `.MuiAccordion-root[index="${sectionIndices[sequenceId]}"] .sectionHeading`,
        );
        if (firstChapterHeading) {
            const hasIntro =
                Number(
                    (firstChapterHeading as HTMLElement).dataset.chapterNumber,
                ) === sectionIndices[sequenceId];
            setHasIntroduction(hasIntro);
        }
    }, [sequenceId, sectionIndices]);

    useEffect(() => {
        if (htmlPerf && sequenceId && editorRef.current && activeReference) {
            const { chapter, verse } = activeReference;

            const _sectionIndices = { ...sectionIndices };
            _sectionIndices[sequenceId] =
                Number(chapter) - (hasIntroduction ? 0 : 1);
            setSectionIndices(_sectionIndices);

            const existingVerse = editorRef.current.querySelector(
                `span.mark.verses.highlight-verse`,
            );
            if (existingVerse) {
                existingVerse.classList.remove('highlight-verse');
            }

            const verseElem = editorRef.current.querySelector(
                `span.mark.verses[data-atts-number='${verse}']`,
            );
            if (verseElem) {
                verseElem.classList.add('highlight-verse');
                verseElem.scrollIntoView({ block: 'center' });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeReference, htmlPerf, sequenceId, editorRef, hasIntroduction]);

    const skeleton = (
        <Stack spacing={1}>
            <Skeleton
                key="1"
                variant="text"
                height="8em"
                sx={{ bgcolor: 'white' }}
            />
            <Skeleton
                key="2"
                variant="rectangular"
                height="16em"
                sx={{ bgcolor: 'white' }}
            />
            <Skeleton
                key="3"
                variant="text"
                height="8em"
                sx={{ bgcolor: 'white' }}
            />
            <Skeleton
                key="4"
                variant="rectangular"
                height="16em"
                sx={{ bgcolor: 'white' }}
            />
        </Stack>
    );

    const handlers = {
        onSectionClick,
    };

    const options = {
        sectionable,
        blockable,
        editable,
        preview,
    };
    const htmlEditorProps = {
        htmlPerf,
        onInput,
        onHtmlPerf,
        sequenceIds,
        addSequenceId,
        components: {
            section: Section,
            sectionHeading: SectionHeading,
            sectionBody: SectionBody,
            block: (__props: any) =>
                RecursiveBlock({
                    htmlPerf,
                    onHtmlPerf,
                    sequenceIds,
                    addSequenceId,
                    onReferenceSelected,
                    ...__props,
                }),
        },
        options,
        handlers,
        decorators: {},
        sectionIndex,
        verbose,
    };

    const buttonsProps = {
        sectionable,
        blockable,
        editable,
        preview,
        allAligned: !brokenAlignedWords || brokenAlignedWords.length === 0,
        onShowUnaligned: handleUnalignedClick,
        undo,
        redo,
        canUndo,
        canRedo,
        setToggles,
        canSave,
        onSave: handleSave,
        showToggles: false,
    };
    return (
        <div key="1" className="Editor" style={style} ref={editorRef}>
            <Buttons {...buttonsProps} />
            {sequenceId && htmlPerf ? (
                <HtmlPerfEditor {...htmlEditorProps} />
            ) : (
                skeleton
            )}
        </div>
    );
}
