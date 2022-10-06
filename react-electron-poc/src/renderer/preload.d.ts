import { IpcChannel } from 'main/preload';
import {
    ResourceInfo,
    ScriptureChapterContent,
    ScriptureChapterString,
} from '@shared/data/ScriptureTypes';

declare global {
    interface Window {
        electronAPI: {
            scripture: {
                getScriptureBook(
                    shortName: string,
                    bookNum: number,
                ): Promise<ScriptureChapterContent[]>;
                getScriptureChapter(
                    shortName: string,
                    bookNum: number,
                    chapter: number,
                ): Promise<ScriptureChapterContent>;
                getScriptureBookRaw(
                    shortName: string,
                    bookNum: number,
                ): Promise<ScriptureChapterString[]>;
                getScriptureChapterRaw(
                    shortName: string,
                    bookNum: number,
                    chapter: number,
                ): Promise<ScriptureChapterString>;
                getScriptureBookHtml(
                    shortName: string,
                    bookNum: number,
                ): Promise<ScriptureChapterString[]>;
                getScriptureChapterHtml(
                    shortName: string,
                    bookNum: number,
                    chapter: number,
                ): Promise<ScriptureChapterString>;
                getScriptureStyle(shortName: string): Promise<string>;
                getResourceInfo(shortName: string): Promise<ResourceInfo>;
                getAllResourceInfo(): Promise<ResourceInfo[]>;
                setActiveResource(shortName: string): Promise<void>;
            };
        };
        electron: {
            ipcRenderer: {
                send(channel: IpcChannel, args: unknown[]): void;
                on(
                    channel: IpcChannel,
                    func: (...args: unknown[]) => void,
                ): (() => void) | undefined;
                once(
                    channel: IpcChannel,
                    func: (...args: unknown[]) => void,
                ): void;
            };
        };
    }
}

export {};
