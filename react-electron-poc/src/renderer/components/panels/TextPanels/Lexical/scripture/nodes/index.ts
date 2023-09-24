import { ParagraphNode } from 'lexical';
import { ChapterNode } from './ChapterNode';
import { CharNode } from './CharNode';
import { ParaNode } from './ParaNode';
import { NoteNode } from './NoteNode';
import { VerseNode } from './VerseNode';

const scriptureNodes = [
    ChapterNode,
    VerseNode,
    CharNode,
    NoteNode,
    ParaNode,
    {
        replace: ParagraphNode,
        with: (_node: ParagraphNode) => {
            return new ParaNode();
        },
    },
];
export default scriptureNodes;
