import { $getListDepth, $isListItemNode, $isListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    INDENT_CONTENT_COMMAND,
    COMMAND_PRIORITY_HIGH,
    RangeSelection,
    NodeSelection,
    GridSelection,
    ElementNode,
} from 'lexical';
import { useEffect } from 'react';

function getElementNodesInSelection(
    selection: null | RangeSelection | NodeSelection | GridSelection,
): Set<ElementNode> {
    const nodesInSelection = selection?.getNodes();

    if (selection != null && nodesInSelection?.length === 0) {
        const selected = selection as RangeSelection | GridSelection;
        return new Set([
            selected.anchor.getNode().getParentOrThrow(),
            selected.focus.getNode().getParentOrThrow(),
        ]);
    }

    return new Set(
        nodesInSelection?.map((n) =>
            $isElementNode(n) ? n : n.getParentOrThrow(),
        ),
    );
}

function isIndentPermitted(maxDepth: number): boolean {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
        return false;
    }

    const elementNodesInSelection = getElementNodesInSelection(selection);

    let totalDepth = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const elementNode of elementNodesInSelection) {
        if ($isListNode(elementNode)) {
            totalDepth = Math.max($getListDepth(elementNode) + 1, totalDepth);
        } else if ($isListItemNode(elementNode)) {
            const parent = elementNode.getParent();
            if (!$isListNode(parent)) {
                throw new Error(
                    'ListMaxIndentLevelPlugin: A ListItemNode must have a ListNode for a parent.',
                );
            }

            totalDepth = Math.max($getListDepth(parent) + 1, totalDepth);
        }
    }

    return totalDepth <= maxDepth;
}

export default function ListMaxIndentLevelPlugin({
    maxDepth,
}: {
    maxDepth: number;
}): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            INDENT_CONTENT_COMMAND,
            () => !isIndentPermitted(maxDepth ?? 7),
            COMMAND_PRIORITY_HIGH,
        );
    }, [editor, maxDepth]);

    return null;
}
