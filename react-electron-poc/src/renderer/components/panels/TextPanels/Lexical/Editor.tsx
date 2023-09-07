/**
 * Converted to typescript from the Lexical React example.
 * @see https://codesandbox.io/s/lexical-rich-text-example-5tncvy
 */

import {
    InitialConfigType,
    LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { ScriptureChapterContent } from '@shared/data/ScriptureTypes';
import editorTheme from './themes/editor-theme';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import scriptureNodes from './scripture/nodes';
import UpdateState from './plugins/UpdateState';

function Placeholder(): JSX.Element {
    return <div className="editor-placeholder">Enter some rich text...</div>;
}

const editorConfig: InitialConfigType = {
    namespace: 'mainEditor',
    theme: editorTheme,
    // Handling of errors during update
    onError(error) {
        throw error;
    },
    // Any custom nodes go here
    nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        ...scriptureNodes,
    ],
};

export default function Editor({
    scrChapters,
}: {
    scrChapters: ScriptureChapterContent[];
}): JSX.Element {
    return (
        <LexicalComposer initialConfig={editorConfig}>
            <div className="editor-container">
                <ToolbarPlugin />
                <div className="editor-inner">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable className="editor-input" />
                        }
                        placeholder={<Placeholder />}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <TreeViewPlugin />
                    <AutoFocusPlugin />
                    <CodeHighlightPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <AutoLinkPlugin />
                    <UpdateState scrChapters={scrChapters} />
                    <ListMaxIndentLevelPlugin maxDepth={7} />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                </div>
            </div>
        </LexicalComposer>
    );
}
