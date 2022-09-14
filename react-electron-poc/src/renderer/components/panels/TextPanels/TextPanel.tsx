import { useEffect, useState } from 'react';
import './TextPanel.css';

export interface TextPanelProps {
    placeholderText?: string;
    textPromise?: Promise<string>;
}

export const TextPanel = ({
    placeholderText = 'Hi! This is a text panel!',
    textPromise = undefined,
}: TextPanelProps) => {
    const [text, setText] = useState<string | undefined>(undefined);

    useEffect(() => {
        let textPromiseIsCurrent = false;
        if (textPromise) {
            textPromiseIsCurrent = true;
            (async () => {
                const displayText = await textPromise;
                if (textPromiseIsCurrent) setText(displayText);
            })();
        }

        return () => {
            textPromiseIsCurrent = false;
            setText(undefined);
        };
    }, [textPromise]);

    const display = text || placeholderText;

    return <div className="text-panel">{display}</div>;
};
