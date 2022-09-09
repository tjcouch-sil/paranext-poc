/**
 * Gets the specified Scripture chapter in the specified book in USX
 * @param bookNum number of book to get
 * @param chapter number of chapter to get. Defaults to -1 meaning the whole book
 * @returns Promise with specified chapter or book if chapter not specified
 */
export const getScripture = async (
    bookNum: number,
    chapter = -1,
): Promise<string> => {
    return window.electronAPI.scripture.getScripture(bookNum, chapter);
};

/**
 * Gets the specified Scripture book and chapter in HTML
 * @param bookNum number of book to get
 * @param chapter number of chapter to get. Defaults to -1 meaning the whole book
 * @returns Promise with specified chapter or book if chapter not specified
 */
export const getScriptureHtml = async (
    bookNum: number,
    chapter = -1,
): Promise<string> => {
    return window.electronAPI.scripture.getScriptureHtml(bookNum, chapter);
};
