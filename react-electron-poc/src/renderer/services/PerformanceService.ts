let electronStartTime = -1;
/** Get the start time for the electron main process */
export const getElectronStartTime = async (): Promise<number> => {
    // We already got the start time. Return the cached start time
    if (electronStartTime >= 0) return electronStartTime;

    // Get electron's Start Time
    try {
        const startTime = await window.electronAPI.electron.getStartTime();
        electronStartTime = startTime;
        return electronStartTime;
    } catch (e) {
        console.log(e);
        return electronStartTime;
    }
};

let webserverStartTime = -1;
/** Get the start time for the electron main process */
export const getWebserverStartTime = async (): Promise<number> => {
    // We already got the start time. Return the cached start time
    if (webserverStartTime >= 0) return webserverStartTime;

    // Get electron's Start Time
    try {
        const startTime = await window.electronAPI.electron.getStartTime();
        webserverStartTime = startTime;
        return webserverStartTime;
    } catch (e) {
        console.log(e);
        return webserverStartTime;
    }
};
