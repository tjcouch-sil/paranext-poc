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
import {
    app,
    BrowserWindow,
    shell,
    ipcMain as ipcMainReal,
    IpcMainEvent,
    IpcMainInvokeEvent,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
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

async function handleGetScripture(
    _event: IpcMainInvokeEvent,
    shortName: string,
    bookNum: number,
    chapter = -1,
): Promise<string> {
    const start = performance.now();
    const fileReadPromise = new Promise<string>((resolve, reject) => {
        fs.readFile(
            getAssetPath(
                `testScripture/${shortName}/${bookNum}-${chapter}.usx`,
            ),
            'utf8',
            (err, data) => {
                if (err) reject(err.message);
                else resolve(data);
                console.log(`USX took ${performance.now() - start} ms`);
            },
        );
    });
    return fileReadPromise;
}

/**
 * Get the Scripture for a certain project at a certain chapter. These test files are from breakpointing at ViewUsfmXhtmlConverter.cs at the return on UsfmToXhtml.
 * Waits for 50 milliseconds before doing anything to simulate getting from file, converting, etc
 * @param _event
 * @param shortName
 * @param bookNum
 * @param chapter
 * @returns Final HTML that Paratext renders in its WebView
 */
async function handleGetScriptureHtml(
    _event: IpcMainInvokeEvent,
    shortName: string,
    bookNum: number,
    chapter = -1,
): Promise<string> {
    const start = performance.now();
    const fileReadPromise = new Promise<string>((resolve, reject) => {
        setTimeout(() => {
            fs.readFile(
                getAssetPath(
                    `testScripture/${shortName}/${bookNum}-${chapter}.html`,
                ),
                'utf8',
                (err, data) => {
                    if (err) reject(err.message);
                    else resolve(data);
                    console.log(
                        `Loading ${shortName}/${bookNum}-${chapter}.html took ${
                            performance.now() - start
                        } ms`,
                    );
                },
            );
        }, 50);
    });
    return fileReadPromise;
}

app.enableSandbox();
app.whenReady()
    .then(() => {
        // TODO: consider making an object for these or an interface or something
        ipcMainReal.handle('ipc-scripture:getScripture', handleGetScripture);
        ipcMainReal.handle(
            'ipc-scripture:getScriptureHtml',
            handleGetScriptureHtml,
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
