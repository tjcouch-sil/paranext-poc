/** Whether this service is being set up or has finished setting up (does not return to false when initialized is true) */
let initializing = false;
/** Whether this service is finished setting up */
let initialized = false;

/** Start times of various processes - the main electron process, this renderer process, and the webserver process */
const startTimes = {
    renderer: performance.timeOrigin,
    electron: -1,
    webserver: -1,
};

/** Get the start time for the electron main process */
const getElectronStartTime = async (): Promise<number> => {
    // We already got the start time. Return the cached start time
    if (startTimes.electron >= 0) return startTimes.electron;

    // Get electron's Start Time
    try {
        const startTime = await window.electronAPI.electron.getStartTime();
        startTimes.electron = startTime;
        return startTimes.electron;
    } catch (e) {
        console.log(e);
        return startTimes.electron;
    }
};

/** Get the start time for the webserver */
const getWebserverStartTime = async (): Promise<number> => {
    // We already got the start time. Return the cached start time
    if (startTimes.webserver >= 0) return startTimes.webserver;

    // Get the webserver's Start Time
    try {
        const startTime = await fetch(
            `http://localhost:5122/api/time/GetStartTime`,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            },
        ).then((response) => response.json());
        startTimes.webserver = startTime;
        return startTimes.webserver;
    } catch (e) {
        console.log(e);
        return startTimes.webserver;
    }
};

/** For performance calculations. Set to most recent time the Scripture Reference was changed */
export const startChangeScrRef = { lastChangeTime: performance.now() };

/** performance.now() at the last time the keyDown event was run on a Slate editor */
export const startKeyDown = { lastChangeTime: performance.now() };

/** Options for logging for performance reasons */
export interface PerformanceLogOptions {
    /** Nickname for identifying from where this performance log was called */
    name: string;
    /** What this performance log is measuring */
    operation?: string;
    /** Time in milliseconds from performance.timeOrigin that the operation finished. Usually performance.now() */
    end?: number;
    /** Whether to log the time it took from starting the webserver til now in milliseconds */
    reportStart?: boolean;
    /** Whether to log the time it took from last change Scripcture Reference til now in milliseconds */
    reportChangeScrRef?: boolean;
    /** Whether to log the time it took from last keyDown til now in milliseconds. Warning: Only works in ScriptureChunkEditorSlate right now! Must manually update the keyDown time */
    reportKeyDown?: boolean;
}

const performanceLogQueue: {
    options: PerformanceLogOptions;
    args: unknown[];
}[] = [];

/** The amount of time in milliseconds that it took from starting the webserver to starting the renderer */
let timeStartRendererSinceWebserver = 0;

/**
 * Logs a performance metric on an operation. Takes the following form:
 * Performance<options.name>: options.operation {at end - webserverStartTime ms from ___}(for each of the reports set to true) [adds args at the end]
 * @param options configured settings for the performance log
 * @param args everything to put at the end of the log like normal console.log
 */
export const performanceLog = (
    options: PerformanceLogOptions,
    ...args: unknown[]
) => {
    // Make sure end is defined, but only run performance.now() if it wasn't already run
    const end = options.end || performance.now();
    if (initialized) {
        // If this service is initialized, we can log stuff!
        const log = `Performance<${options.name}>:${
            options.operation ? ` ${options.operation}` : ''
        }${
            options.reportStart
                ? `\n\tat ${
                      end + timeStartRendererSinceWebserver
                  } ms from start webserver\n\tat ${end} ms from start renderer`
                : ''
        }${
            options.reportChangeScrRef
                ? `\n\tat ${
                      end - startChangeScrRef.lastChangeTime
                  } ms from changing scrRef`
                : ''
        }${
            options.reportKeyDown
                ? `\n\tat ${end - startKeyDown.lastChangeTime} ms from keyDown`
                : ''
        }`;
        if (args.length > 0) console.debug(log, ...args);
        else console.debug(log);
    } else {
        // This service isn't finished initializing, so save the performance log for later
        performanceLogQueue.push({ options: { ...options, end }, args });
    }
};

/** Sets up the PerformanceService with start times */
export const initialize = async (): Promise<void> => {
    // We don't need to run this more than once
    if (initializing) return;

    initializing = true;

    await Promise.all([getElectronStartTime(), getWebserverStartTime()])
        .then(() => {
            timeStartRendererSinceWebserver =
                startTimes.renderer - startTimes.webserver;
            initialized = true;

            // Finish initializing
            performanceLog(
                {
                    name: 'PerformanceService',
                },
                `Electron started ${
                    startTimes.electron - startTimes.webserver
                } ms after Webserver. Renderer started ${
                    startTimes.renderer - startTimes.electron
                } ms after Electron and ${timeStartRendererSinceWebserver} ms after Webserver.`,
            );
            performanceLogQueue.forEach((pLog) =>
                performanceLog(pLog.options, ...pLog.args),
            );
            performanceLogQueue.length = 0;
            return undefined;
        })
        .catch((err) => console.log(err));
};
