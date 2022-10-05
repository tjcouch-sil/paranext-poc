/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, shell, IpcMainInvokeEvent } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { ResourceInfo, ScriptureChapter } from '@shared/data/ScriptureTypes';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { ipcMain } from './electron-extensions';

class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify();
    }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

const isDebug =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
    require('electron-debug')();
    console.log('Debug start!');
}

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload,
        )
        .catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async () => {
    if (isDebug) {
        await installExtensions();
    }

    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
        autoHideMenuBar: true,
    });

    mainWindow.loadURL(resolveHtmlPath('index.html'));

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.show();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/** Runs the method after the set delay time */
function delayPromise<T>(
    callback: (
        resolve: (value: T | PromiseLike<T>) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reject: (reason?: any) => void,
    ) => void,
    ms?: number | undefined,
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        setTimeout(() => {
            callback(resolve, reject);
        }, ms);
    });
}

/**
 * Gets the text of a file asynchronously. Delays 1ms or more if desired
 * @param filePath Path to file from assets
 * @param delay delay before resolving promise in ms
 * @returns promise that resolves to the file text after delay ms
 */
async function getFileText(filePath: string, delay = 0): Promise<string> {
    return delayPromise<string>((resolve, reject) => {
        const start = performance.now();
        fs.readFile(getAssetPath(filePath), 'utf8', (err, data) => {
            if (err) reject(err.message);
            else resolve(data);
            console.log(
                `Loading ${filePath} took ${performance.now() - start} ms`,
            );
        });
    }, delay);
}

async function getFilesText(filePaths: string[], delay = 0): Promise<string[]> {
    return Promise.all(
        filePaths.map((filePath) => getFileText(filePath, delay)),
    );
}

/** Simulating how long it may take Paratext to load and serve the Scriptures */
const getScriptureDelay = 75;
/** Simulating how long it may take Paratext to serve the resource info */
const getResourceInfoDelay = 20;

/** Regex for test Scripture file name bookNum-chapterNum.fileExtension */
const regexpScrFileName = /(\d+)-(\d+)\.(.+)/;

/**
 * Get the Scripture for a certain project for a whole book.
 * The json files are Slate JSON files
 * The USX test files are from breakpointing at ViewUsfmXhtmlConverter.cs at the return on UsfmToXhtml.
 * The HTML test files are from breakpointing at ViewUsfmXhtmlConverter.cs at the return on UsfmToXhtml.
 * Should return data for ingesting and displaying.
 * Waits for 50 milliseconds before doing anything to simulate getting from file, converting, etc
 * @param _event
 * @param shortName
 * @param bookNum
 * @param fileExtension
 * @returns Data for ingesting and displaying
 */
async function handleGetScriptureBook(
    _event: IpcMainInvokeEvent,
    fileExtension: string,
    shortName: string,
    bookNum: number,
): Promise<ScriptureChapter[]> {
    return delayPromise<ScriptureChapter[]>((resolve, reject) => {
        fs.readdir(
            getAssetPath(`testScripture/${shortName}`),
            {
                withFileTypes: true,
            },
            async (err, dirents) => {
                if (err) reject(`No path data for ${shortName} ${bookNum}`);
                else {
                    try {
                        // Get all Scripture files
                        const scrFilePaths = dirents
                            .filter((dirent) => {
                                if (dirent.isDirectory()) return false;

                                const scrFileNameMatch =
                                    dirent.name.match(regexpScrFileName);
                                return (
                                    scrFileNameMatch &&
                                    scrFileNameMatch.length >= 4 &&
                                    scrFileNameMatch[3] === fileExtension
                                );
                            })
                            .map(
                                (dirent) =>
                                    `testScripture/${shortName}/${dirent.name}`,
                            );
                        const filesContents = await getFilesText(
                            scrFilePaths,
                            0,
                        );
                        resolve(
                            filesContents.map(
                                (fileContents, i) =>
                                    ({
                                        chapter: parseInt(
                                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                            scrFilePaths[i].match(
                                                regexpScrFileName,
                                            )![2],
                                            10,
                                        ),
                                        contents: fileContents,
                                    } as ScriptureChapter),
                            ),
                        );
                    } catch (e) {
                        console.log(e);
                        reject(`No data for ${shortName} ${bookNum}`);
                    }
                }
            },
        );
    }, getScriptureDelay);
}

/**
 * Get the Scripture for a certain project at a certain chapter.
 * The json files are Slate JSON files
 * The USX test files are from breakpointing at ViewUsfmXhtmlConverter.cs at the return on UsfmToXhtml.
 * The HTML test files are from breakpointing at ViewUsfmXhtmlConverter.cs at the return on UsfmToXhtml.
 * Should return data for ingesting and displaying.
 * Waits for 50 milliseconds before doing anything to simulate getting from file, converting, etc
 * @param _event
 * @param shortName
 * @param bookNum
 * @param fileExtension
 * @returns Data for ingesting and displaying
 */
async function handleGetScriptureChapter(
    _event: IpcMainInvokeEvent,
    fileExtension: string,
    shortName: string,
    bookNum: number,
    chapter: number,
): Promise<ScriptureChapter> {
    try {
        return await getFileText(
            `testScripture/${shortName}/${bookNum}-${chapter}.${fileExtension}`,
            getScriptureDelay,
        ).then((fileContents) => ({
            chapter,
            contents: fileContents,
        }));
    } catch (e) {
        console.log(e);
        throw new Error(`No data for ${shortName} ${bookNum} ${chapter}`);
    }
}

/** These test files are from breakpointing at UsfmSinglePaneControl.cs at the line that gets Css in LoadUsfm. */
async function handleGetScriptureStyle(
    _event: IpcMainInvokeEvent,
    shortName: string,
) {
    return getFileText(`testScripture/${shortName}/styles.css`);
}

async function handleGetResourceInfo(
    _event: IpcMainInvokeEvent,
    shortName: string,
): Promise<ResourceInfo> {
    return delayPromise<ResourceInfo>((resolve) => {
        resolve({
            shortName,
            editable: shortName.startsWith('z'),
        });
    }, getResourceInfoDelay);
}

async function handleGetAllResourceInfo(): Promise<ResourceInfo[]> {
    return delayPromise<ResourceInfo[]>((resolve, reject) => {
        const start = performance.now();
        fs.readdir(
            getAssetPath('testScripture'),
            { withFileTypes: true },
            (err, dirents) => {
                if (err) reject(err.message);
                else
                    resolve(
                        dirents
                            .filter((dirent) => dirent.isDirectory())
                            .map((dirent) => ({
                                shortName: dirent.name,
                                editable: dirent.name.startsWith('z'),
                            })),
                    );
                console.log(
                    `Getting all resource info took ${
                        performance.now() - start
                    } ms`,
                );
            },
        );
    }, getResourceInfoDelay);
}

let activeResource: string | undefined;
async function handleSetActiveResource(
    _event: IpcMainInvokeEvent,
    shortName: string,
): Promise<void> {
    activeResource = shortName;
    console.log('Set active resource: ', activeResource);
}

/** Map from ipc channel to handler function */
const ipcHandlers: {
    [ipcHandle: string]: (
        _event: IpcMainInvokeEvent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args: any[]
    ) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Promise<any>;
} = {
    'ipc-scripture:getScriptureBook': (
        event,
        shortName: string,
        bookNum: number,
    ) => handleGetScriptureBook(event, 'json', shortName, bookNum),
    'ipc-scripture:getScriptureChapter': (
        event,
        shortName: string,
        bookNum: number,
        chapter: number,
    ) => handleGetScriptureChapter(event, 'json', shortName, bookNum, chapter),
    'ipc-scripture:getScriptureBookRaw': (
        event,
        shortName: string,
        bookNum: number,
    ) => handleGetScriptureBook(event, 'usx', shortName, bookNum),
    'ipc-scripture:getScriptureChapterRaw': (
        event,
        shortName: string,
        bookNum: number,
        chapter: number,
    ) => handleGetScriptureChapter(event, 'usx', shortName, bookNum, chapter),
    'ipc-scripture:getScriptureBookHtml': (
        event,
        shortName: string,
        bookNum: number,
    ) => handleGetScriptureBook(event, 'html', shortName, bookNum),
    'ipc-scripture:getScriptureChapterHtml': (
        event,
        shortName: string,
        bookNum: number,
        chapter: number,
    ) => handleGetScriptureChapter(event, 'html', shortName, bookNum, chapter),
    'ipc-scripture:getScriptureStyle': handleGetScriptureStyle,
    'ipc-scripture:getResourceInfo': handleGetResourceInfo,
    'ipc-scripture:getAllResourceInfo': handleGetAllResourceInfo,
    'ipc-scripture:setActiveResource': handleSetActiveResource,
};

app.enableSandbox();
app.whenReady()
    .then(() => {
        // Set up ipc handlers
        Object.keys(ipcHandlers).forEach((ipcHandle) =>
            ipcMain.handle(ipcHandle, ipcHandlers[ipcHandle]),
        );

        ipcMain.on('ipc-test:example', async (event, arg) => {
            const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
            console.log(msgTemplate(arg));
            event.reply('ipc-test:example', msgTemplate('pong'));
        });

        createWindow();
        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) createWindow();
        });
    })
    .catch(console.log);
