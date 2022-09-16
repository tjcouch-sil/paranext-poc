import {
    ResourceInfo,
    ScriptureChapterContent,
    ScriptureChapterString,
} from '@shared/data/ScriptureTypes';

/**
 * Gets the specified Scripture chapter in the specified book from the specified project in Slate JSON
 * @param shortName the short name of the project
 * @param bookNum number of book to get
 * @param chapter number of chapter to get. Defaults to -1 meaning the whole book
 * @returns Promise with specified chapter or book if chapter not specified
 */
export const getScripture = async (
    shortName: string,
    bookNum: number,
    chapter = -1,
): Promise<ScriptureChapterContent[]> => {
    return chapter >= 0
        ? window.electronAPI.scripture
              .getScriptureChapter(shortName, bookNum, chapter)
              .then((result) => [result])
        : window.electronAPI.scripture.getScriptureBook(shortName, bookNum);
};

/**
 * Gets the specified Scripture chapter in the specified book from the specified project in USX
 * @param shortName the short name of the project
 * @param bookNum number of book to get
 * @param chapter number of chapter to get. Defaults to -1 meaning the whole book
 * @returns Promise with specified chapter or book if chapter not specified
 */
export const getScriptureRaw = async (
    shortName: string,
    bookNum: number,
    chapter = -1,
): Promise<ScriptureChapterString[]> => {
    return chapter >= 0
        ? window.electronAPI.scripture
              .getScriptureChapterRaw(shortName, bookNum, chapter)
              .then((result) => [result])
        : window.electronAPI.scripture.getScriptureBookRaw(shortName, bookNum);
};

/**
 * Gets the specified Scripture chapter in the specified book from the specified project in HTML
 * @param shortName the short name of the project
 * @param bookNum number of book to get
 * @param chapter number of chapter to get. Defaults to -1 meaning the whole book
 * @returns Promise with specified chapter or book if chapter not specified
 */
export const getScriptureHtml = async (
    shortName: string,
    bookNum: number,
    chapter = -1,
): Promise<ScriptureChapterString[]> => {
    return chapter >= 0
        ? window.electronAPI.scripture
              .getScriptureChapterHtml(shortName, bookNum, chapter)
              .then((result) => [result])
        : window.electronAPI.scripture.getScriptureBookHtml(shortName, bookNum);
};

/**
 * Gets the specified Scripture stylesheeet from the specified project
 * @param shortName the short name of the project
 * @returns Promise with specified Scripture stylesheet
 */
export const getScriptureStyle = async (shortName: string): Promise<string> => {
    return window.electronAPI.scripture.getScriptureStyle(shortName);
};

export const getResourceInfo = async (
    shortName: string,
): Promise<ResourceInfo> => {
    return window.electronAPI.scripture.getResourceInfo(shortName);
};

export const getAllResourceInfo = async (): Promise<ResourceInfo[]> => {
    return window.electronAPI.scripture.getAllResourceInfo();
};
