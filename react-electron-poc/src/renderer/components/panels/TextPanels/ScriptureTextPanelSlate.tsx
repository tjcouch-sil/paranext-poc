import { getScripture } from '@services/ScriptureService';
import { ScriptureChapterContent } from '@shared/data/ScriptureTypes';
import { isString } from '@util/Util';
import {
    createElement,
    FunctionComponent,
    PropsWithChildren,
    useCallback,
    useEffect,
    useState,
} from 'react';
import './TextPanel.css';
import { createEditor, BaseEditor, NodeEntry, Node, Transforms } from 'slate';
import {
    Slate,
    Editable,
    withReact,
    ReactEditor,
    RenderElementProps,
} from 'slate-react';
import {
    ScriptureTextPanelHOC,
    ScriptureTextPanelHOCProps,
} from './ScriptureTextPanelHOC';

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

/** Base element props. All elements should have a style */
type StyleProps = {
    style?: string;
};

type MarkerProps = {
    closingMarker?: boolean;
} & StyleProps;

type CustomElementProps = {
    children: CustomElement[];
} & StyleProps;

export type InlineElementProps = {
    endSpace?: boolean;
    closingMarker?: boolean;
} & MyRenderElementProps<CustomElementProps>;

export type VerseElementProps = {
    type: 'verse';
} & CustomElementProps;

export type ParaElementProps = {
    type: 'para';
} & CustomElementProps;

export type CharElementProps = {
    type: 'char';
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
    | CharElementProps
    | ChapterElementProps
    | EditorElementProps;

type FormattedText = { text: string } & MarkerProps;

type CustomText = FormattedText;

declare module 'slate' {
    interface CustomTypes {
        Editor: CustomEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

// Slate components

/* Renders markers' \marker text with the marker style */
const Marker = ({ style, closingMarker = false }: MarkerProps) => {
    return (
        <span className="marker" contentEditable={false}>
            {`\\${style}${closingMarker ? '' : ' '}`}
        </span>
    );
};

/** Prefix added to every marker name for its css class name */
const MARKER_CLASS_PREFIX = 'usfm_';

/** Renders a block-style element. Helper element - not actually rendered on its own */
const BlockElement = ({
    element: { style },
    attributes,
    children,
}: MyRenderElementProps<CustomElementProps>) => (
    <div className={`${MARKER_CLASS_PREFIX}${style}`} {...attributes}>
        <Marker style={style} />
        {children}
    </div>
);

/** Renders an inline-style element. Helper element - not actually rendered on its own */
const InlineElement = ({
    element: { style },
    attributes,
    children,
    endSpace = false,
    closingMarker = false,
}: InlineElementProps) => (
    <span className={`${MARKER_CLASS_PREFIX}${style}`} {...attributes}>
        <Marker style={style} />
        {children}
        {endSpace ? <span contentEditable={false}>&nbsp;</span> : undefined}
        {closingMarker ? (
            <Marker style={`${style}*`} closingMarker />
        ) : undefined}
    </span>
);

const VerseElement = (props: MyRenderElementProps<VerseElementProps>) => (
    <InlineElement {...props} endSpace />
);

/** Renders a complete block of text with an open marker at the start */
const ParaElement = (props: MyRenderElementProps<ParaElementProps>) => (
    <BlockElement {...props} />
);

/** Renders inline text with closed markers around it */
const CharElement = (props: MyRenderElementProps<CharElementProps>) => (
    <InlineElement {...props} closingMarker />
);

/** Renders a chapter number */
const ChapterElement = (props: MyRenderElementProps<ChapterElementProps>) => (
    <BlockElement {...props} />
);

/** Overall chapter editor element */
const EditorElement = ({
    element: { number },
    attributes,
    children,
}: MyRenderElementProps<EditorElementProps>) => (
    <div className="usfm" id={`editor-chapter-${number}`} {...attributes}>
        {children}
    </div>
);

/** All available elements for use in slate editor */
const EditorElements = {
    verse: VerseElement,
    para: ParaElement,
    char: CharElement,
    chapter: ChapterElement,
    editor: EditorElement,
};

/** List of all inline elements */
const InlineElements = ['verse', 'char'];

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
};

export interface ScriptureTextPanelProps extends ScriptureTextPanelHOCProps {
    scrChapters: ScriptureChapterContent[];
}

/** The function to use to get the Scripture chapter content to display */
const getScrChapter = getScripture;

export const ScriptureTextPanelSlate = ScriptureTextPanelHOC(
    ({
        shortName,
        editable,
        book,
        chapter,
        verse,
        scrChapters,
    }: ScriptureTextPanelProps) => {
        // Slate editor
        const [editor] = useState<CustomEditor>(() =>
            withScrMarkers(withScrInlines(withReact(createEditor()))),
        );

        // Render our components for this project
        const renderElement = useCallback(
            (props: MyRenderElementProps<CustomElement>): JSX.Element => {
                return createElement(
                    (EditorElements[props.element.type] ||
                        DefaultElement) as FunctionComponent,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    props as any,
                );
            },
            [],
        );

        // When we get new Scripture project contents, update slate
        useEffect(() => {
            if (scrChapters && scrChapters.length > 0) {
                // TODO: Save the verse...? Maybe if book/chapter was not changed?

                // Unselect
                Transforms.deselect(editor);

                // Replace the editor's contents
                editor.children = scrChapters.map(
                    (scrChapter) =>
                        ({
                            type: 'editor',
                            number: scrChapter.chapter.toString(),
                            children: isString(scrChapter.contents)
                                ? [
                                      {
                                          // TODO: When loading, the contents come as a string. Consider how to improve the loading value in ScriptureTextPanelHOC
                                          text: scrChapter.contents as unknown as string,
                                      } as CustomText,
                                  ]
                                : (scrChapter.contents as CustomElement[]),
                        } as EditorElementProps),
                );

                // TODO: Update cursor to new ScrRef

                editor.onChange();
            }
        }, [scrChapters, editor]);

        return (
            <div className="text-panel">
                <Slate editor={editor} value={[{ text: 'Loading' }]}>
                    <Editable
                        readOnly={!editable}
                        renderElement={renderElement}
                    />
                </Slate>
            </div>
        );
    },
    getScrChapter,
);
