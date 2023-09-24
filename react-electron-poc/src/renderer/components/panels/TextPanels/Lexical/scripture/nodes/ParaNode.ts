/* eslint-disable class-methods-use-this, no-underscore-dangle */

import {
    type LexicalNode,
    type NodeKey,
    $applyNodeReplacement,
    ParagraphNode,
    Spread,
    SerializedElementNode,
} from 'lexical';

export const PARA_STYLE_DEFAULT = 'p';
/** @see https://ubsicap.github.io/usx/parastyles.html */
export const VALID_PARA_STYLES = [
    // Identification
    'h',
    'toc1',
    'toc2',
    'toc3',
    'toca1',
    'toca2',
    'toca3',
    // Introductions
    // Titles and Headings (partial)
    'mt',
    'mt1',
    'mt2',
    'mt3',
    'cl',
    'ms',
    'ms1',
    'ms2',
    'mr',
    's',
    's1',
    's2',
    'r',
    'd',
    'sp',
    // Paragraphs
    PARA_STYLE_DEFAULT,
    'm',
    'po',
    'pr',
    'cls',
    'pmo',
    'pm',
    'pmc',
    'pmr',
    'pi',
    'pi1',
    'pi2',
    'pi3',
    'mi',
    'pc',
    'ph',
    'ph1',
    'ph2',
    'ph3',
    'lit',
    // Poetry
    'q',
    'q1',
    'q2',
    'q3',
    'qr',
    'qc',
    'qa',
    'qm',
    'qm1',
    'qm2',
    'qm3',
    'qd',
    'b',
    // Lists
] as const;
export const PARA_VERSION = 1;

export type ParaUsxStyle = typeof VALID_PARA_STYLES[number];

export type SerializedParaNode = Spread<
    {
        usxStyle: ParaUsxStyle;
    },
    SerializedElementNode
>;

export class ParaNode extends ParagraphNode {
    __usxStyle: ParaUsxStyle;

    static getType(): string {
        return 'para';
    }

    static clone(node: ParaNode): ParaNode {
        return new ParaNode(node.__usxStyle, node.__key);
    }

    static importJSON(serializedNode: SerializedParaNode): ParaNode {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const node = $createParaNode(serializedNode.usxStyle);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    constructor(usxStyle: ParaUsxStyle = PARA_STYLE_DEFAULT, key?: NodeKey) {
        super(key);
        this.__usxStyle = usxStyle;
    }

    setUsxStyle(usxStyle: ParaUsxStyle): void {
        const self = this.getWritable();
        self.__usxStyle = usxStyle;
    }

    getUsxStyle(): ParaUsxStyle {
        const self = this.getLatest();
        return self.__usxStyle;
    }

    createDOM(): HTMLElement {
        // Define the DOM element here
        const dom = document.createElement('p');
        dom.setAttribute('data-usx-style', this.__usxStyle);
        dom.classList.add(this.getType(), `usfm_${this.__usxStyle}`);
        return dom;
    }

    updateDOM(_prevNode: ParaNode, _dom: HTMLElement): boolean {
        // Returning false tells Lexical that this node does not need its
        // DOM element replacing with a new copy from createDOM.
        return false;
    }

    exportJSON(): SerializedParaNode {
        return {
            ...super.exportJSON(),
            type: this.getType(),
            usxStyle: this.getUsxStyle(),
            version: PARA_VERSION,
        };
    }
}

export function $createParaNode(usxStyle?: ParaUsxStyle): ParaNode {
    return $applyNodeReplacement(new ParaNode(usxStyle));
}

export function $isParaNode(
    node: LexicalNode | null | undefined,
): node is ParaNode {
    return node instanceof ParaNode;
}
