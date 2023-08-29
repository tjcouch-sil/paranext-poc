import { Proskomma } from 'proskomma';

declare module 'proskomma-react-hooks' {
    type UseProskommaProps = {
        /** console log details */
        verbose: boolean;
        /** Document Selectors uW: {org, lang, abbr} vs {lang, abbr} and other differences.  */
        unfoldingWord?: boolean;
    };
    type UseProskomma = {
        proskomma: Proskomma;
        stateId?: string;
        newStateId: () => void;
        errors?: Error[];
    };

    export function useProskomma({
        verbose,
        unfoldingWord = true,
    }: UseProskommaProps): UseProskomma;

    type UseImportProps = {
        /** Proskomma instance to query */
        proskomma?: Proskomma;
        /** Function to trigger a new stateId onImport */
        newStateId: () => void;
        /** Callback when document is imported, props={org, lang, abbr, bookCode} */
        onImport?: (props: string) => void;
        /** Array of documents to be imported */
        documents: {
            /** { org, lang, abbr } */
            selectors: {
                /** Selector: Organization or Owner for context */
                org: string;
                /** Selector: Language abbreviation */
                lang: string;
                /** Selector: Abbreviation for Bible Translation (ULT) */
                abbr: string;
            };
            /**  */
            bookCode?: string;
            /** data string for the book */
            data?: string;
            /** URL to download the book */
            url?: string;
            /** type of file, ie. usfm, usx */
            filetype?: string;
        }[];
        /** console success details */
        verbose?: boolean;
    };
    type UseImport = {
        importing: () => void;
        done: () => void;
        errors?: Error[];
    };

    export function useImport({
        proskomma,
        newStateId,
        onImport,
        documents,
        verbose,
    }: UseImportProps): UseImport;
}
