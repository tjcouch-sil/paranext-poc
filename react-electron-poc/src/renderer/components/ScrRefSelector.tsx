import { ScriptureReference } from '@shared/data/ScriptureTypes';
import React, { useCallback, useEffect, useState } from 'react';
import './Components.css';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ScrRefSelectorProps {
    scrRef: ScriptureReference;
    handleSubmit: (scrRef: ScriptureReference) => void;
}

// TODO: Move to util
const regexpScrRef = /([^ ]+) ([^:]+):(.+)/;
const getRefFromText = (refText: string): ScriptureReference => {
    if (!refText) return { book: -1, chapter: -1, verse: -1 };
    const scrRefMatch = refText.match(regexpScrRef);
    if (!scrRefMatch || scrRefMatch.length < 4)
        return { book: -1, chapter: -1, verse: -1 };
    return {
        book: parseInt(scrRefMatch[1], 10),
        chapter: parseInt(scrRefMatch[2], 10),
        verse: parseInt(scrRefMatch[3], 10),
    };
};

const getTextFromRef = (scrRef: ScriptureReference): string =>
    `${scrRef.book} ${scrRef.chapter}:${scrRef.verse}`;

export default ({ scrRef, handleSubmit }: ScrRefSelectorProps) => {
    const [currentRefText, setCurrentRefText] = useState<string>(
        getTextFromRef(scrRef),
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setCurrentRefText(e.currentTarget.value);
        },
        [],
    );

    useEffect(() => {
        setCurrentRefText(getTextFromRef(scrRef));
    }, [scrRef]);

    return (
        <form
            className="scrref-form"
            onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                handleSubmit(getRefFromText(currentRefText));
            }}
        >
            <input type="text" className="scrref-input" value={currentRefText} onChange={handleChange} />
            <button type="submit" className="scrref-button">
                Go!
            </button>
        </form>
    );
};
