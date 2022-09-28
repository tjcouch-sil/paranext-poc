import { getScriptureStyle } from '@services/ScriptureService';
import {
    ResourceInfo,
    ScriptureChapter,
    ScriptureReference,
} from '@shared/data/ScriptureTypes';
import { getTextFromScrRef } from '@util/ScriptureUtil';
import { isValidValue } from '@util/Util';
import { ComponentType, PropsWithChildren, useCallback, useState } from 'react';
import usePromise from 'renderer/hooks/usePromise';
import useStyle from 'renderer/hooks/useStyle';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ScriptureTextPanelHOCProps
    extends ScriptureReference,
        ResourceInfo,
        PropsWithChildren {
    scrChapters: ScriptureChapter[];
}

export function ScriptureTextPanelHOC<T extends ScriptureTextPanelHOCProps>(
    WrappedComponent: ComponentType<T>,
    getScrChapter: (
        shortName: string,
        bookNum: number,
        chapter?: number,
    ) => Promise<ScriptureChapter[]>,
) {
    return function ScriptureTextPanel(props: T) {
        const { shortName, book, chapter, children } = props;

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

        // Get the project's contents
        const [scrChapters] = usePromise<ScriptureChapter[]>(
            useCallback(async () => {
                if (!shortName || !isValidValue(book) || !isValidValue(chapter))
                    return null;
                return getScrChapter(shortName, book, -1);
            }, [shortName, book, chapter]),
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
    };
}
