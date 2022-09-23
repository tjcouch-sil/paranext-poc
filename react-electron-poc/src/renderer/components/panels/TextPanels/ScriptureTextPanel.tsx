import {
    getScriptureStyle,
    getScriptureHtml,
    getScripture,
} from '@services/ScriptureService';
import {
    ResourceInfo,
    ScriptureChapter,
    ScriptureReference,
} from '@shared/data/ScriptureTypes';
import { getTextFromScrRef } from '@util/ScriptureUtil';
import { isString, isValidValue } from '@util/Util';
import {
    createElement,
    FunctionComponent,
    PropsWithChildren,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import usePromise from 'renderer/hooks/usePromise';
import useStyle from 'renderer/hooks/useStyle';
import './TextPanel.css';
import { createEditor, BaseEditor, Descendant, NodeEntry, Node } from 'slate';
import {
    Slate,
    Editable,
    withReact,
    ReactEditor,
    RenderElementProps,
} from 'slate-react';

// Slate types
type CustomEditor = BaseEditor & ReactEditor;

// Types of components:
//      Element - contiguous, semantic elements in the document
//          - Ex: Marker Element (in-line) that contains a line and is formatted appropriately
//      Text - non-contiguous, character-level formatting
//      Decoration - computed at render-time based on the content itself
//          - helpful for dynamic formatting like syntax highlighting or search keywords, where changes to the content (or some external data) has the potential to change the formatting
//          - Ex: The text inside markers is styled literally based on if there's a \
//                The notes are based on certain text in a verse
//                Maybe we can make decorations that show the \markers before the lines? Otherwise need to be inline void elements
// Normalizing - enforce rules about your content like structure and such
//      - Ex: Enforce that a marker element has the \marker at the beginning

type MyRenderElementProps<T> = PropsWithChildren<
    {
        element: T;
    } & Omit<RenderElementProps, 'element' | 'children'>
>;

type CustomElementProps = {
    style: string;
    children: CustomElement[];
};

export type VerseElementProps = {
    type: 'verse';
} & CustomElementProps;

export type ParaElementProps = {
    type: 'para';
} & CustomElementProps;

export type ChapterElementProps = {
    type: 'chapter';
} & CustomElementProps;

export type EditorElementProps = {
    type: 'editor';
    number: string;
    children: CustomElement[];
};

export type CustomElement =
    | VerseElementProps
    | ParaElementProps
    | ChapterElementProps
    | EditorElementProps;

type FormattedText = { text: string; bold?: true };

type CustomText = FormattedText;

type CustomDescendant = CustomElement | CustomText;

declare module 'slate' {
    interface CustomTypes {
        Editor: CustomEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

// Slate components
/** Prefix added to every marker name for its css class name */
const MARKER_CLASS_PREFIX = 'usfm_';

/** Renders a block-style element. Helper element - not actually rendered on its own */
const BlockElement = ({
    element: { style },
    attributes,
    children,
}: MyRenderElementProps<CustomElementProps>) => (
    <div className={`${MARKER_CLASS_PREFIX}${style}`} {...attributes}>
        {children}
    </div>
);

/** Renders an inline-style element. Helper element - not actually rendered on its own */
const InlineElement = ({
    element: { style },
    attributes,
    children,
}: MyRenderElementProps<CustomElementProps>) => (
    <span className={`${MARKER_CLASS_PREFIX}${style}`} {...attributes}>
        {children}
    </span>
);

const VerseElement = (props: MyRenderElementProps<VerseElementProps>) => (
    <InlineElement {...props} />
);

/* Renders a complete block of text */
const ParaElement = (props: MyRenderElementProps<ParaElementProps>) => (
    <BlockElement {...props} />
);

/* Renders a chapter number */
const ChapterElement = (props: MyRenderElementProps<ChapterElementProps>) => (
    <BlockElement {...props} />
);

const EditorElement = ({
    element: { chapter },
    attributes,
    children,
}: MyRenderElementProps<EditorElementProps>) => (
    <div className="usfm" id={`editor-chapter-${chapter}`} {...attributes}>
        {children}
    </div>
);

/** All available elements for use in slate editor */
const EditorElements = {
    verse: VerseElement,
    para: ParaElement,
    chapter: ChapterElement,
    editor: EditorElement,
};

/** List of all inline elements */
const InlineElements = ['verse'];

/* Renders markers' \marker text with the marker style */
const MarkerDecoration = ({
    attributes,
    children,
}: MyRenderElementProps<MarkerElementProps>) => {
    return (
        <span className="marker" {...attributes}>
            {children}
        </span>
    );
};

const DefaultElement = ({ attributes, children }: RenderElementProps) => {
    return <p {...attributes}>{children}</p>;
};

const withScrInlines = (editor: CustomEditor): CustomEditor => {
    const { isInline } = editor;

    editor.isInline = (element: CustomElement): boolean =>
        InlineElements.includes(element.type) || isInline(element);

    return editor;
};

const withScrMarkers = (editor: CustomEditor): CustomEditor => {
    const { normalizeNode } = editor;

    editor.normalizeNode = (entry: NodeEntry<Node>): void => {
        const [node, path] = entry;

        // Make sure the marker-based elements all have markers
        normalizeNode(entry);
    };

    return editor;
}

export interface ScriptureTextPanelProps
    extends ScriptureReference,
        ResourceInfo {
    isSlate: boolean;
}

export const ScriptureTextPanel = ({
    shortName,
    editable,
    isSlate = true,
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
            return editable && isSlate
                ? getScripture(shortName, book, chapter)
                : getScriptureHtml(shortName, book, chapter);
        }, [shortName, book, chapter, editable, isSlate]),
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

    // Slate editor
    const [editor] = useState<CustomEditor>(() =>
        withScrMarkers(withScrInlines(withReact(createEditor()))),
    );

    // Render our components for this project
    const renderElement = useCallback(
        (props: MyRenderElementProps<CustomElement>): JSX.Element => {
            return createElement(
                EditorElements[props.element.type] as FunctionComponent,
                props,
            );
            /* switch (props.element.type) {
                case 'para':
                    return (
                        <MarkerElement
                            {...(props as MyRenderElementProps<MarkerElementProps>)}
                        />
                    );
                case 'chapter':
                    return (
                        <ChapterElement
                            {...(props as MyRenderElementProps<ChapterElementProps>)}
                        />
                    );
                default:
                    return (
                        <DefaultElement {...(props as RenderElementProps)} />
                    );
            } */
        },
        [],
    );

    // When we get new Scripture project contents, update slate
    useEffect(() => {
        if (scrChapters && scrChapters.length > 0) {
            editor.children = scrChapters.map(
                (scrChapter) =>
                    ({
                        type: 'editor',
                        number: scrChapter.chapter.toString(),
                        children: isString(scrChapter.contents)
                            ? [{ text: scrChapter.contents } as CustomText]
                            : (scrChapter.contents as CustomElement[]),
                    } as EditorElementProps),
            );
            /* [
                {
                    type: 'chapter',
                    style: 'c',
                    children: [{ text: scrChapters[0].contents as string }],
                },
            ]; */
            editor.onChange();
        }
    }, [scrChapters, editor]);

    return (
        <div className="text-panel">
            {editable &&
                !isSlate &&
                editableScrChapters.current.map((scrChapter) => (
                    <ContentEditable
                        className="text-panel"
                        html={scrChapter.contents as string}
                        onChange={(e) => handleChange(e, scrChapter.chapter)}
                    />
                ))}
            {editable && isSlate && (
                <Slate editor={editor} value={[{ text: 'This is a test' }]}>
                    <Editable
                        readOnly={!editable}
                        renderElement={renderElement}
                    />
                </Slate>
            )}
            {!editable &&
                scrChapters.map((scrChapter) => (
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
