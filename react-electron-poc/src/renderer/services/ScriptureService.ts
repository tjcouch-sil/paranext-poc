/**
 * Gets the specified Scripture chapter in the specified book from the specified project in USX
 * @param shortName the short name of the project
 * @param bookNum number of book to get
 * @param chapter number of chapter to get. Defaults to -1 meaning the whole book
 * @returns Promise with specified chapter or book if chapter not specified
 */
export const getScripture = async (
    shortName: string,
    bookNum: number,
    chapter = -1,
): Promise<string> => {
    return window.electronAPI.scripture.getScripture(
        shortName,
        bookNum,
        chapter,
    );
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
): Promise<string> => {
    return window.electronAPI.scripture.getScriptureHtml(
        shortName,
        bookNum,
        chapter,
    );
};

/**
 * Gets the specified Scripture stylesheeet from the specified project
 * @param shortName the short name of the project
 * @returns Promise with specified Scripture stylesheet
 */
export const getScriptureStyle = async (shortName: string): Promise<string> => {
    return window.electronAPI.scripture.getScriptureStyle(shortName);
};
