import {
    getScriptureStyle,
    setActiveResource,
} from '@services/ScriptureService';
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

/** Functions that are props for ScriptureTextPanels */
export interface ScriptureTextPanelFunctions {
    updateScrRef: (newScrRef: ScriptureReference) => void;
}

/** Props for ScriptureTextPanels */
export interface ScriptureTextPanelHOCProps
    extends ScriptureReference,
        ScriptureTextPanelFunctions,
        ResourceInfo,
        PropsWithChildren {
    scrChapters: ScriptureChapter[];
    useVirtualization?: boolean;
    browseBook?: boolean;
    onFocus: () => Promise<void>;
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
                const style = await getScriptureStyle(shortName, book);
                return shortName !== 'OHEB' && shortName !== 'zzz1'
                    ? style
                    : undefined;
            }, [shortName, book]),
        );

        /** Get the whole contents of the current book */
        const getMyScrBook = useCallback(async () => {
            if (!shortName || !isValidValue(book)) return null;
            return getScrChapter(shortName, book, -1);
        }, [shortName, book]);
        /** Get the contents of the current chapter */
        const getMyScrChapter = useCallback(async () => {
            if (!shortName || !isValidValue(book) || !isValidValue(chapter))
                return null;
            return getScrChapter(shortName, book, chapter);
        }, [shortName, book, chapter]);

        // Get the project's contents
        const [scrChapters] = usePromise<ScriptureChapter[]>(
            // Depending on if we are browsing by book or chapter, use the appropriate function. This way, we only refresh scrChapters when needed (when browsing by book, we don't need to refresh when changing chapter)
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

        /** Function to call when setting focus on this panel. Tells the backend we set the active project */
        const onFocus = useCallback(async () => {
            return setActiveResource(shortName);
        }, [shortName]);

        return (
            <WrappedComponent
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
                scrChapters={scrChapters}
                onFocus={onFocus}
            >
                {children}
            </WrappedComponent>
        );
    });
}
