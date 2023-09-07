/* eslint-disable class-methods-use-this, no-underscore-dangle */

import {
    type LexicalNode,
    type NodeKey,
    $applyNodeReplacement,
    EditorConfig,
    SerializedTextNode,
    Spread,
    TextNode,
} from 'lexical';

export const VERSE_STYLE = 'v';
export const VERSE_VERSION = 1;

type VerseUsxStyle = typeof VERSE_STYLE;

export type SerializedVerseNode = Spread<
    {
        usxStyle: VerseUsxStyle;
    },
    SerializedTextNode
>;

export class VerseNode extends TextNode {
    __usxStyle: VerseUsxStyle;

    static getType(): string {
        return 'verse';
    }

    static clone(node: VerseNode): VerseNode {
        return new VerseNode(node.__text, node.__key);
    }

    static importJSON(serializedNode: SerializedVerseNode): VerseNode {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const node = $createVerseNode(serializedNode.text);
        node.setDetail(serializedNode.detail);
        node.setFormat(serializedNode.format);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        node.setUsxStyle(serializedNode.usxStyle);
        return node;
    }

    constructor(text: string, key?: NodeKey) {
        super(text, key);
        this.__usxStyle = VERSE_STYLE;
    }

    setUsxStyle(usxStyle: VerseUsxStyle): void {
        const self = this.getWritable();
        self.__usxStyle = usxStyle;
    }

    getUsxStyle(): VerseUsxStyle {
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

    updateDOM(_prevNode: VerseNode, _dom: HTMLElement): boolean {
        // Returning false tells Lexical that this node does not need its
        // DOM element replacing with a new copy from createDOM.
        return false;
    }

    exportJSON(): SerializedVerseNode {
        return {
            ...super.exportJSON(),
            type: this.getType(),
            usxStyle: this.getUsxStyle(),
            version: VERSE_VERSION,
        };
    }
}

export function $createVerseNode(text: string): VerseNode {
    return $applyNodeReplacement(new VerseNode(text));
}

export function $isVerseNode(
    node: LexicalNode | null | undefined,
): node is VerseNode {
    return node instanceof VerseNode;
}
