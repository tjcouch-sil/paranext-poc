import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    CLEAR_HISTORY_COMMAND,
    SerializedEditorState,
    SerializedElementNode,
    SerializedLexicalNode,
    SerializedTextNode,
    TextNode,
} from 'lexical';
import { useEffect } from 'react';
import {
    CustomElement,
    CustomText,
    NoteElementProps,
    ScriptureChapterContent,
    ScriptureContent,
} from '@shared/data/ScriptureTypes';
import {
    CHAPTER_STYLE,
    CHAPTER_VERSION,
    ChapterNode,
    SerializedChapterNode,
} from '../scripture/nodes/ChapterNode';
import {
    CHAR_VERSION,
    CharNode,
    CharUsxStyle,
    SerializedCharNode,
    VALID_CHAR_STYLES,
} from '../scripture/nodes/CharNode';
import {
    PARA_VERSION,
    ParaNode,
    ParaUsxStyle,
    SerializedParaNode,
    VALID_PARA_STYLES,
} from '../scripture/nodes/ParaNode';
import {
    NOTE_VERSION,
    NoteNode,
    NoteUsxStyle,
    SerializedNoteNode,
    VALID_NOTE_STYLES,
} from '../scripture/nodes/NoteNode';
import {
    SerializedVerseNode,
    VERSE_STYLE,
    VERSE_VERSION,
    VerseNode,
} from '../scripture/nodes/VerseNode';

function createChapter(
    contentNode: CustomElement,
): SerializedChapterNode | undefined {
    if (contentNode.style !== CHAPTER_STYLE) {
        console.error(`Unexpected chapter style '${contentNode.style}'!`);
        return undefined;
    }

    return {
        type: ChapterNode.getType(),
        number: parseInt((contentNode.children[0] as CustomText).text, 10),
        usxStyle: CHAPTER_STYLE,
        version: CHAPTER_VERSION,
    };
}

function createVerse(
    contentNode: CustomElement,
): SerializedVerseNode | undefined {
    if (contentNode.style !== VERSE_STYLE) {
        console.error(`Unexpected verse style '${contentNode.style}'!`);
        return undefined;
    }

    return {
        type: VerseNode.getType(),
        text: (contentNode.children[0] as CustomText).text,
        usxStyle: VERSE_STYLE,
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        version: VERSE_VERSION,
    };
}

function createChar(
    contentNode: CustomElement,
): SerializedCharNode | undefined {
    if (
        !contentNode.style ||
        (contentNode.style &&
            !VALID_CHAR_STYLES.includes(contentNode.style as CharUsxStyle))
    ) {
        console.error(`Unexpected char style '${contentNode.style}'!`);
        return undefined;
    }

    return {
        type: CharNode.getType(),
        text: (contentNode.children[0] as CustomText).text,
        usxStyle: contentNode.style as CharUsxStyle,
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        version: CHAR_VERSION,
    };
}

function createPara(
    contentNode: CustomElement,
): SerializedParaNode | undefined {
    // An undefined style will use the default para style so don't check for it.
    if (
        contentNode.style &&
        !VALID_PARA_STYLES.includes(contentNode.style as ParaUsxStyle)
    ) {
        console.error(`Unexpected para style '${contentNode.style}'!`);
        // Still return with data as other elements need this structure.
    }

    return {
        type: ParaNode.getType(),
        usxStyle: contentNode.style as ParaUsxStyle,
        children: [],
        direction: null,
        format: '',
        indent: 0,
        version: PARA_VERSION,
    };
}

function createNote(
    contentNode: CustomElement,
    elementNodes: (SerializedElementNode | SerializedTextNode)[],
): SerializedNoteNode | undefined {
    if (
        contentNode.style &&
        !VALID_NOTE_STYLES.includes(contentNode.style as NoteUsxStyle)
    ) {
        console.error(`Unexpected note style '${contentNode.style}'!`);
        return undefined;
    }

    const previewText = elementNodes
        .reduce(
            (text, node) =>
                text +
                (node.type === 'char'
                    ? ` ${(node as SerializedTextNode).text}`
                    : ''),
            '',
        )
        .trim();

    return {
        type: NoteNode.getType(),
        caller: (contentNode as NoteElementProps).caller ?? '*',
        usxStyle: contentNode.style as NoteUsxStyle,
        previewText,
        version: NOTE_VERSION,
    };
}

function createText(contentNode: CustomText): SerializedTextNode {
    return {
        type: TextNode.getType(),
        text: contentNode.text,
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        version: 1,
    };
}

const emptyParaNode = createPara({
    style: 'p',
} as CustomElement) as SerializedParaNode;

function addNode(
    lexicalNode: SerializedLexicalNode | undefined,
    elementNodes: (SerializedElementNode | SerializedTextNode)[],
) {
    if (lexicalNode) {
        (elementNodes as SerializedLexicalNode[]).push(lexicalNode);
    }
}

function recurseNodes(
    contentNodes: ScriptureContent[],
): (SerializedElementNode | SerializedTextNode)[] {
    const elementNodes: (SerializedElementNode | SerializedTextNode)[] = [];
    contentNodes.forEach((contentNode) => {
        if ('type' in contentNode) {
            let lexicalNode: SerializedLexicalNode | undefined;
            let elementNode: SerializedElementNode | undefined;
            const nodeType = contentNode.type as string;
            switch (contentNode.type) {
                case 'chapter':
                    lexicalNode = createChapter(contentNode);
                    addNode(lexicalNode, elementNodes);
                    break;
                case 'verse':
                    lexicalNode = createVerse(contentNode);
                    addNode(lexicalNode, elementNodes);
                    break;
                case 'char':
                    lexicalNode = createChar(contentNode);
                    addNode(lexicalNode, elementNodes);
                    break;
                case 'para':
                    elementNode = createPara(contentNode);
                    if (elementNode) {
                        elementNode.children = recurseNodes(
                            contentNode.children,
                        );
                        elementNodes.push(elementNode);
                    }
                    break;
                case 'note':
                    lexicalNode = createNote(
                        contentNode,
                        recurseNodes(contentNode.children),
                    );
                    addNode(lexicalNode, elementNodes);
                    break;
                default:
                    if (!nodeType || nodeType === 'ms') break;
                    console.error(`Unexpected node type '${nodeType}'!`);
            }
        } else if ('text' in contentNode) {
            elementNodes.push(createText(contentNode));
        } else {
            console.error('Unexpected node!', contentNode);
        }
    });
    return elementNodes;
}

function loadEditorState(
    scrChapters: ScriptureChapterContent[],
): SerializedEditorState {
    // 'empty' editor
    const value: SerializedEditorState<SerializedElementNode> = {
        root: {
            children: [emptyParaNode],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
        },
    };
    if (scrChapters.length >= 1 && scrChapters[0].chapter >= 0) {
        value.root.children = recurseNodes(
            scrChapters[0].contents,
        ) as SerializedElementNode[];
    }

    return value;
}

/**
 * A component (plugin) that updates the state of lexical.
 * @param props - { scrChapters } from Slate.
 * @returns null, i.e. no DOM elements.
 */
export default function UpdatePlugin({
    scrChapters,
}: {
    scrChapters: ScriptureChapterContent[];
}): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const editorState = editor.parseEditorState(
            loadEditorState(scrChapters),
        );
        editor.setEditorState(editorState);
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
    }, [editor, scrChapters]);

    return null;
}
