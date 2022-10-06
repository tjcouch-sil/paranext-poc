import { ScriptureReference } from '@shared/data/ScriptureTypes';
import {
    getTextFromScrRef,
    getScrRefFromText,
    getBookLongNameFromNum,
    areScrRefsEqual,
    offsetBook,
    offsetChapter,
    offsetVerse,
} from '@util/ScriptureUtil';
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
            setCurrentRefText(e.target.value);
        },
        [],
    );

    useEffect(() => {
        setCurrentRefText(getTextFromScrRef(scrRef));
    }, [scrRef]);

    const isScrRefChanged = !areScrRefsEqual(currentRefText, scrRef);

    return (
        <form
            className="scrref-form"
            onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                handleSubmit(getScrRefFromText(currentRefText));
            }}
        >
            <span
                className={`selector-area${isScrRefChanged ? ' changed' : ''}`}
            >
                <span>{getBookLongNameFromNum(scrRef.book)}</span>
                <button
                    type="button"
                    className="change-btn left"
                    onClick={() => handleSubmit(offsetBook(scrRef, -1))}
                    disabled={isScrRefChanged}
                >
                    &lt;
                </button>
                <span
                    className={`splitter${isScrRefChanged ? ' changed' : ''}`}
                />
                <button
                    type="button"
                    className="change-btn"
                    onClick={() => handleSubmit(offsetBook(scrRef, 1))}
                    disabled={isScrRefChanged}
                >
                    &gt;
                </button>
                <span>{scrRef.chapter}:</span>
                <button
                    type="button"
                    className="change-btn left"
                    onClick={() => handleSubmit(offsetChapter(scrRef, -1))}
                    disabled={isScrRefChanged}
                >
                    &lt;
                </button>
                <span
                    className={`splitter${isScrRefChanged ? ' changed' : ''}`}
                />
                <button
                    type="button"
                    className="change-btn"
                    onClick={() => handleSubmit(offsetChapter(scrRef, 1))}
                    disabled={isScrRefChanged}
                >
                    &gt;
                </button>
                <span>{scrRef.verse}</span>
                <button
                    type="button"
                    className="change-btn left"
                    onClick={() => handleSubmit(offsetVerse(scrRef, -1))}
                    disabled={isScrRefChanged}
                >
                    &lt;
                </button>
                <span
                    className={`splitter${isScrRefChanged ? ' changed' : ''}`}
                />
                <button
                    type="button"
                    className="change-btn"
                    onClick={() => handleSubmit(offsetVerse(scrRef, 1))}
                    disabled={isScrRefChanged}
                >
                    &gt;
                </button>
            </span>
            <input
                type="text"
                className={`${isScrRefChanged ? 'changed' : ''}`}
                value={currentRefText}
                onChange={handleChange}
            />
            <button
                type="submit"
                className="enter-button"
                disabled={!isScrRefChanged}
            >
                Go!
            </button>
        </form>
    );
};
