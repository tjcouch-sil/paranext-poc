/* eslint-disable class-methods-use-this, no-underscore-dangle */

import {
    type LexicalNode,
    type NodeKey,
    $applyNodeReplacement,
    TextNode,
    SerializedTextNode,
    Spread,
    EditorConfig,
} from 'lexical';

export const CHAPTER_STYLE = 'c';
export const CHAPTER_VERSION = 1;

type ChapterUsxStyle = typeof CHAPTER_STYLE;

export type SerializedChapterNode = Spread<
    {
        usxStyle: ChapterUsxStyle;
    },
    SerializedTextNode
>;

export class ChapterNode extends TextNode {
    __usxStyle: ChapterUsxStyle;

    static getType(): string {
        return 'chapter';
    }

    static clone(node: ChapterNode): ChapterNode {
        return new ChapterNode(node.__text, node.__key);
    }

    static importJSON(serializedNode: SerializedChapterNode): ChapterNode {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const node = $createChapterNode(serializedNode.text);
        node.setDetail(serializedNode.detail);
        node.setFormat(serializedNode.format);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        node.setUsxStyle(serializedNode.usxStyle);
        return node;
    }

    constructor(text: string, key?: NodeKey) {
        super(text, key);
        this.__usxStyle = CHAPTER_STYLE;
    }

    setUsxStyle(usxStyle: ChapterUsxStyle): void {
        const self = this.getWritable();
        self.__usxStyle = usxStyle;
    }

    getUsxStyle(): ChapterUsxStyle {
        const self = this.getLatest();
        return self.__usxStyle;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = super.createDOM(config);
        dom.setAttribute('data-usx-style', this.__usxStyle);
        dom.classList.add(this.getType());
        dom.classList.add(`usfm_${this.__usxStyle}`);
        return dom;
    }

    updateDOM(_prevNode: ChapterNode, _dom: HTMLElement): boolean {
        // Returning false tells Lexical that this node does not need its
        // DOM element replacing with a new copy from createDOM.
        return false;
    }

    exportJSON(): SerializedChapterNode {
        return {
            ...super.exportJSON(),
            type: this.getType(),
            usxStyle: this.getUsxStyle(),
            version: CHAPTER_VERSION,
        };
    }
}

export function $createChapterNode(text: string): ChapterNode {
    return $applyNodeReplacement(new ChapterNode(text));
}

export function $isChapterNode(
    node: LexicalNode | null | undefined,
): node is ChapterNode {
    return node instanceof ChapterNode;
}
