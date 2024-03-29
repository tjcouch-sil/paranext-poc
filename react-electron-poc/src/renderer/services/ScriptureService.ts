import {
    ResourceInfo,
    ScriptureChapterContent,
    ScriptureChapterString,
} from '@shared/data/ScriptureTypes';
import { getTextFromScrRef } from '@util/ScriptureUtil';
import { performanceLog } from './PerformanceService';

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
    const startGet = performance.now();
    try {
        const scrChapterContents =
            chapter >= 0
                ? await window.electronAPI.scripture
                      .getScriptureChapter(shortName, bookNum, chapter)
                      .then((result) => [result])
                : await window.electronAPI.scripture.getScriptureBook(
                      shortName,
                      bookNum,
                  );
        const startParse = performance.now();
        const scrChapterContentsParsed = scrChapterContents.map(
            (scrChapterContent) => ({
                ...scrChapterContent,
                contents: JSON.parse(
                    scrChapterContent.contents as unknown as string, // Parsing from string, but it's nice to know getScripture intends to send json of known type
                ),
            }),
        );
        const end = performance.now();
        performanceLog(
            {
                name: `ScriptureService.getScripture(${shortName}, ${bookNum}, ${chapter})`,
                operation: 'Parsing JSON',
            },
            `took ${end - startParse} ms`,
        );
        performanceLog(
            {
                name: `ScriptureService.getScripture(${shortName}, ${bookNum}, ${chapter})`,
                operation: '',
            },
            `took ${end - startGet} ms`,
        );
        return scrChapterContentsParsed;
    } catch (e) {
        performanceLog(
            {
                name: `ScriptureService.getScripture(${shortName}, ${bookNum}, ${chapter})`,
                operation: 'Exception',
            },
            `took ${performance.now() - startGet} ms`,
        );
        console.log(e);
        return [
            {
                chapter,
                contents: [
                    {
                        text: `Could not get contents of ${shortName} ${getTextFromScrRef(
                            { book: bookNum, chapter, verse: -1 },
                        )}.`,
                    },
                ],
            },
        ];
    }
};

/** Gets the specified Scripture chapter in the specified book from the specified project in Slate JSON from USX on the backend */
export const getScriptureJSONFromUsx = getScripture;

/**
 * Writes the specified Scripture chapter in the specified book from the specified project in Slate JSON
 * @param shortName the short name of the project
 * @param bookNum number of book to write
 * @param chapter number of chapter to write. Defaults to -1 meaning the whole book
 * @returns Promise that resolves true when writing is finished or false if there was an exception
 */
export const writeScripture = async (
    shortName: string,
    bookNum: number,
    chapter = -1,
    contents: ScriptureChapterContent[],
): Promise<boolean> => {
    const start = performance.now();
    try {
        const contentsJSON = contents.map((content) => ({
            ...content,
            contents: JSON.stringify(content.contents),
        })) as unknown as ScriptureChapterContent[];
        performanceLog(
            {
                name: `ScriptureService.writeScripture(${shortName}, ${bookNum}, ${chapter})`,
                operation: 'Stringifying',
            },
            `took ${performance.now() - start} ms`,
        );
        if (chapter >= 0)
            await window.electronAPI.scripture.writeScriptureChapter(
                shortName,
                bookNum,
                chapter,
                contentsJSON[0],
            );
        else
            await window.electronAPI.scripture.writeScriptureBook(
                shortName,
                bookNum,
                contentsJSON,
            );
        performanceLog(
            {
                name: `ScriptureService.writeScripture(${shortName}, ${bookNum}, ${chapter})`,
                operation: '',
            },
            `took ${performance.now() - start} ms`,
        );
        return true;
    } catch (e) {
        performanceLog(
            {
                name: `ScriptureService.writeScripture(${shortName}, ${bookNum}, ${chapter})`,
                operation: 'Exception',
            },
            `took ${performance.now() - start} ms`,
        );
        console.log(e);
        return false;
    }
    // Make sure to stringify the contents before sending them over
};

/**
 * Gets the specified Scripture chapter in the specified book from the specified project in USFM
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
    try {
        return chapter >= 0
            ? await window.electronAPI.scripture
                  .getScriptureChapterRaw(shortName, bookNum, chapter)
                  .then((result) => [result])
            : await window.electronAPI.scripture.getScriptureBookRaw(
                  shortName,
                  bookNum,
              );
    } catch (e) {
        console.log(e);
        return [
            {
                chapter,
                contents: `Could not get contents of ${shortName} ${getTextFromScrRef(
                    { book: bookNum, chapter, verse: -1 },
                )}.`,
            },
        ];
    }
};

/**
 * Gets the specified Scripture chapter in the specified book from the specified project in USX
 * @param shortName the short name of the project
 * @param bookNum number of book to get
 * @param chapter number of chapter to get. Defaults to -1 meaning the whole book
 * @returns Promise with specified chapter or book if chapter not specified
 */
export const getScriptureUsx = async (
    shortName: string,
    bookNum: number,
    chapter = -1,
): Promise<ScriptureChapterString[]> => {
    const startGet = performance.now();
    try {
        const scrChapterContents =
            chapter >= 0
                ? await window.electronAPI.scripture
                      .getScriptureChapterUsx(shortName, bookNum, chapter)
                      .then((result) => [result])
                : await window.electronAPI.scripture.getScriptureBookUsx(
                      shortName,
                      bookNum,
                  );
        performanceLog(
            {
                name: `ScriptureService.getScriptureUsx(${shortName}, ${bookNum}, ${chapter})`,
                operation: '',
            },
            `took ${performance.now() - startGet} ms`,
        );
        return scrChapterContents;
    } catch (e) {
        performanceLog(
            {
                name: `ScriptureService.getScriptureUsx(${shortName}, ${bookNum}, ${chapter})`,
                operation: 'Exception',
            },
            `took ${performance.now() - startGet} ms`,
        );
        console.log(e);
        return [
            {
                chapter,
                contents: `Could not get contents of ${shortName} ${getTextFromScrRef(
                    { book: bookNum, chapter, verse: -1 },
                )}.`,
            },
        ];
    }
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
    try {
        return chapter >= 0
            ? await window.electronAPI.scripture
                  .getScriptureChapterHtml(shortName, bookNum, chapter)
                  .then((result) => [result])
            : await window.electronAPI.scripture.getScriptureBookHtml(
                  shortName,
                  bookNum,
              );
    } catch (e) {
        console.log(e);
        return [
            {
                chapter,
                contents: `Could not get contents of ${shortName} ${getTextFromScrRef(
                    { book: bookNum, chapter, verse: -1 },
                )}.`,
            },
        ];
    }
};

/**
 * Gets the specified Scripture stylesheeet from the specified project
 * @param shortName the short name of the project
 * @returns Promise with specified Scripture stylesheet
 */
export const getScriptureStyle = async (shortName: string): Promise<string | undefined> => {
    const style = await window.electronAPI.scripture.getScriptureStyle(
        shortName,
    );
    // TODO: Fix RTL scripture style sheets
    return style.includes('direction: rtl;') ? undefined : style;
};

/**
 * Gets information about the resource with the specified short name
 * @param shortName the short name of the project
 * @returns Promise with ResourceInfo for the specified resource
 */
export const getResourceInfo = async (
    shortName: string,
): Promise<ResourceInfo> => {
    return window.electronAPI.scripture.getResourceInfo(shortName);
};

/**
 * Gets information about all available resources
 * @returns Promise with array of ResourceInfo for all resources
 */
export const getAllResourceInfo = async (): Promise<ResourceInfo[]> => {
    return window.electronAPI.scripture.getAllResourceInfo();
};

/**
 * Tell the backend that the user focused on a resource so the backend can do what it wants like set the keyboard.
 * @returns Promise that resolves when the backend is finished processing
 */
export const setActiveResource = async (shortName: string): Promise<void> => {
    return window.electronAPI.scripture.setActiveResource(shortName);
};
