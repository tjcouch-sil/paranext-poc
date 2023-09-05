/* eslint-disable class-methods-use-this, no-underscore-dangle */

import {
    type LexicalNode,
    type NodeKey,
    $applyNodeReplacement,
    DecoratorNode,
    SerializedLexicalNode,
    Spread,
} from 'lexical';

export const CHAPTER_STYLE = 'c';
export const CHAPTER_VERSION = 1;

type ChapterUsxStyle = typeof CHAPTER_STYLE;

export type SerializedChapterNode = Spread<
    {
        number: number;
        usxStyle: ChapterUsxStyle;
    },
    SerializedLexicalNode
>;

export class ChapterNode extends DecoratorNode<void> {
    __number: number;

    __usxStyle: ChapterUsxStyle;

    static getType(): string {
        return 'chapter';
    }

    static clone(node: ChapterNode): ChapterNode {
        return new ChapterNode(node.__number, node.__key);
    }

    static importJSON(serializedNode: SerializedChapterNode): ChapterNode {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const node = $createChapterNode(serializedNode.number);
        node.setUsxStyle(serializedNode.usxStyle);
        return node;
    }

    constructor(chapterNumber: number, key?: NodeKey) {
        super(key);
        this.__number = chapterNumber;
        this.__usxStyle = CHAPTER_STYLE;
    }

    setNumber(chapterNumber: number): void {
        const self = this.getWritable();
        self.__number = chapterNumber;
    }

    getNumber(): number {
        const self = this.getLatest();
        return self.__number;
    }

    setUsxStyle(usxStyle: ChapterUsxStyle): void {
        const self = this.getWritable();
        self.__usxStyle = usxStyle;
    }

    getUsxStyle(): ChapterUsxStyle {
        const self = this.getLatest();
        return self.__usxStyle;
    }

    createDOM(): HTMLElement {
        const dom = document.createElement('span');
        dom.setAttribute('data-number', this.__number.toString());
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

    decorate(): void {}

    exportJSON(): SerializedChapterNode {
        return {
            type: this.getType(),
            number: this.getNumber(),
            usxStyle: this.getUsxStyle(),
            version: CHAPTER_VERSION,
        };
    }
}

export function $createChapterNode(chapterNumber: number): ChapterNode {
    return $applyNodeReplacement(new ChapterNode(chapterNumber));
}

export function $isChapterNode(
    node: LexicalNode | null | undefined,
): node is ChapterNode {
    return node instanceof ChapterNode;
}
