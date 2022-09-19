import { ScriptureReference } from '@shared/data/ScriptureTypes';
import { getTextFromScrRef, getScrRefFromText } from '@util/ScriptureUtil';
import React, { useCallback, useEffect, useState } from 'react';
import './Components.css';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ScrRefSelectorProps {
    scrRef: ScriptureReference;
    handleSubmit: (scrRef: ScriptureReference) => void;
}

export default ({ scrRef, handleSubmit }: ScrRefSelectorProps) => {
    const [currentRefText, setCurrentRefText] = useState<string>(
        getTextFromScrRef(scrRef),
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setCurrentRefText(e.currentTarget.value);
        },
        [],
    );

    useEffect(() => {
        setCurrentRefText(getTextFromScrRef(scrRef));
    }, [scrRef]);

    return (
        <form
            className="scrref-form"
            onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                handleSubmit(getScrRefFromText(currentRefText));
            }}
        >
            <input
                type="text"
                className="scrref-input"
                value={currentRefText}
                onChange={handleChange}
            />
            <button type="submit" className="scrref-button">
                Go!
            </button>
        </form>
    );
};
