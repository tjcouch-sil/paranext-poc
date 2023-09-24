/* eslint-disable class-methods-use-this, no-underscore-dangle */

import {
    type LexicalNode,
    type NodeKey,
    $applyNodeReplacement,
    DecoratorNode,
    SerializedLexicalNode,
    Spread,
} from 'lexical';
import { ReactNode, createElement } from 'react';

/** @see https://ubsicap.github.io/usx/notes.html */
export const VALID_NOTE_STYLES = [
    // Footnote
    'f',
    'fe',
    'ef',
    // Cross Reference
    'x',
    'ex',
] as const;
export const NOTE_VERSION = 1;

export type NoteUsxStyle = typeof VALID_NOTE_STYLES[number];

export type SerializedNoteNode = Spread<
    {
        caller: string;
        usxStyle: NoteUsxStyle;
        previewText: string;
    },
    SerializedLexicalNode
>;

export class NoteNode extends DecoratorNode<void> {
    __caller: string;

    __usxStyle: NoteUsxStyle;

    __previewText: string;

    static getType(): string {
        return 'note';
    }

    static clone(node: NoteNode): NoteNode {
        return new NoteNode(node.__caller, node.__usxStyle, node.__key);
    }

    static importJSON(serializedNode: SerializedNoteNode): NoteNode {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const node = $createNoteNode(
            serializedNode.caller,
            serializedNode.usxStyle,
            serializedNode.previewText,
        );
        node.setUsxStyle(serializedNode.usxStyle);
        return node;
    }

    constructor(
        caller: string,
        usxStyle: NoteUsxStyle,
        previewText: string,
        key?: NodeKey,
    ) {
        super(key);
        this.__caller = caller;
        this.__usxStyle = usxStyle;
        this.__previewText = previewText;
    }

    setCaller(caller: string): void {
        const self = this.getWritable();
        self.__caller = caller;
    }

    getCaller(): string {
        const self = this.getLatest();
        return self.__caller;
    }

    setUsxStyle(usxStyle: NoteUsxStyle): void {
        const self = this.getWritable();
        self.__usxStyle = usxStyle;
    }

    getUsxStyle(): NoteUsxStyle {
        const self = this.getLatest();
        return self.__usxStyle;
    }

    setPreviewText(previewText: string): void {
        const self = this.getWritable();
        self.__previewText = previewText;
    }

    getPreviewText(): string {
        const self = this.getLatest();
        return self.__previewText;
    }

    createDOM(): HTMLElement {
        const dom = document.createElement('span');
        dom.setAttribute('data-caller', this.__caller);
        dom.setAttribute('data-usx-style', this.__usxStyle);
        dom.setAttribute('data-preview-text', this.__previewText);
        dom.classList.add(this.getType(), `usfm_${this.__usxStyle}`);
        return dom;
    }

    updateDOM(_prevNode: NoteNode, _dom: HTMLElement): boolean {
        // Returning false tells Lexical that this node does not need its
        // DOM element replacing with a new copy from createDOM.
        return false;
    }

    decorate(): ReactNode {
        return createElement(
            'a',
            { href: '', title: this.__previewText },
            this.__caller,
        );
    }

    exportJSON(): SerializedNoteNode {
        return {
            type: this.getType(),
            caller: this.getCaller(),
            usxStyle: this.getUsxStyle(),
            previewText: this.getPreviewText(),
            version: NOTE_VERSION,
        };
    }
}

export function $createNoteNode(
    caller: string,
    usxStyle: NoteUsxStyle,
    previewText: string,
): NoteNode {
    return $applyNodeReplacement(new NoteNode(caller, usxStyle, previewText));
}

export function $isNoteNode(
    node: LexicalNode | null | undefined,
): node is NoteNode {
    return node instanceof NoteNode;
}
