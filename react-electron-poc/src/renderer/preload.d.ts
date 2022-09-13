import { IpcChannel } from 'main/preload';

declare global {
    interface Window {
        electronAPI: {
            scripture: {
                getScripture(
                    shortName: string,
                    bookNum: number,
                    chapter?: number,
                ): Promise<string>;
                getScriptureHtml(
                    shortName: string,
                    bookNum: number,
                    chapter?: number,
                ): Promise<string>;
                getScriptureStyle(shortName: string): Promise<string>;
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
