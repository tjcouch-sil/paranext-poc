/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { KeyboardEvent, PropsWithChildren, useEffect } from 'react';
import { HtmlPerfEditor } from '@xelah/type-perf-html';
import { HtmlPerf } from 'epitelete-html';
import { Toggles } from 'renderer/models/toggles.model';
import { getCurrentVerse, getCurrentChapter } from './helpers/getReferences';

const getTarget = ({ content }: { content: string }): string | undefined => {
    const div = document.createElement('div');
    div.innerHTML = content;

    const { target } = (div.firstChild as HTMLElement)?.dataset || {};

    return target;
};

type OnHtmlPerf = {
    htmlPerf: HtmlPerf;
    sequence: {
        sequenceId: string;
        htmlSequence: unknown;
    };
};

export type OnReferenceSelected = ({
    bookId,
    chapter,
    verse,
}: {
    bookId: string;
    chapter: string;
    verse: string;
}) => void;

type RecursiveBlockProps = PropsWithChildren<{
    htmlPerf: HtmlPerf;
    onHtmlPerf(args: OnHtmlPerf): OnHtmlPerf;
    sequenceIds: string[];
    addSequenceId(sequenceId: string): void;
    options: Toggles;
    content: string;
    style: unknown;
    contentEditable: boolean | 'inherit' | undefined;
    index: number;
    verbose: boolean;
    setFootNote(args: unknown): unknown;
    bookId: string;
    onReferenceSelected: OnReferenceSelected;
}>;

export default function RecursiveBlock({
    htmlPerf,
    onHtmlPerf,
    sequenceIds,
    addSequenceId,
    options,
    content,
    style,
    contentEditable,
    index,
    verbose,
    setFootNote,
    bookId,
    onReferenceSelected,
    ...props
}: RecursiveBlockProps): JSX.Element {
    useEffect(() => {
        if (verbose) console.log('Block: Mount/First Render', index);
        return () => {
            if (verbose) console.log('Block: UnMount/Destroyed', index);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkReturnKeyPress = (event: KeyboardEvent) => {
        if (verbose) console.log(event);
        if (event.key === 'Enter') {
            const activeTextArea = document.activeElement;
            if (
                activeTextArea?.children?.length &&
                activeTextArea.children.length > 1
            ) {
                const lineBreak = activeTextArea.children[1].outerHTML;
                activeTextArea.children[1].outerHTML = lineBreak.replace(
                    /<br\s*\/?>/gi,
                    '&nbsp',
                );
            }
        }
    };

    const checkCurrentVerse = () => {
        const range = document.getSelection()?.getRangeAt(0);
        const selectedNode = range?.startContainer;
        const verse = getCurrentVerse(selectedNode);
        const chapter = getCurrentChapter(selectedNode);
        if (onReferenceSelected && chapter && verse) {
            onReferenceSelected({ bookId, chapter, verse });
        }
    };

    let component;

    const editable = !!content.match(/data-type="paragraph"/);

    if (editable) {
        component = (
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div
                contentEditable={contentEditable}
                onKeyUp={checkReturnKeyPress}
                onMouseUp={checkCurrentVerse}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
            />
        );
    }

    if (!editable) {
        const sequenceId = getTarget({ content });

        if (sequenceId && !options.preview) {
            const htmlEditorProps = {
                sequenceIds: [...sequenceIds, sequenceId],
                addSequenceId,
                htmlPerf,
                onHtmlPerf,
            };
            // eslint-disable-next-line react/jsx-props-no-spreading
            component = <HtmlPerfEditor {...htmlEditorProps} />;
        }
        // eslint-disable-next-line react/jsx-props-no-spreading
        component ||= <div {...props} contentEditable={false} />;
    }

    return <>{component}</>;
}
