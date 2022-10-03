import { getScriptureStyle } from '@services/ScriptureService';
import {
    ResourceInfo,
    ScriptureChapter,
    ScriptureReference,
} from '@shared/data/ScriptureTypes';
import { getTextFromScrRef } from '@util/ScriptureUtil';
import { isValidValue } from '@util/Util';
import {
    ComponentType,
    memo,
    PropsWithChildren,
    useCallback,
    useState,
} from 'react';
import usePromise from 'renderer/hooks/usePromise';
import useStyle from 'renderer/hooks/useStyle';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ScriptureTextPanelHOCProps
    extends ScriptureReference,
        ResourceInfo,
        PropsWithChildren {
    scrChapters: ScriptureChapter[];
    updateScrRef: (newScrRef: ScriptureReference) => void;
    browseBook?: boolean;
}

export function ScriptureTextPanelHOC<T extends ScriptureTextPanelHOCProps>(
    WrappedComponent: ComponentType<T>,
    getScrChapter: (
        shortName: string,
        bookNum: number,
        chapter?: number,
    ) => Promise<ScriptureChapter[]>,
) {
    return memo(function ScriptureTextPanel(props: T) {
        const { shortName, book, chapter, children, browseBook } = props;

        // Pull in the project's stylesheet
        useStyle(
            useCallback(async () => {
                // TODO: Fix RTL scripture style sheets
                if (!shortName) return undefined;
                const style = await getScriptureStyle(shortName);
                return shortName !== 'OHEB' && shortName !== 'zzz1'
                    ? style
                    : undefined;
            }, [shortName]),
        );

        const getMyScrBook = useCallback(async () => {
            if (!shortName || !isValidValue(book)) return null;
            return getScrChapter(shortName, book, -1);
        }, [shortName, book]);
        const getMyScrChapter = useCallback(async () => {
            if (!shortName || !isValidValue(book) || !isValidValue(chapter))
                return null;
            return getScrChapter(shortName, book, chapter);
        }, [shortName, book, chapter]);

        // Get the project's contents
        const [scrChapters] = usePromise<ScriptureChapter[]>(
            browseBook ? getMyScrBook : getMyScrChapter,
            useState<ScriptureChapter[]>([
                {
                    chapter: -1,
                    contents: `Loading ${shortName} ${getTextFromScrRef({
                        book,
                        chapter,
                        verse: -1,
                    })}...`,
                },
            ])[0],
        );

        return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <WrappedComponent {...props} scrChapters={scrChapters}>
                {children}
            </WrappedComponent>
        );
    });
}
