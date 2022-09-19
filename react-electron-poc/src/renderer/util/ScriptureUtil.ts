import { ScriptureReference } from '@shared/data/ScriptureTypes';
import { isString } from './Util';

const scrBookNames: string[][] = [
    ['ERR', 'ERROR'],
    ['GEN', 'Genesis'],
    ['EXO', 'Exodus'],
    ['LEV', 'Leviticus'],
    ['NUM', 'Numbers'],
    ['DEU', 'Deuteronomy'],
    ['JOS', 'Joshua'],
    ['JDG', 'Judges'],
    ['RUT', 'Ruth'],
    ['1SA', '1 Samuel'],
    ['2SA', '2 Samuel'],
    ['1KI', '1 Kings'],
    ['2KI', '2 Kings'],
    ['1CH', '1 Chronicles'],
    ['2CH', '2 Chronicles'],
    ['EZR', 'Ezra'],
    ['NEH', 'Nehemiah'],
    ['EST', 'Esther'],
    ['JOB', 'Job'],
    ['PSA', 'Psalm', 'Psalms'],
    ['PRO', 'Proverbs'],
    ['ECC', 'Ecclesiastes'],
    ['SNG', 'Song of Songs', 'Song of Solomon'],
    ['ISA', 'Isaiah'],
    ['JER', 'Jeremiah'],
    ['LAM', 'Lamentations'],
    ['EZK', 'Ezekiel'],
    ['DAN', 'Daniel'],
    ['HOS', 'Hosea'],
    ['JOL', 'Joel'],
    ['AMO', 'Amos'],
    ['OBA', 'Obadiah'],
    ['JON', 'Jonah'],
    ['MIC', 'Micah'],
    ['NAM', 'Nahum'],
    ['HAB', 'Habakkuk'],
    ['ZEP', 'Zephaniah'],
    ['HAG', 'Haggai'],
    ['ZEC', 'Zechariah'],
    ['MAL', 'Malachi'],
    ['MAT', 'Matthew'],
    ['MRK', 'Mark'],
    ['LUK', 'Luke'],
    ['JHN', 'John'],
    ['ACT', 'Acts'],
    ['ROM', 'Romans'],
    ['1CO', '1 Corinthians'],
    ['2CO', '2 Corinthians'],
    ['GAL', 'Galatians'],
    ['EPH', 'Ephesians'],
    ['PHP', 'Philippians'],
    ['COL', 'Colossians'],
    ['1TH', '1 Thessalonians'],
    ['2TH', '2 Thessalonians'],
    ['1TI', '1 Timothy'],
    ['2TI', '2 Timothy'],
    ['TIT', 'Titus'],
    ['PHM', 'Philemon'],
    ['HEB', 'Hebrews'],
    ['JAS', 'James'],
    ['1PE', '1 Peter'],
    ['2PE', '2 Peter'],
    ['1JN', '1 John'],
    ['2JN', '2 John'],
    ['3JN', '3 John'],
    ['JUD', 'Jude'],
    ['REV', 'Revelation'],
];
const firstScrBookNum = 1;
const lastScrBookNum = scrBookNames.length - 1;

export const getBookNumFromName = (bookName: string): number => {
    return scrBookNames.findIndex((bookNames) => bookNames.includes(bookName));
};

export const getAllBookNamesFromNum = (bookNum: number): string[] => {
    return [
        ...scrBookNames[
            bookNum < firstScrBookNum || bookNum > lastScrBookNum ? 0 : bookNum
        ],
    ];
};

export const getBookShortNameFromNum = (bookNum: number): string => {
    return scrBookNames[
        bookNum < firstScrBookNum || bookNum > lastScrBookNum ? 0 : bookNum
    ][0];
};

export const getBookLongNameFromNum = (bookNum: number): string => {
    return scrBookNames[
        bookNum < firstScrBookNum || bookNum > lastScrBookNum ? 0 : bookNum
    ][1];
};

export const offsetBook = (
    scrRef: ScriptureReference,
    offset: number,
): ScriptureReference => ({
    book: Math.max(
        firstScrBookNum,
        Math.min(scrRef.book + offset, lastScrBookNum),
    ),
    chapter: 1,
    verse: 1,
});

export const offsetChapter = (
    scrRef: ScriptureReference,
    offset: number,
): ScriptureReference => ({
    ...scrRef,
    chapter: scrRef.chapter + offset,
    verse: 1,
});

export const offsetVerse = (
    scrRef: ScriptureReference,
    offset: number,
): ScriptureReference => ({ ...scrRef, verse: scrRef.verse + offset });

const regexpScrRef = /([^ ]+) ([^:]+):(.+)/;
export const getScrRefFromText = (refText: string): ScriptureReference => {
    if (!refText) return { book: -1, chapter: -1, verse: -1 };
    const scrRefMatch = refText.match(regexpScrRef);
    if (!scrRefMatch || scrRefMatch.length < 4)
        return { book: -1, chapter: -1, verse: -1 };
    return {
        book: getBookNumFromName(scrRefMatch[1]),
        chapter: parseInt(scrRefMatch[2], 10),
        verse: parseInt(scrRefMatch[3], 10),
    };
};

export const getTextFromScrRef = (scrRef: ScriptureReference): string =>
    `${getBookLongNameFromNum(scrRef.book)} ${scrRef.chapter}${
        scrRef.verse >= 0 ? `:${scrRef.verse}` : ''
    }`;

export const areScrRefsEqual = (
    scrRef1: ScriptureReference | string,
    scrRef2: ScriptureReference | string,
): boolean => {
    if (scrRef1 === scrRef2) return true;

    const scrRef1Final: ScriptureReference = isString(scrRef1)
        ? getScrRefFromText(scrRef1 as string)
        : (scrRef1 as ScriptureReference);
    const scrRef2Final: ScriptureReference = isString(scrRef2)
        ? getScrRefFromText(scrRef2 as string)
        : (scrRef2 as ScriptureReference);
    return (
        scrRef1Final.book === scrRef2Final.book &&
        scrRef1Final.chapter === scrRef2Final.chapter &&
        scrRef1Final.verse === scrRef2Final.verse
    );
};
