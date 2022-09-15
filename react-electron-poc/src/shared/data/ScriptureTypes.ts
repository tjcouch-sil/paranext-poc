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
