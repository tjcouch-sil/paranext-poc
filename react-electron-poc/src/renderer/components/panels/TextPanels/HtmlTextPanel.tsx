import '@assets/testScripture/zzz6.css';
import { useEffect, useState } from 'react';
import './TextPanel.css';

export interface HtmlTextPanelProps {
    placeholderText?: string;
    textPromise?: Promise<string>;
}

export const HtmlTextPanel = ({
    placeholderText = 'Hi! This is an HTML panel!',
    textPromise = undefined,
}: HtmlTextPanelProps) => {
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

    return (
        <div
            className="text-panel"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: display }}
        />
    );
};
