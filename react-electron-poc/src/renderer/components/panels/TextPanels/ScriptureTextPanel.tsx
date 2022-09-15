import {
    getScriptureStyle,
    getScriptureHtml,
} from '@services/ScriptureService';
import { useEffect, useState } from 'react';
import useStyle from 'renderer/hooks/useStyle';
import './TextPanel.css';

export interface ScriptureTextPanelProps {
    shortName: string;
    book: number;
    chapter: number;
    verse: number;
}

export const ScriptureTextPanel = ({
    shortName,
    book,
    chapter,
    verse,
}: ScriptureTextPanelProps) => {
    const [scrHtml, setScrHtml] = useState<string | undefined>(undefined);

    const [scrStyle, setScrStyle] = useState<string>('');
    useEffect(() => {
        // eslint-disable-next-line promise/catch-or-return
        getScriptureStyle(shortName).then((s) => setScrStyle(s));
    }, [shortName]);

    useStyle(scrStyle);

    useEffect(() => {
        let scriptureRefIsCurrent = false;
        if (shortName && book) {
            scriptureRefIsCurrent = true;
            (async () => {
                const scriptureHtml = await getScriptureHtml(
                    shortName,
                    book,
                    chapter,
                );
                if (scriptureRefIsCurrent) setScrHtml(scriptureHtml);
            })();
        }

        return () => {
            scriptureRefIsCurrent = false;
            setScrHtml(undefined);
        };
    }, [shortName, book, chapter]);

    const display = scrHtml || `Loading${shortName ? ` ${shortName}` : ''}...`;

    return (
        <div
            className="text-panel"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: display }}
        />
    );
};
