import {
    getScripture,
    getScriptureJSONFromUsx,
    writeScripture,
} from '@services/ScriptureService';
import {
    ChapterElementProps,
    CharElementProps,
    CustomDescendant,
    CustomElement,
    CustomElementProps,
    CustomSlateEditor,
    CustomText,
    EditorElementProps,
    FormattedText,
    InlineElementProps,
    MarkerProps,
    MyRenderElementProps,
    ParaElementProps,
    ScriptureChapterContent,
    ScriptureContentChunk,
    VerseElementProps,
} from '@shared/data/ScriptureTypes';
import { debounce, isString, isValidValue, newGuid } from '@util/Util';
import React, {
    createElement,
    CSSProperties,
    FunctionComponent,
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import './TextPanel.css';
import {
    createEditor,
    NodeEntry,
    Node,
    Transforms,
    Element,
    Text,
    Editor,
    Point,
    Range,
    Path,
} from 'slate';
import {
    Slate,
    Editable,
    withReact,
    ReactEditor,
    RenderElementProps,
    RenderLeafProps,
    useSlate,
} from 'slate-react';
import {
    chunkScriptureChapter,
    getTextFromScrRef,
    parseChapter,
    parseVerse,
    startChangeScrRef,
    unchunkScriptureContent,
} from '@util/ScriptureUtil';
import { withHistory } from 'slate-history';
import isHotkey from 'is-hotkey';
import {
    Align,
    ListChildComponentProps,
    ListOnItemsRenderedProps,
    ListOnScrollProps,
    VariableSizeList,
} from 'react-window';
import ReactVirtualizedAutoSizer from 'react-virtualized-auto-sizer';
import {
    ScriptureTextPanelHOC,
    ScriptureTextPanelHOCProps,
} from './ScriptureTextPanelHOC';

// Slate components

/* Renders markers' \marker text with the marker style */
const Marker = ({ style, closingMarker = false }: MarkerProps) => {
    const slate = useSlate();

    // Only show the marker if the editor is editable and the marker style is defined
    // Any floating text without a specific paragraph marker needs a paragraph wrapper around it,
    // and that paragraph wrapper will not have a style.
    // This can happen if you try to type stuff after a one-word block element
    return slate.editable && style ? (
        <span className="marker" contentEditable={false}>
            {`\\${style}${closingMarker ? '' : ' '}`}
        </span>
    ) : (
        <></>
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
    // eslint-disable-next-line react/jsx-props-no-spreading
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
    // eslint-disable-next-line react/jsx-props-no-spreading
    <span className={`${MARKER_CLASS_PREFIX}${style}`} {...attributes}>
        <Marker style={style} />
        {children}
        {endSpace ? <span contentEditable={false}>&nbsp;</span> : undefined}
        {closingMarker ? (
            <Marker style={`${style}*`} closingMarker />
        ) : undefined}
    </span>
);

const VerseElement = memo((props: MyRenderElementProps<VerseElementProps>) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <InlineElement {...props} endSpace />
));

/** Renders a complete block of text with an open marker at the start */
const ParaElement = memo((props: MyRenderElementProps<ParaElementProps>) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <BlockElement {...props} />
));

/** Renders inline text with closed markers around it */
const CharElement = memo((props: MyRenderElementProps<CharElementProps>) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <InlineElement {...props} closingMarker />
));

/** performance.now() at the last time the keyDown event was run on a Slate editor */
const startKeyDown = { lastChangeTime: performance.now() };

/** Renders a chapter number */
const ChapterElement = memo(
    (props: MyRenderElementProps<ChapterElementProps>) => {
        useLayoutEffect(() => {
            const end = performance.now();
            console.debug(
                `Performance<ChapterElement>: finished rendering at ${end} ms from start, ${
                    end - startChangeScrRef.lastChangeTime
                } ms from changing scrRef, and ${
                    end - startKeyDown.lastChangeTime
                } ms from keyDown.`,
            );
        }, [props.children]);

        // eslint-disable-next-line react/jsx-props-no-spreading
        return <BlockElement {...props} />;
    },
);

/** Overall chapter editor element */
const EditorElement = memo(
    ({
        element: { number },
        attributes,
        children,
    }: MyRenderElementProps<EditorElementProps>) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <div className="usfm" id={`editor-chapter-${number}`} {...attributes}>
            {children}
        </div>
    ),
);

/** Characteristics of a marker style */
interface StyleInfo {
    /** The USFM marker name that corresponds to a CSS class selector */
    style: string;
    /** Whether this marker style can be closed (e.g. \nd and \nd*). In-line styles only. */
    canClose?: boolean;
    /** Whether this marker style only applies to the word following it (e.g. \v 2). In-line styles only. */
    oneWord?: boolean;
}

/** Characteristics of a Slate element */
interface ElementInfo {
    /** The React component to use to render this Slate element */
    component: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ((props: MyRenderElementProps<any>) => JSX.Element)
        | React.MemoExoticComponent<
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (props: MyRenderElementProps<any>) => JSX.Element
          >;
    /** Whether the element should be considered within one line or should be a block of text */
    inline?: boolean;
    /** Marker styles for this element. All marker styles should be unique. There should not be a marker style repeated between two elements. */
    validStyles?: StyleInfo[];
}

/** All available elements for use in slate editor */
export const EditorElements: { [type: string]: ElementInfo } = {
    verse: {
        component: VerseElement,
        inline: true,
        validStyles: [{ style: 'v', oneWord: true }],
    },
    para: {
        component: ParaElement,
        validStyles: [
            { style: 'p' },
            { style: 'q' },
            { style: 'q1' },
            { style: 'q2' },
            { style: 'q3' },
            { style: 'q4' },
            { style: 'qr' },
            { style: 'd' },
            { style: 'sp' },
            { style: 'b' },
            { style: 'pb' },
            { style: 'h' },
            { style: 'rem' },
            { style: 'toc' },
            { style: 'toc1' },
            { style: 'toc2' },
            { style: 'toc3' },
            { style: 'imt' },
            { style: 'imt1' },
            { style: 'imt2' },
            { style: 'imt3' },
            { style: 'imt4' },
            { style: 'imte' },
            { style: 'imte1' },
            { style: 'imte2' },
            { style: 'mt' },
            { style: 'mt1' },
            { style: 'mt2' },
            { style: 'mt3' },
            { style: 'mt4' },
            { style: 'mte' },
            { style: 'mte1' },
            { style: 'mte2' },
            { style: 'ms' },
            { style: 'ms1' },
            { style: 'mr' },
            { style: 'r' },
            { style: 'is' },
            { style: 'is1' },
            { style: 'is2' },
            { style: 's' },
            { style: 's1' },
            { style: 's2' },
            { style: 'iot' },
            { style: 'io' },
            { style: 'io1' },
            { style: 'io2' },
            { style: 'io3' },
            { style: 'io4' },
            { style: 'lit' },
            { style: 'id' },
        ],
    },
    char: {
        component: CharElement,
        inline: true,
        validStyles: [
            { style: 'nd', canClose: true },
            { style: 'bk', canClose: true },
            { style: 'pn', canClose: true },
            { style: 'wj', canClose: true },
            { style: 'k', canClose: true },
            { style: 'ord', canClose: true },
            { style: 'add', canClose: true },
            { style: 'no', canClose: true },
            { style: 'it', canClose: true },
            { style: 'bd', canClose: true },
            { style: 'bdit', canClose: true },
            { style: 'em', canClose: true },
            { style: 'sc', canClose: true },
            { style: 'sup', canClose: true },
        ],
    },
    chapter: {
        component: ChapterElement,
        validStyles: [{ style: 'c', oneWord: true }],
    },
    editor: { component: EditorElement },
};

/** Default renderer for slate elements - hopefully not used */
const DefaultElement = ({ attributes, children }: RenderElementProps) => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <p {...attributes}>{children}</p>;
};

/** Renderer for 'leaf' elements in Slate aka secret elements that wrap text */
const Leaf = memo(({ attributes, children, leaf }: RenderLeafProps) => {
    return (
        <span
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...attributes}
            className={`${leaf.searchResult ? 'search-result' : ''}`}
        >
            {children}
        </span>
    );
});

/** Initialize CustomSlateEditor variables for this editor */
const withCustomSlateEditor = (
    editor: CustomSlateEditor,
): CustomSlateEditor => {
    editor.editable = false;
    return editor;
};

/** Initialize ScriptureContentChunkInfo variables for this editor */
const withScrChunkEditor = (editor: CustomSlateEditor): CustomSlateEditor => {
    editor.chapter = -1;
    editor.chunkNum = -1;
    editor.startingVerse = -1;
    editor.finalVerse = -1;
    return editor;
};

/** Configure the editor to know which elements are in-line */
const withScrInlines = (editor: CustomSlateEditor): CustomSlateEditor => {
    const { isInline } = editor;

    editor.isInline = (element: CustomElement): boolean =>
        EditorElements[element.type]?.inline || isInline(element);

    return editor;
};

/** Adds proper displaying and editing of scripture markers */
const withScrMarkers = (editor: CustomSlateEditor): CustomSlateEditor => {
    const { normalizeNode, deleteBackward, deleteForward, insertText } = editor;

    editor.normalizeNode = (entry: NodeEntry<Node>): void => {
        // const [node, path] = entry;

        // TODO: Figure out how to make sure there is a spot to navigate between markers like \q \v
        /* if (Element.isElement(node)) {
            const firstChild = Node.child(node, 0);
            if (firstChild && Element.isElement(firstChild)) {
                Transforms.insertText(editor, '', { at: path.concat(0) });
            }
        } */

        normalizeNode(entry);
    };

    editor.deleteBackward = (...args) => {
        const { selection } = editor;

        // Delete in-line markers
        if (selection && Range.isCollapsed(selection)) {
            // Get the inline element in the path of the selection
            const match = Editor.above(editor, {
                match: (n) =>
                    !Editor.isEditor(n) &&
                    Element.isElement(n) &&
                    editor.isInline(n),
            });

            if (match) {
                const [, path] = match;
                const start = Editor.start(editor, path);

                // If the cursor is at the start of the inline element, remove the element
                if (Point.equals(selection.anchor, start)) {
                    Transforms.unwrapNodes(editor, { at: path });
                    return;
                }
            }
        }

        deleteBackward(...args);
    };

    editor.deleteForward = (...args) => {
        const { selection } = editor;

        // Delete in-line markers
        if (selection && Range.isCollapsed(selection)) {
            // Get the inline element in the path of the selection
            const match = Editor.above(editor, {
                match: (n) =>
                    !Editor.isEditor(n) &&
                    Element.isElement(n) &&
                    editor.isInline(n),
            });

            if (match) {
                const [, path] = match;
                const end = Editor.end(editor, path);

                // If the cursor is at the end of the inline element, remove the element
                if (Point.equals(selection.anchor, end)) {
                    Transforms.unwrapNodes(editor, { at: path });
                    return;
                }
            }
        }

        deleteForward(...args);
    };

    editor.insertText = (text) => {
        // TODO: Scan through the text, replace all markers, and insert rest of the text instead of only working on space
        const { selection } = editor;

        // Do special things when the user enters a space
        if (text.endsWith(' ') && selection && Range.isCollapsed(selection)) {
            const [selectedNode] = Editor.node(editor, selection.anchor);
            if (Text.isText(selectedNode)) {
                // Get the marker style of the element we're in
                let parentEditorElementEntry: ElementInfo | undefined;
                let parentMarkerStyleInfo: StyleInfo | undefined;
                const parentElementEntry = Editor.above(editor, {
                    match: (n) => !Editor.isEditor(n) && Element.isElement(n),
                });
                if (parentElementEntry) {
                    // We already checked that it is an element, so cast to NodeEntry<Element>
                    const [parentElement] =
                        parentElementEntry as NodeEntry<Element>;

                    // Get the marker style for the parent
                    parentEditorElementEntry =
                        EditorElements[parentElement.type];
                    if (
                        parentEditorElementEntry &&
                        parentEditorElementEntry.validStyles
                    ) {
                        parentMarkerStyleInfo =
                            parentEditorElementEntry.validStyles.find(
                                (styleInfo) =>
                                    styleInfo.style === parentElement.style,
                            );
                    }
                }

                if (parentMarkerStyleInfo?.oneWord) {
                    // We're in a oneWord element, so come out of it
                    // We know parentEditorElementEntry is defined because its child, parentMarkerStyleInfo is defined
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    if (!parentEditorElementEntry!.inline)
                        // Insert new para with no style
                        Transforms.insertNodes(
                            editor,
                            {
                                type: 'para',
                                style: undefined,
                                children: [{ text: '' }],
                            } as CustomElement,
                            { at: selection },
                        );

                    // If inline, come out of the element. If block, go to new line
                    Transforms.move(editor, {
                        distance: 1,
                        unit: 'offset',
                    });

                    // Don't insert the space or do anything else because we did what we needed to do
                    return;
                }
                // Insert new markers like \nd, \nd*, and \p
                // Figure out if the text before the offset has a backslash
                const backslashOffset = selectedNode.text.lastIndexOf(
                    '\\',
                    selection.anchor.offset,
                );

                if (backslashOffset >= 0) {
                    // Get the full marker text - backslash to space
                    const markerText = selectedNode.text
                        .substring(backslashOffset + 1, selection.anchor.offset)
                        .toLowerCase();
                    // Determine if it is a closing marker style
                    const isClosingMarker = markerText.endsWith('*');
                    // Get the marker style
                    const markerStyle = isClosingMarker
                        ? markerText.substring(0, markerText.length - 1)
                        : markerText;

                    let markerStyleInfo: StyleInfo | undefined;

                    // Get the element associated with the marker style
                    const editorElementEntry = Object.entries(
                        EditorElements,
                    ).find(([, elementInfo]) => {
                        markerStyleInfo = elementInfo.validStyles?.find(
                            (styleInfo) => styleInfo.style === markerStyle,
                        );
                        return markerStyleInfo;
                    });

                    // Make sure we have a marker we can place - valid marker style, can close
                    if (
                        editorElementEntry &&
                        (!isClosingMarker || markerStyleInfo?.canClose)
                    ) {
                        /** The type for the new wrapping element for our marker */
                        const [elementType, elementInfo] = editorElementEntry;

                        const backslashPoint: Point = {
                            path: selection.anchor.path,
                            offset: backslashOffset,
                        };

                        // Get a range from before the backslash to the current selection position
                        const deleteRange: Range = {
                            anchor: selection.anchor,
                            focus: backslashPoint,
                        };

                        // Select and delete the marker text range
                        if (!Range.isCollapsed(deleteRange)) {
                            Transforms.select(editor, deleteRange);
                            Transforms.delete(editor);
                        }

                        if (!isClosingMarker) {
                            // Inserting a new marker
                            // Get the block element this text belongs to
                            const blockParent = Editor.above(editor, {
                                match: (n) => Editor.isBlock(editor, n),
                            });

                            if (blockParent) {
                                const [, blockParentPath] = blockParent;
                                // Get the last node of the block element
                                const [
                                    blockParentLastNode,
                                    blockParentLastPath,
                                ] = Editor.last(editor, blockParentPath);

                                const lastNodeOffset = Text.isText(
                                    blockParentLastNode,
                                )
                                    ? blockParentLastNode.text.length
                                    : 0;

                                // Get the last point of the block element (last text position)
                                const blockParentLastPoint: Point = {
                                    path: blockParentLastPath,
                                    offset: lastNodeOffset,
                                };

                                // If selection is at the end of the block or this is a oneWord marker, insert the marker at the current location
                                if (
                                    Point.equals(
                                        backslashPoint,
                                        blockParentLastPoint,
                                    ) ||
                                    markerStyleInfo?.oneWord
                                ) {
                                    // Determine if the selection is the end of this text node
                                    const atEndOfText = Editor.isEnd(
                                        editor,
                                        backslashPoint,
                                        selection.anchor.path,
                                    );

                                    // Add new marker at backslash position
                                    Transforms.insertNodes(
                                        editor,
                                        {
                                            type: elementType,
                                            style: markerStyle,
                                            children: [{ text: '' }],
                                        } as CustomElement,
                                        { at: backslashPoint },
                                    );

                                    // Inserting the oneWord node will put the cursor after the node if there is more text after the cursor
                                    // but before the node if the cursor is at the end of the text node,
                                    // so move the cursor forward if we are at the end of the text and backward otherwise.
                                    Transforms.move(editor, {
                                        distance: 1,
                                        unit: 'offset',
                                        reverse: !atEndOfText,
                                    });
                                } else {
                                    // If inline, wrapNodes - wrap from selection to end of this block element in element associated with the marker
                                    // If block, setNodes - change the current block if selected start of line or wrap from selection to end of this block element in element associated with the marker
                                    const transform = elementInfo.inline
                                        ? Transforms.wrapNodes
                                        : Transforms.setNodes;
                                    transform(
                                        editor,
                                        {
                                            type: elementType,
                                            style: markerStyle,
                                        } as CustomElement,
                                        {
                                            at: {
                                                anchor: backslashPoint,
                                                focus: blockParentLastPoint,
                                            },
                                            split: true,
                                        },
                                    );
                                }
                            }
                        } else {
                            // Closing an existing marker
                            // Get closest element of this marker style
                            const markerElement = Editor.above(editor, {
                                match: (n) =>
                                    Element.isElement(n) &&
                                    n.type === elementType &&
                                    n.style === markerStyle,
                            });

                            if (markerElement) {
                                const [, markerElementPath] = markerElement;

                                // Determine if the selection is the end of the marker's node
                                const atEndOfMarker = Editor.isEnd(
                                    editor,
                                    backslashPoint,
                                    markerElementPath,
                                );

                                if (atEndOfMarker) {
                                    // If we're at the end of the marker already, just move the cursor out of the marker
                                    Transforms.move(editor, {
                                        distance: 1,
                                        unit: 'offset',
                                    });
                                } else {
                                    // Unwrap the marker element at the selection and wrap it again to the selection and no further
                                    Editor.withoutNormalizing(editor, () => {
                                        Transforms.unwrapNodes(editor, {
                                            at: markerElementPath,
                                        });

                                        // Following is an example of modifying a path when unwrapping in case we need it in the future. I was just curious and played around. We don't need it here, though, because I just get the editor.selection again
                                        // Remove one path level at the unwrapped marker's path because we just removed it
                                        // Have to clone and splice a separate array because it looks like editor.selection.anchor is set up to be non-configurable https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Non_configurable_array_element
                                        // But somehow assigning to backslashPoint.path still doesn't change its value, so this doesn't actually work
                                        /* const newPath = [
                                            ...backslashPoint.path,
                                        ];
                                        newPath.splice(
                                            markerElementPath.length,
                                            1,
                                        );
                                        backslashPoint.path = newPath; */

                                        // Wrap from the marker element's start position to updated selection position (need to get updated selection position because unwrapping removed the path at index of length of markerElementPath)
                                        if (editor.selection) {
                                            Transforms.wrapNodes(
                                                editor,
                                                {
                                                    type: elementType,
                                                    style: markerStyle,
                                                    children: [],
                                                } as CustomElement,
                                                {
                                                    at: {
                                                        anchor: {
                                                            path: markerElementPath,
                                                            offset: 0, // We aren't normalizing, so the markerElementPath is now the contents of the unwrapped node. Adjacent text nodes were not merged
                                                        },
                                                        focus: editor.selection
                                                            .anchor,
                                                    },
                                                    split: true,
                                                },
                                            );
                                        }
                                    });
                                }
                            }
                        }

                        // Don't insert the space because we added a marker
                        return;
                    }
                }
            }
        }

        insertText(text);
    };

    return editor;
};

const slateEditorPlugins: ((editor: CustomSlateEditor) => CustomSlateEditor)[] =
    [
        withHistory,
        withReact,
        withCustomSlateEditor,
        withScrInlines,
        withScrMarkers,
        withScrChunkEditor,
    ];

/** Creates a new Slate Editor */
const createSlateEditor = () =>
    slateEditorPlugins.reduce(
        (editor, withPlugin) => withPlugin(editor),
        createEditor(),
    );

/** Render slate elements for this project */
const renderElement = (
    props: MyRenderElementProps<CustomElement>,
): JSX.Element => {
    return createElement(
        (EditorElements[props.element.type]?.component ||
            DefaultElement) as FunctionComponent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props as any,
    );
};

/** Render slate leaves for this project */
const renderLeaf =
    // eslint-disable-next-line react/jsx-props-no-spreading
    (props: RenderLeafProps) => <Leaf {...props} />;

/** The number of blocks to include in each slate editor chunk */
const CHUNK_SIZE = 25;

/** The estimated DOM height of one chunk in pixels */
const EST_CHUNK_HEIGHT = 710;

/**
 * How long to wait after updating to assume the virtualized Slate editor is finished loading
 * TODO: Find a better way to wait for virtualized list to get DOM heights and update scroll height appropriately on startup and on scroll
 */
const SLATE_VIRTUALIZED_LOAD_TIME = 200;

/**
 * Get the id for the ScriptureContetChunkInfo div holding the contents of the editor chunk
 * @param editorGuid Unique ID for this editor
 * @param chunkIndex Index of chunk in the virtualized list
 * @returns Id string for div holding the editor chunk contents
 */
const getScriptureChunkEditorSlateId = (
    editorGuid: string,
    chunkIndex: number,
) => `scrChunkEd-${editorGuid}-${chunkIndex}`;

interface ScriptureChunkEditorSlateProps
    extends Omit<ScriptureTextPanelSlateProps, 'scrChapters' | 'onFocus'> {
    chunkIndex: number;
    virtualizedStyle: CSSProperties;
    editorGuid: string;
    scrChapterChunk: ScriptureContentChunk;
    searchString: string | null;
    notifyUpdatedScrRef: () => void;
    updateScrChapterChunk: (
        chunkIndex: number,
        updatedScrChapterChunk: ScriptureContentChunk,
    ) => void;
}

const ScriptureChunkEditorSlate = memo(
    ({
        chunkIndex,
        virtualizedStyle,
        editorGuid,
        editable,
        book,
        chapter,
        verse,
        updateScrRef,
        useVirtualization,
        scrChapterChunk,
        searchString,
        notifyUpdatedScrRef,
        updateScrChapterChunk,
    }: ScriptureChunkEditorSlateProps) => {
        // Slate editor
        // TODO: Put in a useEffect listening for scrChapters and create editors for the number of chapters
        const [editor] = useState<CustomSlateEditor>(createSlateEditor);

        useLayoutEffect(
            () =>
                console.debug(
                    `Performance<ScriptureChunkEditorSlate>: finished rendering at ${performance.now()} ms from start.`,
                ),
            [],
        );

        /** performance.now() at the last time the keyDown event was run */
        const onKeyDown = useCallback(() => {
            startKeyDown.lastChangeTime = performance.now();
        }, []);

        useLayoutEffect(() => {
            const end = performance.now();
            console.debug(
                `Performance<ScriptureChunkEditorSlate>: finished rendering ${
                    end - startChangeScrRef.lastChangeTime
                } ms from changing scrRef and ${
                    end - startKeyDown.lastChangeTime
                } ms from keyDown.`,
            );
        }, [scrChapterChunk]);

        /** When the contents are changed, update the chapter chunk */
        const onChange = useCallback(
            (value: CustomDescendant[]) => {
                // Filter out changes that are just selection changes - thanks to the Slate tutorial https://docs.slatejs.org/walkthroughs/06-saving-to-a-database
                if (editor.operations.some((op) => op.type !== 'set_selection'))
                    updateScrChapterChunk(chunkIndex, {
                        ...scrChapterChunk,
                        contents: value,
                    });
            },
            [editor, updateScrChapterChunk, chunkIndex, scrChapterChunk],
        );

        // Focus the editor when we close the search bar
        // TODO: Could do this directly on the hotkey
        useEffect(() => {
            if (searchString === null) ReactEditor.focus(editor);
        }, [editor, searchString]);

        /** Set decorations in the editor */
        const decorate = useCallback(
            ([node, path]: NodeEntry<Node>): (Range &
                Omit<FormattedText, 'text'>)[] => {
                const ranges: (Range & Omit<FormattedText, 'text'>)[] = [];

                // Modified search highlighting decoration logic from Slate search highlighting example
                // https://github.com/ianstormtaylor/slate/blob/main/site/examples/search-highlighting.tsx
                if (searchString && Text.isText(node)) {
                    const { text } = node;
                    const parts = text
                        .toLowerCase()
                        .split(searchString.toLowerCase());
                    let offset = 0;

                    parts.forEach((part, i) => {
                        if (i !== 0) {
                            ranges.push({
                                anchor: {
                                    path,
                                    offset: offset - searchString.length,
                                },
                                focus: { path, offset },
                                searchResult: true,
                            });
                        }

                        offset = offset + part.length + searchString.length;
                    });
                }

                return ranges;
            },
            [searchString],
        );

        /**
         * Whether or not the upcoming scrRef update is from this text panel.
         * TODO: Not a great way to determine this - should be improved in the future
         * */
        const didIUpdateScrRef = useRef(false);

        /** Update scrRef to the selected verse */
        const onSelect = useCallback(() => {
            // TODO: For some reason, the onSelect callback doesn't always have the most up-to-date editor.selection.
            // As such, I added a setTimeout, which is gross. Please fix this hacky setTimeout
            // One possible solution would be to listen for mouse clicks and arrow key events and see if editor.selection is updated by then.
            // Or use onChange and check if one of the operations is a select operation
            // Or try useSlateSelection hook again
            setTimeout(() => {
                if (editor.selection) {
                    // Set reference to the current verse
                    // Get our selected chapter
                    const selectedChapter = editor.chapter;
                    // If we don't find a verse, the selection is at the beginning of this chunk
                    const chunkBeginningVerse = editor.startingVerse - 1;
                    let selectedVerse = chunkBeginningVerse;

                    // Get the selected node
                    let nodeEntry: NodeEntry<Node> | undefined = Editor.node(
                        editor,
                        editor.selection.anchor,
                    );

                    // Step up the node tree via previous siblings then parents all the way up until we find a verse
                    while (nodeEntry && !Editor.isEditor(nodeEntry[0])) {
                        const [node, path] = nodeEntry as NodeEntry<Node>;
                        if (Element.isElement(node)) {
                            if (
                                selectedVerse <= chunkBeginningVerse &&
                                node.type === 'verse'
                            ) {
                                // It's a verse, so try to parse its text and use that as the verse
                                const verseText = Node.string(node);
                                const verseNum = parseVerse(verseText);
                                if (isValidValue(verseNum)) {
                                    selectedVerse = verseNum;
                                    // We got our results! Done
                                    break;
                                }
                            }
                        }

                        if (Path.hasPrevious(path)) {
                            // This node has a previous sibling. Get the lowest node of the previous sibling and try again
                            nodeEntry = Editor.last(
                                editor,
                                Path.previous(path),
                            );
                        } else {
                            // This is the first node of its siblings, so get the parent and try again
                            nodeEntry = Editor.parent(editor, path);
                        }
                    }

                    // If we found verse info, set the scrRef
                    // TODO: There is probably a bug here where you select the same verse as the scrRef has,
                    // then next time you change the scrRef with another window, this window doesn't update
                    // becuase we are setting didIUpdateScrRef whether updateScrRef actually changed the scrRef
                    updateScrRef({
                        book,
                        chapter: selectedChapter,
                        verse: selectedVerse,
                    });
                    didIUpdateScrRef.current = true;
                    notifyUpdatedScrRef();
                }
            }, 1);
        }, [editor, updateScrRef, book, notifyUpdatedScrRef]);

        /** Mock up a call to onSelect for a non-editable editor */
        const onClick = useCallback(() => {
            if (!editable) {
                const windowSel = window.getSelection();
                if (windowSel && windowSel.rangeCount > 0) {
                    // Get slate range from window selection
                    const slateRange = ReactEditor.toSlateRange(
                        editor,
                        windowSel.getRangeAt(0),
                        {
                            exactMatch: true,
                            suppressThrow: false,
                        },
                    );
                    // If we successfully got a Slate selection,
                    if (slateRange) {
                        Transforms.select(editor, slateRange);
                        onSelect();
                    }
                }
            }
        }, [editable, editor, onSelect]);

        // When we get new Scripture project contents, update slate
        useEffect(() => {
            if (scrChapterChunk) {
                // TODO: Save the selection

                // Unselect
                Transforms.deselect(editor);
                ReactEditor.deselect(editor);

                // Update ScriptureContentChunkInfo
                editor.chapter = scrChapterChunk.chapter;
                editor.chunkNum = scrChapterChunk.chunkNum;
                editor.startingVerse = scrChapterChunk.startingVerse;
                editor.finalVerse = scrChapterChunk.finalVerse;
                editor.editable = editable;

                // Replace the editor's contents
                editor.children = scrChapterChunk.contents as CustomElement[];

                // TODO: May need to call Editor.normalize, potentially with option { force: true }
                // Editor.normalize(editor);

                // TODO: Restore cursor to new ScrRef

                editor.onChange();
            }
        }, [editor, editable, scrChapterChunk]);

        // When the scrRef changes, scroll to view
        useEffect(() => {
            // TODO: Determine if this window should scroll by computing if the verse element is already visible instead of using hacky didIUpdateScrRef
            if (!didIUpdateScrRef.current && !useVirtualization) {
                // TODO: Find a better way to wait for the DOM to load before scrolling and hopefully remove scrChapters from dependencies. Ex: Go between Psalm 118:15 and Psalm 119:150
                setTimeout(() => {
                    // Make sure this is the right chapter and chunk for the verse
                    if (
                        chapter === editor.chapter &&
                        verse >= editor.startingVerse &&
                        verse <= editor.finalVerse
                    ) {
                        // Make a match function that matches on the chapter node if verse 0 or the verse node otherwise
                        const matchVerseNode =
                            verse > 0
                                ? (n: Node) =>
                                      Element.isElement(n) &&
                                      n.type === 'verse' &&
                                      parseVerse(Node.string(n)) === verse
                                : (n: Node) =>
                                      Element.isElement(n) &&
                                      n.type === 'chapter' &&
                                      parseChapter(Node.string(n)) === chapter;

                        // Get the node for the specified verse searching in the whole editor
                        const [verseNodeEntry] = Editor.nodes(editor, {
                            at: [],
                            match: matchVerseNode,
                        });
                        if (verseNodeEntry) {
                            const [verseNode] = verseNodeEntry;

                            try {
                                // Get the dom element for this verse marker and scroll to it
                                const verseDomElement = ReactEditor.toDOMNode(
                                    editor,
                                    verseNode,
                                );

                                verseDomElement.scrollIntoView({
                                    block: 'center',
                                });
                            } catch (e) {
                                console.warn(
                                    `Not able to scroll to ${getTextFromScrRef({
                                        book,
                                        chapter,
                                        verse,
                                    })}`,
                                );
                                console.warn(e);
                            }
                        }
                    }
                }, 1);
            }
            didIUpdateScrRef.current = false;
        }, [editor, useVirtualization, scrChapterChunk, book, chapter, verse]);

        return (
            <div style={virtualizedStyle}>
                <div
                    id={getScriptureChunkEditorSlateId(editorGuid, chunkIndex)}
                >
                    <Slate
                        editor={editor}
                        value={[{ text: 'Loading' }]}
                        onChange={onChange}
                    >
                        <Editable
                            readOnly={!editable}
                            renderElement={renderElement}
                            renderLeaf={renderLeaf}
                            decorate={decorate}
                            onSelect={onSelect}
                            onClick={onClick}
                            onKeyDown={onKeyDown}
                        />
                    </Slate>
                </div>
            </div>
        );
    },
);

/** hotkey for toggling the search box */
const isHotkeyFind = isHotkey('mod+f');

/** Information about the height of a virtualized editor chunk */
interface ChunkHeight {
    /** The height of the DOM element representing this chunk */
    height: number;
    /** Whether this height can be trusted as up-to-date or if it may be old
     * TODO: implement staling on typing and on scrolling offscreen
     */
    stale?: boolean;
}

/** virtualizedList state with types. It seems the type library does not type the state */
type VariableSizeListState<T> = {
    instance: VariableSizeList<T>;
    isScrolling: boolean;
} & ListOnScrollProps;

/** Find the index for the Scripture chunk that contains the chapter and verse provided */
const getScrRefChunkIndex = (
    scrChaptersChunked: ScriptureContentChunk[],
    chapter: number,
    verse: number,
) =>
    scrChaptersChunked.findIndex(
        (scrChapterChunk) =>
            chapter === scrChapterChunk.chapter &&
            verse >= scrChapterChunk.startingVerse &&
            verse <= scrChapterChunk.finalVerse,
    );

export interface ScriptureTextPanelSlateProps
    extends ScriptureTextPanelHOCProps {
    scrChapters: ScriptureChapterContent[];
}

/**
 * Scripture text panel that uses Slate to render the Scripture in JSON format.
 * Used internally only in this file for displaying Slate JSON from different sources.
 */
const ScriptureTextPanelJSON = (props: ScriptureTextPanelSlateProps) => {
    const { scrChapters, onFocus, ...scrChunkEditorSlateProps } = props;

    const { shortName, book, chapter, verse, useVirtualization } =
        scrChunkEditorSlateProps;

    // Search string for search highlighting. When null, don't show the search box. When '' or other, show the search box
    const [searchString, setSearchString] = useState<string | null>(null);
    /** Ref for the search input box */
    const searchInputRef = useRef<HTMLInputElement>(null);

    /** Update the search string when we type into the input */
    const handleChangeSearchString = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchString(e.target.value);
        },
        [],
    );

    // Focus the search box when we open the search bar
    // TODO: Could do this directly on the hotkey
    useEffect(() => {
        if (searchString === '') searchInputRef.current?.focus();
    }, [searchString]);

    /** Handle keyboard events on the text panel */
    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (isHotkeyFind(event)) {
                // Make searchString '' if it is null or null if otherwise to toggle the search bar
                setSearchString((currentSearchString) =>
                    currentSearchString === null ? '' : null,
                );
            }
        },
        [],
    );

    /** When we get new Scripture project contents, partition the chapters into smaller chunks and create an editor for each chunk */
    const scrChaptersChunked = useMemo<ScriptureContentChunk[]>(() => {
        if (scrChapters && scrChapters.length > 0) {
            const start = performance.now();
            const scrChapterChunks = scrChapters.flatMap((scrChapter) => {
                // TODO: When loading, the contents come as a string. Consider how to improve the loading value in ScriptureTextPanelHOC
                const scrChapterContents = isString(scrChapter.contents)
                    ? [
                          {
                              text: scrChapter.contents as unknown as string,
                          } as CustomText,
                      ]
                    : scrChapter.contents;

                // If not virtualizing, create one chunk per chapter
                const chunkSize = useVirtualization
                    ? CHUNK_SIZE
                    : scrChapterContents.length;

                return chunkScriptureChapter(
                    { ...scrChapter, contents: scrChapterContents },
                    chunkSize,
                );
            });
            console.debug(
                `Performance<ScriptureTextPanelSlate.scrChaptersChunked>: chunking scrChapters took ${
                    performance.now() - start
                } ms`,
            );
            return scrChapterChunks;
        }
        return [];
    }, [scrChapters, useVirtualization]);

    /** Ref for the virtualized list component */
    const virtualizedList =
        useRef<VariableSizeList<ScriptureContentChunk[]>>(null);

    /** Unique ID for this editor */
    const editorGuid = useRef<string>(newGuid().substring(0, 8));

    /** Invalidate virtualized-list-cached chunk heights and get again from our cache or recalculate from DOM */
    const onItemsRendered = useCallback(
        ({ overscanStartIndex }: ListOnItemsRenderedProps) => {
            if (virtualizedList.current)
                virtualizedList.current.resetAfterIndex(overscanStartIndex);
        },
        [],
    );

    /**
     * Invalidate virtualized-list-cached chunk heights and get again from our cache or recalculate from DOM
     * @param chunkIndex the chunk index at and after which to invalidate chunk heights. Defaults to 0 (all chunks)
     */
    const invalidateVirtualizedListCachedHeights = useCallback(
        (chunkIndex = 0) => {
            onItemsRendered({
                overscanStartIndex: chunkIndex >= 0 ? chunkIndex : 0,
            } as ListOnItemsRenderedProps);
        },
        [onItemsRendered],
    );

    /** At startup, calculate editor chunk heights in the DOM */
    useEffect(() => {
        setTimeout(
            invalidateVirtualizedListCachedHeights,
            SLATE_VIRTUALIZED_LOAD_TIME,
        );
    }, [invalidateVirtualizedListCachedHeights]);

    /** Our cache of height of each editor chunk if measured in the DOM. Does not include estimates unlike the virtualized-list-cached heights */
    const editorChunkHeights = useRef<(ChunkHeight | undefined)[]>([]);

    /**
     * Marks stale or clears a cached editor chunk height
     * @param chunkIndex index of the chunk to clear
     * @param hard if true, completely deletes the cached height. If false (default), marks it stale for recalculating next time the chunk is in the DOM
     */
    const invalidateCachedChunkHeight = useCallback(
        (chunkIndex: number, hard = false) => {
            // Invalidate all chunk heights
            if (chunkIndex < 0) {
                if (!hard) {
                    editorChunkHeights.current.forEach((editorChunkHeight) => {
                        if (editorChunkHeight && !editorChunkHeight.stale)
                            editorChunkHeight.stale = true;
                    });
                } else editorChunkHeights.current = [];
            }
            // Invalidate a particular chunk height
            else if (!hard) {
                const cachedChunkHeight =
                    editorChunkHeights.current[chunkIndex];
                if (cachedChunkHeight) cachedChunkHeight.stale = true;
            } else {
                editorChunkHeights.current[chunkIndex] = undefined;
            }
            invalidateVirtualizedListCachedHeights(chunkIndex);
        },
        [invalidateVirtualizedListCachedHeights],
    );

    /**
     * Current scrollOffset aka viewport position for the virtualized view.
     * We need this because the scrollTo and scrollToItem methods don't update virtualizedList.state.scrollOffset immediately.
     */
    const virtualizedScrollOffset = useRef<number>(0);

    /** Keep track of current offset */
    const onScroll = useCallback(({ scrollOffset }: ListOnScrollProps) => {
        virtualizedScrollOffset.current = scrollOffset;
    }, []);

    /**
     * Get the size of the editor chunk for virtualization. Gets size from the DOM or estimates size
     * @param chunkIndex chunk index for the editor chunk
     * @returns height of editor chunk
     */
    const getChunkHeight = useCallback((chunkIndex: number) => {
        const cachedChunkHeight = editorChunkHeights.current[chunkIndex];
        if (cachedChunkHeight && !cachedChunkHeight.stale)
            return cachedChunkHeight.height;

        const editorChunk = document.getElementById(
            getScriptureChunkEditorSlateId(editorGuid.current, chunkIndex),
        );
        if (editorChunk) {
            const editorChunkHeight = editorChunk.scrollHeight;
            // Don't record the height if the editor is loading
            // TODO: We could probably make this better by firing a method in the editor when it finishes loading
            if (editorChunkHeight > 100) {
                editorChunkHeights.current[chunkIndex] = {
                    height: editorChunkHeight,
                };

                const editorChunkWrapper = editorChunk.parentElement;

                // If the measured chunk height is different than the estimated and the measured chunk's bottom
                // is above the viewport top (scrollOffset), offset the scroll to avoid jitters
                if (
                    editorChunkHeight !== EST_CHUNK_HEIGHT &&
                    virtualizedList.current &&
                    editorChunkWrapper
                ) {
                    // If the bottom of the measured chunk is above the viewport, scroll the viewport
                    if (
                        editorChunkWrapper.offsetTop + editorChunkHeight <
                        virtualizedScrollOffset.current
                    ) {
                        // Scroll down by the difference between the estimated height and the actual height so we don't get jitters when loading new chunks
                        const chunkHeightDiff =
                            editorChunkHeight - EST_CHUNK_HEIGHT;
                        virtualizedScrollOffset.current += chunkHeightDiff;
                        virtualizedList.current.scrollTo(
                            Math.max(0, virtualizedScrollOffset.current),
                        );
                    }
                }

                return editorChunkHeight;
            }
        }
        return cachedChunkHeight?.height || EST_CHUNK_HEIGHT;
    }, []);

    /** Delay invalidating cached chunk heights partially to reduce lag
     * and partially because there is a problem where the elements may be
     * remeasured before their sizes are recalculated. May be worth improving */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onResize = useCallback(
        debounce(() => {
            invalidateCachedChunkHeight(-1, true);
        }, 25),
        [],
    );

    /**
     * Whether or not the upcoming scrRef update is from this text panel. Blocks scrolling on this panel.
     * Called from the ScriptureChunkEditorSlate that made the update.
     * TODO: Not a great way to determine this - should be improved in the future
     * */
    const didIUpdateScrRef = useRef(false);

    /**
     * Disables scrolling to new scrRefs because this panel changed the scrRef.
     * Called from the ScriptureChunkEditorSlate that made the update.
     */
    const notifyUpdatedScrRef = useCallback(() => {
        didIUpdateScrRef.current = true;
    }, []);

    /**
     * Updates the Scripture chunk at the provided index with updated contents and saves the edited chapter.
     * TODO: Currently DOES NOT update the chunk's reference in order to avoid React re-rendering. Probably should update or send operations to a store or something for multi-editor support
     * @param chunkIndex which chunk index had a change
     * @param scrChapterChunk the updated Scripture chunk
     */
    const updateScrChapterChunk = useCallback(
        (chunkIndex: number, updatedScrChapterChunk: ScriptureContentChunk) => {
            const startWriteScripture = performance.now();

            console.debug(
                `Performance<ScriptureTextPanelSlate.updateScrChapterChunk>: keyDown to starting updateScrChapterChunk took ${
                    startWriteScripture - startKeyDown.lastChangeTime
                } ms`,
            );

            const editedScrChapterChunk = scrChaptersChunked[chunkIndex];
            const editedChapter = editedScrChapterChunk.chapter;
            editedScrChapterChunk.contents = updatedScrChapterChunk.contents;

            const startChunking = performance.now();
            // Reassemble the edited chapter and send it to the backend to save (no need to save the whole book)
            // Get the chunks for the chapter that was edited
            const editedScrChapterChunks = scrChaptersChunked.filter(
                (chapterChunk) => chapterChunk.chapter === editedChapter,
            );

            // Reassemble the chunks into scrChapters and write
            const editedScrChaptersUnchunked: ScriptureChapterContent[] = [
                unchunkScriptureContent(editedScrChapterChunks, editedChapter),
            ];

            console.debug(
                `Performance<ScriptureTextPanelSlate.updateScrChapterChunk>: Unchunking Scripture Chapter ${editedChapter} for saving took ${
                    performance.now() - startChunking
                } ms`,
            );

            // Save the newly edited chapters in scrChapters
            editedScrChaptersUnchunked.forEach((editedScrChapter) => {
                const originalScrChapter = scrChapters.find(
                    (scrChapter) =>
                        scrChapter.chapter === editedScrChapter.chapter,
                );
                if (originalScrChapter)
                    originalScrChapter.contents = editedScrChapter.contents;
            });

            // Send the chapter to the backend for saving
            writeScripture(
                shortName,
                book,
                editedChapter,
                editedScrChaptersUnchunked,
            )
                .then((success) => {
                    console.debug(
                        `Performance<ScriptureTextPanelSlate.updateScrChapterChunk>: writeScripture resolved with success = ${success} and took ${
                            performance.now() - startKeyDown.lastChangeTime
                        } ms from keyDown and ${
                            performance.now() - startWriteScripture
                        } ms from starting updateScrChapterChunk`,
                    );
                    return undefined;
                })
                .catch((r) =>
                    console.log(
                        `Exception while writing Scripture from Slate! ${r}`,
                    ),
                );

            // Invalidate the updated chunk's cached height so we recalculate in case we added a line or something
            // TODO: setTimeout required because we need to wait for Slate to update the editor chunk to the new height. Clean this up by listening for the end of slate changes somehow?
            setTimeout(() => {
                invalidateCachedChunkHeight(chunkIndex);
            }, 1);
        },
        [
            scrChaptersChunked,
            scrChapters,
            shortName,
            book,
            invalidateCachedChunkHeight,
        ],
    );

    // When the scrRef changes, tell the virtualized list to scroll to the appropriate chunk
    // TODO: When you figure out how not to recreate the editors every time the scrRef changes, allow the chunks to scroll to the scrRefs for themselves (as in non-virtualized)
    useEffect(() => {
        // TODO: Determine if this window should scroll by computing if the verse element is already visible instead of using hacky didIUpdateScrRef
        if (!didIUpdateScrRef.current && useVirtualization) {
            // Find the chunk matching the reference
            const chunkIndex = getScrRefChunkIndex(
                scrChaptersChunked,
                chapter,
                verse,
            );

            if (chunkIndex >= 0) {
                const scrollToChunk = (align: Align) =>
                    virtualizedList.current?.scrollToItem(chunkIndex, align);
                scrollToChunk('start');
                setTimeout(() => {
                    // Scroll so the chunk is at the start because we will offset to center later
                    scrollToChunk('start');
                    // Estimate where the verse is in the chunk and scroll there
                    if (virtualizedList.current) {
                        const scrChapterChunk = scrChaptersChunked[chunkIndex];
                        /** The first verse this chunk contains that you can scroll to. The first chunk in a chapter has extra content at the start "verse 0", so it needs an extra */
                        const firstScrollVerse =
                            scrChapterChunk.chunkNum === 0
                                ? 0
                                : scrChapterChunk.startingVerse;
                        const editorChunkHeight =
                            editorChunkHeights.current[chunkIndex];
                        if (editorChunkHeight)
                            // This setTimeout is a quick way to allow the virtualizedListState.scrollOffset to update from the scrollToChunk('start') above.
                            // TODO: Remove this setTimeout and calculate the appropriate offset.
                            setTimeout(() => {
                                // Offset the virtualized list scroll proportionally by where the verse is in the chunk compared to the height of the chunk
                                // And center the verse in the virtualized list.
                                // Add one to the final verse before calculating because the final verse is likely not at the actual end of the chunk
                                if (virtualizedList.current) {
                                    const virtualizedListState = // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        virtualizedList.current
                                            .state as VariableSizeListState<
                                            ScriptureContentChunk[]
                                        >;
                                    virtualizedList.current.scrollTo(
                                        Math.max(
                                            0,
                                            virtualizedListState.scrollOffset +
                                                ((verse - firstScrollVerse) /
                                                    (scrChapterChunk.finalVerse +
                                                        1 -
                                                        firstScrollVerse)) *
                                                    editorChunkHeight.height -
                                                (virtualizedList.current.props
                                                    .height as number) /
                                                    2,
                                        ),
                                    );
                                }
                            }, 1);
                    }
                }, SLATE_VIRTUALIZED_LOAD_TIME);
            }
        }
        didIUpdateScrRef.current = false;
    }, [useVirtualization, scrChaptersChunked, book, chapter, verse]);

    /** Renders the editor chunk at the specified chunk index and virtualized style */
    const renderEditorChunk = ({
        index,
        style,
    }: Omit<ListChildComponentProps, 'data'>) => {
        const scrChapterChunk = scrChaptersChunked[index];
        return (
            <EditorElement
                element={{
                    type: 'editor',
                    number: `${scrChapterChunk.chapter}-${scrChapterChunk.chunkNum}`,
                    children: [],
                }}
                attributes={{} as never}
            >
                <ScriptureChunkEditorSlate
                    chunkIndex={index}
                    virtualizedStyle={style}
                    editorGuid={editorGuid.current}
                    scrChapterChunk={scrChapterChunk}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...scrChunkEditorSlateProps}
                    searchString={searchString}
                    notifyUpdatedScrRef={notifyUpdatedScrRef}
                    updateScrChapterChunk={updateScrChapterChunk}
                />
            </EditorElement>
        );
    };

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            className={`text-panel slate${
                useVirtualization ? ' virtualized' : ''
            }`}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
        >
            {searchString !== null && (
                <div className="scr-toolbar text-panel-search">
                    <span className="input-area">
                        Search:
                        <input
                            ref={searchInputRef}
                            type="text"
                            className={`${searchString ? 'changed' : ''}`}
                            value={searchString}
                            onChange={handleChangeSearchString}
                        />
                    </span>
                </div>
            )}
            <div
                className={`text-panel-slate-editor${
                    useVirtualization ? ' virtualized' : ''
                }`}
            >
                {useVirtualization ? (
                    <ReactVirtualizedAutoSizer onResize={onResize}>
                        {({ height, width }) => (
                            <VariableSizeList
                                ref={virtualizedList}
                                height={height}
                                width={width}
                                itemCount={scrChaptersChunked.length}
                                estimatedItemSize={EST_CHUNK_HEIGHT}
                                onScroll={onScroll}
                                itemSize={getChunkHeight}
                                onItemsRendered={onItemsRendered}
                            >
                                {renderEditorChunk}
                            </VariableSizeList>
                        )}
                    </ReactVirtualizedAutoSizer>
                ) : (
                    scrChaptersChunked.map((_scrChapterChunk, i) =>
                        renderEditorChunk({ index: i, style: {} }),
                    )
                )}
            </div>
        </div>
    );
};

export const ScriptureTextPanelSlate = ScriptureTextPanelHOC(
    ScriptureTextPanelJSON,
    getScripture,
);

export const ScriptureTextPanelSlateJSONFromUsx = ScriptureTextPanelHOC(
    ScriptureTextPanelJSON,
    getScriptureJSONFromUsx,
);
