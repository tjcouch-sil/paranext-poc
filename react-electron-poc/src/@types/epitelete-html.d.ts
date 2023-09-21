import { Proskomma } from 'proskomma';

declare module 'epitelete-html' {
    export interface BookData {
        // It's unknown what should be in this type.
        id: unknown;
    }

    export interface HistoryItem {
        stack: { [cursor: number]: BookData };
        cursor: number;
        undoInx?: number;
        lastSaveUndoInx?: number;
    }

    export interface PipelineData {
        unalignedWords: object;
    }

    export interface Options {
        readPipeline?: string;
        writePipeline?: string;
        cloning?: boolean;
    }

    export interface HtmlPerf {
        docSetId: number;
        mainSequenceId: string;
        schema: unknown;
        metadata: unknown;
        sequencesHtml: unknown;
    }

    type PerfSchema = {
        structure: 'flat' | 'nested';
        structure_version: string;
        constraints: unknown[];
    };

    type PerfMetadata = {
        translation?: {
            tags?: unknown[];
            properties?: { [key: string]: string };
            selectors?: { [selector: string]: string };
        };
        document?: {
            properties?: { [key: string]: string };
            chapters?: string;
        };
    };

    type BlockOrGraftPerf = unknown;

    type PerfSequence = {
        type: string;
        preview_text?: string;
        blocks?: BlockOrGraftPerf[];
    };

    export interface PerfDocument {
        schema: PerfSchema;
        metadata: PerfMetadata;
        sequences?: { [sequence_id: string]: PerfSequence };
        sequence?: PerfSequence;
        mainSequenceId?: string;
    }

    export default class EpiteleteHtml {
        history: { [bookCode: string]: HistoryItem };
        constructor({
            proskomma = null,
            docSetId,
            htmlMap,
            options = {},
        }: {
            proskomma?: Proskomma | null;
            docSetId: string;
            htmlMap?: object;
            options?: object;
        });

        readHtml(bookCode: string, options?: Options): Promise<HtmlPerf>;
        undoHtml(bookCode: string, options?: Options): Promise<HtmlPerf>;
        redoHtml(bookCode: string, options?: Options): Promise<HtmlPerf>;
        writeHtml(
            bookCode: string,
            sequenceId: string,
            perfHtml: HtmlPerf,
            options?: Options,
        ): Promise<HtmlPerf>;

        getPipelineData(bookCode: string): PipelineData;
        canUndo(bookCode: string): boolean;
        canRedo(bookCode: string): boolean;
        readUsfm(bookCode: string, options?: Options): Promise<string>;

        readPerf(bookCode: string, options?: Options): Promise<PerfDocument>;
        sideloadPerf(
            bookCode: string,
            perfDocument: PerfDocument,
            options?: Options,
        ): Promise<PerfDocument>;
    }
}
