import * as WebSocketService from '@services/WebSocketService';

/**
 * Handles communication with the Paratext backend in a unified format
 */

/** Whether this service has finished setting up */
let initialized = false;

export type CommandResponse<T> = WebSocketService.Response<T>;

/**
 * Send a command to the backend
 */
export const sendCommand = async <T extends Array<unknown>, K>(
    type: string,
    ...args: T
): Promise<CommandResponse<K>> => {
    return WebSocketService.request(`command:${type}`, args);
};

// TODO: memoize this so it only runs once and always returns the same promise
/** Sets up the WebSocketService - does not connect the websocket. Automatically run when connect has been run */
export const initialize = async (): Promise<void> => {
    if (initialized) return;

    // TODO: Might be best to make a singleton or something
    await WebSocketService.connect();

    const start = performance.now();
    sendCommand('echo', 'Hi server!')
        .then((response) =>
            console.log(
                'Response!!!',
                response,
                'Response time:',
                performance.now() - start,
            ),
        )
        .catch((e) => console.error(e));

    // Set up subscriptions that the service needs to work

    initialized = true;
};
