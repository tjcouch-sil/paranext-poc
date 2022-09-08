import { IpcChannel } from 'main/preload';

declare global {
    interface Window {
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
