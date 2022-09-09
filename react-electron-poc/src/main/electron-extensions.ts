import { ipcMain as ipcMainOriginal, IpcMainRestricted } from 'electron';
import { IpcChannel } from './preload';

declare module 'electron' {
    interface IpcMainRestricted extends IpcMain {
        on(
            channel: IpcChannel,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            listener: (event: IpcMainEventRestricted, ...args: any[]) => void,
        ): this;
    }

    interface IpcMainEventRestricted extends IpcMainEvent {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reply(channel: IpcChannel, ...args: any[]): void;
    }
}
// eslint-disable-next-line import/prefer-default-export
export const ipcMain = ipcMainOriginal as IpcMainRestricted;
