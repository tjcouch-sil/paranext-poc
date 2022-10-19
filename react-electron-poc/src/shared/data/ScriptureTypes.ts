import { PropsWithChildren } from 'react';
import { BaseEditor } from 'slate';
import { HistoryEditor } from 'slate-history';
import { ReactEditor, RenderElementProps } from 'slate-react';

export interface ScriptureReference {
    book: number;
    chapter: number;
    verse: number;
}

export interface ResourceInfo {
    shortName: string;
    editable?: boolean;
}

/** Slate object for Scripture editing */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type ScriptureContent = CustomDescendant;

/** Scipture chapter contents along with which chapter it is */
export interface ScriptureChapter {
    chapter: number;
    contents: unknown;
}

/** Scipture chapter contents Slate object along with which chapter it is */
export interface ScriptureChapterContent extends ScriptureChapter {
    contents: ScriptureContent[];
}

/** Scripture chapter string (usx, usfm, html, etc) along with which chapter it is */
export interface ScriptureChapterString extends ScriptureChapter {
    contents: string;
}

// Slate Types
// TODO: Figure out which ones of these should be put back in ScriptureTextPanelSlate

export type CustomSlateEditor = {
    editable?: boolean;
} & BaseEditor &
    ReactEditor &
    HistoryEditor &
    ScriptureContentChunkInfo;

// Types of components:
//      Element - contiguous, semantic elements in the document
//          - Ex: Marker Element (in-line) that contains a line and is formatted appropriately
//          - Note: You cannot have block elements as siblings of inline elements or text.
//          - Note: You cannot have children of inline elements other than text, it seems.
//      Text - non-contiguous, character-level formatting
//      Decoration - computed at render-time based on the content itself
//          - helpful for dynamic formatting like syntax highlighting or search keywords, where changes to the content (or some external data) has the potential to change the formatting
//          - Ex: The text inside markers is styled literally based on if there's a \
//                The notes are based on certain text in a verse
//                Maybe we can make decorations that show the \markers before the lines? Otherwise need to be inline void elements
// Normalizing - enforce rules about your content like structure and such
//      - Ex: Enforce that a marker element has the \marker at the beginning

/** Information about a chunk of Scripture content. Found on the slate editor */
export type ScriptureContentChunkInfo = {
    chapter: number;
    chunkNum: number;
    finalVerse: number;
};

export type ScriptureContentChunk = {
    contents: ScriptureContent[];
} & ScriptureContentChunkInfo;

export type MyRenderElementProps<T> = PropsWithChildren<
    {
        element: T;
    } & Omit<RenderElementProps, 'element' | 'children'>
>;

/** Base element props. All elements should have a style */
export type StyleProps = {
    style?: string;
};

export type MarkerProps = {
    closingMarker?: boolean;
} & StyleProps;

export type CustomElementProps = {
    children: CustomDescendant[];
} & StyleProps;

export type InlineElementProps = {
    endSpace?: boolean;
    closingMarker?: boolean;
} & MyRenderElementProps<CustomElementProps>;

export type VerseElementProps = {
    type: 'verse';
} & CustomElementProps;

export type ParaElementProps = {
    type: 'para';
} & CustomElementProps;

export type CharElementProps = {
    type: 'char';
} & CustomElementProps;

export type ChapterElementProps = {
    type: 'chapter';
} & CustomElementProps;

export type EditorElementProps = {
    type: 'editor';
    number: string;
    children: CustomDescendant[];
};

export type CustomElement =
    | VerseElementProps
    | ParaElementProps
    | CharElementProps
    | ChapterElementProps;
//    | EditorElementProps;

export type FormattedText = {
    text: string;
    searchResult?: boolean;
} & MarkerProps;

export type CustomText = FormattedText;

export type CustomDescendant = CustomElement | CustomText;

declare module 'slate' {
    interface CustomTypes {
        Editor: CustomSlateEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}
