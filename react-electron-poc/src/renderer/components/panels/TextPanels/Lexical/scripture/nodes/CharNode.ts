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

/**
 * @see https://ubsicap.github.io/usx/charstyles.html
 * @see https://ubsicap.github.io/usx/notes.html
 */
export const VALID_CHAR_STYLES = [
    // Special Text (partial)
    'nd',
    'qs',
    'wj',
    // Character Styling
    'em',
    'bd',
    'bdit',
    'it',
    'no',
    'sc',
    'sup',
    // Special Features
    // Structured List Entries
    // Linking

    // Footnote
    'fr',
    'ft',
    'fk',
    'fq',
    'fqa',
    'fl',
    'fw',
    'fp',
    'fv',
    'fdc',
    // Cross Reference
    'xo',
    'xop',
    'xt',
    'xta',
    'xk',
    'xq',
    'xot',
    'xnt',
    'xdc',
] as const;
export const CHAR_VERSION = 1;

export type CharUsxStyle = typeof VALID_CHAR_STYLES[number];

export type SerializedCharNode = Spread<
    {
        usxStyle: CharUsxStyle;
    },
    SerializedTextNode
>;

export class CharNode extends TextNode {
    __usxStyle: CharUsxStyle;

    static getType(): string {
        return 'char';
    }

    static clone(node: CharNode): CharNode {
        return new CharNode(node.__text, node.__usxStyle, node.__key);
    }

    static importJSON(serializedNode: SerializedCharNode): CharNode {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const node = $createCharNode(
            serializedNode.text,
            serializedNode.usxStyle,
        );
        node.setDetail(serializedNode.detail);
        node.setFormat(serializedNode.format);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    constructor(text: string, usxStyle: CharUsxStyle, key?: NodeKey) {
        super(text, key);
        this.__usxStyle = usxStyle;
    }

    setUsxStyle(usxStyle: CharUsxStyle): void {
        const self = this.getWritable();
        self.__usxStyle = usxStyle;
    }

    getUsxStyle(): CharUsxStyle {
        const self = this.getLatest();
        return self.__usxStyle;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = super.createDOM(config);
        dom.setAttribute('data-usx-style', this.__usxStyle);
        dom.classList.add(this.getType(), `usfm_${this.__usxStyle}`);
        return dom;
    }

    updateDOM(_prevNode: CharNode, _dom: HTMLElement): boolean {
        // Returning false tells Lexical that this node does not need its
        // DOM element replacing with a new copy from createDOM.
        return false;
    }

    exportJSON(): SerializedCharNode {
        return {
            ...super.exportJSON(),
            type: this.getType(),
            usxStyle: this.getUsxStyle(),
            version: CHAR_VERSION,
        };
    }
}

export function $createCharNode(
    text: string,
    usxStyle: CharUsxStyle,
): CharNode {
    return $applyNodeReplacement(new CharNode(text, usxStyle));
}

export function $isCharNode(
    node: LexicalNode | null | undefined,
): node is CharNode {
    return node instanceof CharNode;
}
