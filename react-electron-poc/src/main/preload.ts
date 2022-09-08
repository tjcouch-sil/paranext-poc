import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * Whitelisted channel names through which the main and renderer processes can communicate.
 * Please prefix all with "ipc-<namespace>:"" for ease of searching between main and renderer processes.
 */
const ipcChannels = ['ipc-test:example', 'ipc-test:things'] as const;
/**
 * Whitelisted channel names through which the main and renderer processes can communicate.
 * All are prefixed with "ipc-<namespace>:" for ease of searching between main and renderer processes.
 */
export type IpcChannel = typeof ipcChannels[number];

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send(channel: IpcChannel, args: unknown[]) {
            if (ipcChannels.includes(channel)) ipcRenderer.send(channel, args);
            // TODO: Should these throw exceptions instead of just log to console? Probably
            else
                console.error(
                    `ipcRenderer.send received invalid channel ${channel}! args:`,
                    args,
                );
        },
        on(channel: IpcChannel, func: (...args: unknown[]) => void) {
            if (!ipcChannels.includes(channel)) {
                console.error(
                    `ipcRenderer.on received invalid channel ${channel}! func:`,
                    func,
                );
                return undefined;
            }

            const subscription = (
                _event: IpcRendererEvent,
                ...args: unknown[]
            ) => func(...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },
        once(channel: IpcChannel, func: (...args: unknown[]) => void) {
            if (ipcChannels.includes(channel))
                ipcRenderer.once(channel, (_event, ...args) => func(...args));
            else
                console.error(
                    `ipcRenderer.once received invalid channel ${channel}! func:`,
                    func,
                );
        },
    },
});
