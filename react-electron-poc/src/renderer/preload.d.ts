import { IpcChannel } from 'main/preload';
import { ResourceInfo, ScriptureContent } from '@shared/data/ScriptureTypes';

declare global {
    interface Window {
        electronAPI: {
            scripture: {
                getScriptureBook(
                    shortName: string,
                    bookNum: number,
                ): Promise<ScriptureContent[]>;
                getScriptureChapter(
                    shortName: string,
                    bookNum: number,
                    chapter: number,
                ): Promise<ScriptureContent>;
                getScriptureBookRaw(
                    shortName: string,
                    bookNum: number,
                ): Promise<string[]>;
                getScriptureChapterRaw(
                    shortName: string,
                    bookNum: number,
                    chapter: number,
                ): Promise<string>;
                getScriptureBookHtml(
                    shortName: string,
                    bookNum: number,
                ): Promise<string[]>;
                getScriptureChapterHtml(
                    shortName: string,
                    bookNum: number,
                    chapter: number,
                ): Promise<string>;
                getScriptureStyle(shortName: string): Promise<string>;
                getResourceInfo(shortName: string): Promise<ResourceInfo>;
                getAllResourceInfo(): Promise<ResourceInfo[]>;
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
