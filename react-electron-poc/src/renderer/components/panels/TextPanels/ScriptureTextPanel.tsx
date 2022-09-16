import {
    getScriptureStyle,
    getScriptureHtml,
} from '@services/ScriptureService';
import {
    ResourceInfo,
    ScriptureChapter,
    ScriptureReference,
} from '@shared/data/ScriptureTypes';
import { useEffect, useState } from 'react';
import useStyle from 'renderer/hooks/useStyle';
import './TextPanel.css';

export interface ScriptureTextPanelProps
    extends ScriptureReference,
        ResourceInfo {}

export const ScriptureTextPanel = ({
    shortName,
    editable,
    book,
    chapter,
    verse,
}: ScriptureTextPanelProps) => {
    const [scrChapters, setScrChapters] = useState<
        ScriptureChapter[] | undefined
    >(undefined);

    const [scrStyle, setScrStyle] = useState<string>('');
    useEffect(() => {
        // TODO: Fix RTL scripture style sheets
        getScriptureStyle(shortName)
            .then((s) => {
                if (shortName !== 'OHEB' && shortName !== 'zzz1')
                    setScrStyle(s);
                return undefined;
            })
            .catch((r) => console.log(r));
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
                if (scriptureRefIsCurrent) setScrChapters(scriptureHtml);
            })();
        }

        return () => {
            scriptureRefIsCurrent = false;
            setScrChapters(undefined);
        };
    }, [shortName, book, chapter]);

    const display = scrChapters || [
        { chapter: -1, contents: `Loading ${shortName}...` },
    ];

    return (
        <div className="text-panel">
            {display.map((scrChapter) => (
                <div
                    // TODO: Add chapter number to the index passed in
                    key={scrChapter.chapter}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                        __html: scrChapter.contents as string,
                    }}
                />
            ))}
        </div>
    );
};
