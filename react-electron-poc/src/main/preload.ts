import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
    ResourceInfo,
    ScriptureChapterContent,
    ScriptureChapterString,
} from '@shared/data/ScriptureTypes';

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

contextBridge.exposeInMainWorld('electronAPI', {
    scripture: {
        getScriptureBook: (
            shortName: string,
            bookNum: number,
        ): Promise<ScriptureChapterContent[]> =>
            ipcRenderer.invoke(
                'ipc-scripture:getScriptureBook',
                shortName,
                bookNum,
            ),
        getScriptureChapter: (
            shortName: string,
            bookNum: number,
            chapter: number,
        ): Promise<ScriptureChapterContent> =>
            ipcRenderer.invoke(
                'ipc-scripture:getScriptureChapter',
                shortName,
                bookNum,
                chapter,
            ),
        writeScriptureBook: (
            shortName: string,
            bookNum: number,
            contents: ScriptureChapterContent[],
        ): Promise<void> =>
            ipcRenderer.invoke(
                'ipc-scripture:writeScriptureBook',
                shortName,
                bookNum,
                contents,
            ),
        writeScriptureChapter: (
            shortName: string,
            bookNum: number,
            chapter: number,
            contents: ScriptureChapterContent,
        ): Promise<void> =>
            ipcRenderer.invoke(
                'ipc-scripture:writeScriptureChapter',
                shortName,
                bookNum,
                chapter,
                contents,
            ),
        getScriptureBookRaw: (
            shortName: string,
            bookNum: number,
        ): Promise<ScriptureChapterString[]> =>
            ipcRenderer.invoke(
                'ipc-scripture:getScriptureBookRaw',
                shortName,
                bookNum,
            ),
        getScriptureChapterRaw: (
            shortName: string,
            bookNum: number,
            chapter: number,
        ): Promise<ScriptureChapterString> =>
            ipcRenderer.invoke(
                'ipc-scripture:getScriptureChapterRaw',
                shortName,
                bookNum,
                chapter,
            ),
        getScriptureBookHtml: (
            shortName: string,
            bookNum: number,
        ): Promise<ScriptureChapterString[]> =>
            ipcRenderer.invoke(
                'ipc-scripture:getScriptureBookHtml',
                shortName,
                bookNum,
            ),
        getScriptureChapterHtml: (
            shortName: string,
            bookNum: number,
            chapter: number,
        ): Promise<ScriptureChapterString> =>
            ipcRenderer.invoke(
                'ipc-scripture:getScriptureChapterHtml',
                shortName,
                bookNum,
                chapter,
            ),
        getScriptureStyle: (shortName: string): Promise<string> =>
            ipcRenderer.invoke('ipc-scripture:getScriptureStyle', shortName),
        getResourceInfo: (shortName: string): Promise<ResourceInfo> =>
            ipcRenderer.invoke('ipc-scripture:getResourceInfo', shortName),
        getAllResourceInfo: (): Promise<ResourceInfo[]> =>
            ipcRenderer.invoke('ipc-scripture:getAllResourceInfo'),
        setActiveResource: (shortName: string): Promise<void> =>
            ipcRenderer.invoke('ipc-scripture:setActiveResource', shortName),
    },
});

// TODO: Remove?
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
