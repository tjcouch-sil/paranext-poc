import { getScripture } from '@services/ScriptureService';
import { ScriptureChapterContent } from '@shared/data/ScriptureTypes';
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
import './TextPanel.css';
import {
    createEditor,
    BaseEditor,
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
} from 'slate-react';
import {
    ScriptureTextPanelHOC,
    ScriptureTextPanelHOCProps,
} from './ScriptureTextPanelHOC';
import {
    getTextFromScrRef,
    parseChapter,
    parseVerse,
} from '@util/ScriptureUtil';

// Slate types
type CustomEditor = BaseEditor & ReactEditor;

// Types of components:
//      Element - contiguous, semantic elements in the document
//          - Ex: Marker Element (in-line) that contains a line and is formatted appropriately
//          - Note: You cannot have block elements as siblings of inline elements or text.
//          - Note: You cannot have children of inline elements other than text, it seems.
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
    children: CustomDescendant[];
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
    children: CustomDescendant[];
};

export type CustomElement =
    | VerseElementProps
    | ParaElementProps
    | CharElementProps
    | ChapterElementProps
    | EditorElementProps;

type FormattedText = { text: string } & MarkerProps;

type CustomText = FormattedText;

export type CustomDescendant = CustomElement | CustomText;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: (props: MyRenderElementProps<any>) => JSX.Element;
    /** Whether the element should be considered within one line or should be a block of text */
    inline?: boolean;
    /** Marker styles for this element. All marker styles should be unique. There should not be a marker style repeated between two elements. */
    validStyles?: StyleInfo[];
}

/** All available elements for use in slate editor */
const EditorElements: { [type: string]: ElementInfo } = {
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
            { style: 'q2' },
            { style: 'b' },
        ],
    },
    char: {
        component: CharElement,
        inline: true,
        validStyles: [{ style: 'nd', canClose: true }],
    },
    chapter: {
        component: ChapterElement,
        validStyles: [{ style: 'c' }],
    },
    editor: { component: EditorElement },
};

const DefaultElement = ({ attributes, children }: RenderElementProps) => {
    return <p {...attributes}>{children}</p>;
};

const withScrInlines = (editor: CustomEditor): CustomEditor => {
    const { isInline } = editor;

    editor.isInline = (element: CustomElement): boolean =>
        EditorElements[element.type]?.inline || isInline(element);

    return editor;
};

const withScrMarkers = (editor: CustomEditor): CustomEditor => {
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
        const { selection } = editor;

        // Insert markers like \nd
        // TODO: Scan through the text, replace all markers, and insert rest of the text instead of only working on space
        if (text.endsWith(' ') && selection && Range.isCollapsed(selection)) {
            // Determine if we inserted a marker
            const [selectedNode, selectedPath] = Editor.node(
                editor,
                selection.anchor,
            );
            if (Text.isText(selectedNode)) {
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

                                console.log(
                                    'Before:',
                                    JSON.stringify(editor.children, null, 2),
                                );
                                console.log(editor.selection);

                                if (markerStyleInfo?.oneWord) {
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
                                    Transforms.move(editor, {
                                        distance: 1,
                                        unit: 'offset',
                                        reverse: true,
                                    });
                                } else {
                                    // Wrap from selection to block element in element associated with the marker
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
                                                focus: {
                                                    path: blockParentLastPath,
                                                    offset: lastNodeOffset,
                                                },
                                            },
                                            split: true,
                                        },
                                    );
                                }

                                console.log(
                                    'After:',
                                    JSON.stringify(editor.children, null, 2),
                                );
                                console.log(editor.selection);
                            }
                        } else {
                            // Closing an existing marker
                            // Get closest element of this marker style
                            const markerElement = Editor.above(editor, {
                                match: (n) =>
                                    Element.isElement(n) &&
                                    n.type !== 'editor' &&
                                    n.type === elementType &&
                                    n.style === markerStyle,
                            });

                            if (markerElement) {
                                const [, markerElementPath] = markerElement;

                                console.log(
                                    JSON.stringify(editor.children, null, 2),
                                );
                                console.log(editor.selection);

                                // Unwrap the marker element
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

                                    console.log(
                                        JSON.stringify(
                                            editor.children,
                                            null,
                                            2,
                                        ),
                                    );
                                    console.log(editor.selection);

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
                                                        offset: 0, // We aren't normalizing, so the markerElementPath is now the contents of the unwrapped node
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

                        // Don't insert the space
                        return;
                    }
                }
            }
        }

        insertText(text);
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
        updateScrRef,
    }: ScriptureTextPanelProps) => {
        // Slate editor
        // TODO: Put in a useEffect listening for scrChapters and create editors for the number of chapters
        const [editor] = useState<CustomEditor>(() =>
            withScrMarkers(withScrInlines(withReact(createEditor()))),
        );

        // Render our components for this project
        const renderElement = useCallback(
            (props: MyRenderElementProps<CustomElement>): JSX.Element => {
                return createElement(
                    (EditorElements[props.element.type].component ||
                        DefaultElement) as FunctionComponent,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    props as any,
                );
            },
            [],
        );

        /**
         * Whether or not the upcoming scrRef update is form this text panel.
         * TODO: Not a great way to determine this - should be improved in the future
         * */
        const didIUpdateScrRef = useRef(false);

        const onSelect = useCallback(() => {
            // TODO: For some reason, the onSelect callback doesn't always have the most up-to-date editor.selection.
            // As such, I added a setTimeout, which is gross. Please fix this hacky setTimeout
            // One possible solution would be to listen for mouse clicks and arrow key events and see if editor.selection is updated by then.
            // Or use onChange and keep track of selection vs previous selection if selection is updated.
            // Or try useSlateSelection hook again
            setTimeout(() => {
                if (editor.selection) {
                    // Set reference to the current verse
                    // We must be in a chapter
                    let selectedChapter = -1;
                    // Intro material should show as verse 0, so allow 0
                    let selectedVerse = 0;

                    // Get the selected node
                    let nodeEntry: NodeEntry<Node> | undefined = Editor.node(
                        editor,
                        editor.selection.anchor,
                    );

                    // Step up the node tree via previous siblings then parents all the way up until we find a chapter and verse
                    while (nodeEntry && !Editor.isEditor(nodeEntry[0])) {
                        const [node, path] = nodeEntry as NodeEntry<Node>;
                        if (Element.isElement(node)) {
                            if (selectedVerse <= 0 && node.type === 'verse') {
                                // It's a verse, so try to parse its text and use that as the verse
                                const verseText = Node.string(node);
                                const verseNum = parseVerse(verseText);
                                if (isValidValue(verseNum)) {
                                    selectedVerse = verseNum;
                                }
                            } else if (
                                selectedChapter < 0 &&
                                node.type === 'chapter'
                            ) {
                                // It's a chapter, so try to parse its text and use that as the chapter
                                const chapterText = Node.string(node);
                                const chapterNum = parseChapter(chapterText);
                                if (isValidValue(chapterNum)) {
                                    selectedChapter = chapterNum;
                                }
                            }
                        }

                        if (selectedChapter >= 0) {
                            // We got our results! Done
                            break;
                        } else if (Path.hasPrevious(path)) {
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
            }, 1);
        }, [editor, updateScrRef, book]);

        // When we get new Scripture project contents, update slate
        useEffect(() => {
            if (scrChapters && scrChapters.length > 0) {
                // TODO: Save the selection

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

                // TODO: May need to call Editor.normalize, potentially with option { force: true }
                // Editor.normalize(editor);

                // TODO: Restore cursor to new ScrRef

                editor.onChange();
            }
        }, [editor, scrChapters]);

        // When the scrRef changes, scroll to view
        useEffect(() => {
            // TODO: Determine if this window should scroll by computing if the verse element is visible instead of using hacky didIUpdateScrRef
            if (!didIUpdateScrRef.current) {
                // TODO: Find a better way to wait for the DOM to load before scrolling and hopefully remove scrChapters from dependencies. Ex: Go between Psalm 118:15 and Psalm 119:150
                setTimeout(() => {
                    // Get the node for the specified chapter editor
                    const [editorNodeEntry] = Editor.nodes(editor, {
                        at: [],
                        match: (n) =>
                            !Editor.isEditor(n) &&
                            Element.isElement(n) &&
                            n.type === 'editor' &&
                            parseChapter(n.number) === chapter,
                        /* n.type === 'chapter' &&
                            parseChapter(Node.string(n)) === chapter, */
                    });
                    if (editorNodeEntry) {
                        const [, editorNodePath] = editorNodeEntry;

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

                        // Get the node for the specified verse
                        const [verseNodeEntry] = Editor.nodes(editor, {
                            at: [
                                editorNodePath,
                                Editor.last(editor, editorNodePath)[1],
                            ],
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
        }, [editor, scrChapters, book, chapter, verse]);

        return (
            <div className="text-panel">
                <Slate editor={editor} value={[{ text: 'Loading' }]}>
                    <Editable
                        readOnly={!editable}
                        renderElement={renderElement}
                        onSelect={onSelect}
                    />
                </Slate>
            </div>
        );
    },
    getScrChapter,
);
