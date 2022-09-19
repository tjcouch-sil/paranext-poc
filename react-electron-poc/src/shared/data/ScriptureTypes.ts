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
export interface ScriptureContent {
    text: string;
}

/** Scipture chapter contents along with which chapter it is */
export interface ScriptureChapter {
    chapter: number;
    contents: unknown;
}

/** Scipture chapter contents Slate object along with which chapter it is */
export interface ScriptureChapterContent extends ScriptureChapter {
    contents: ScriptureContent;
}

/** Scripture chapter string (usx, usfm, html, etc) along with which chapter it is */
export interface ScriptureChapterString extends ScriptureChapter {
    contents: string;
}