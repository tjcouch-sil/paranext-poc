import '@assets/testScripture/zzz6.css';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import { useCallback, useEffect, useRef, useState } from 'react';
import './TextPanel.css';

export interface EditableHtmlTextPanelProps {
    placeholderText?: string;
    textPromise?: Promise<string>;
}

export const EditableHtmlTextPanel = ({
    placeholderText = 'Hi! This is an editable HTML panel! Loading; please wait.',
    textPromise = undefined,
}: EditableHtmlTextPanelProps) => {
    const text = useRef<string | undefined>(undefined);
    const [, setForceRefresh] = useState<number>(0);
    const forceRefresh = useCallback(
        () => setForceRefresh((value) => value + 1),
        [setForceRefresh],
    );

    useEffect(() => {
        let textPromiseIsCurrent = false;
        if (textPromise) {
            textPromiseIsCurrent = true;
            (async () => {
                const displayText = await textPromise;
                if (textPromiseIsCurrent) {
                    text.current = displayText;
                    forceRefresh();
                }
            })();
        }

        return () => {
            textPromiseIsCurrent = false;
            text.current = undefined;
            forceRefresh();
        };
    }, [textPromise, forceRefresh]);

    const handleChange = (evt: ContentEditableEvent) => {
        text.current = evt.target.value;
    };

    return text.current === undefined ? (
        <div className="text-panel">{placeholderText}</div>
    ) : (
        <ContentEditable
            className="text-panel"
            html={text.current}
            onChange={handleChange}
        />
    );
};
