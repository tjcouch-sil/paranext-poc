import * as WebSocketService from '@services/WebSocketService';
import { CommandResponse } from '@util/PapiUtil';
import memoizeOne from 'memoize-one';

/**
 * Handles communication with the Paratext backend in a unified format
 */

/** Whether this service has finished setting up */
let initialized = false;

/**
 * Send a command to the backend.
 * WARNING: THIS DOES NOT CHECK FOR INITIALIZATION. DO NOT USE. Use sendCommand
 */
const sendCommandUnsafe = async <T extends Array<unknown>, K>(
    type: string,
    ...args: T
): Promise<CommandResponse<K>> => {
    return WebSocketService.request(`command:${type}`, args);
};

/**
 * Send an epm request to the backend.
 * WARNING: THIS DOES NOT CHECK FOR INITIALIZATION. DO NOT USE. Use sendEpmRequest
 */
const sendEpmRequestUnsafe = async <T extends Array<unknown>, K>(
    type: string,
    ...args: T
): Promise<CommandResponse<K>> => {
    return WebSocketService.request(`epm:${type}`, args);
};

/**
 * Unregister commands on the papi that were being handled here
 * WARNING: THIS DOES NOT CHECK FOR INITIALIZATION. DO NOT USE. Use unregisterCommands
 * @param commands list of command names to unregister from handling here
 * @returns response whose contents are a list of commands that were not successfully unregistered if error
 */
const unregisterCommandsUnsafe = async (
    ...commands: string[]
): Promise<CommandResponse<string[]>> => {
    return sendEpmRequestUnsafe('unregisterCommands', ...commands);
};

/**
 * Register commands on the papi to be handled here
 * WARNING: THIS DOES NOT CHECK FOR INITIALIZATION. DO NOT USE. Use registerCommands
 * @param commands list of command names to register for handling here
 * @returns response whose contents are a list of commands that were not successfully registered if error
 */
const registerCommandsUnsafe = async (
    ...commands: string[]
): Promise<CommandResponse<string[]>> => {
    return sendEpmRequestUnsafe('registerCommands', ...commands);
};

// TODO: memoize this so it only runs once and always returns the same promise
/** Sets up the WebSocketService - does not connect the websocket. Automatically run when connect has been run */
export const initialize = memoizeOne(async (): Promise<void> => {
    if (initialized) return;

    // TODO: Might be best to make a singleton or something
    await WebSocketService.connect();

    // Set up subscriptions that the service needs to work
    console.log(await registerCommandsUnsafe('this'));

    initialized = true;

    const start = performance.now();
    sendCommandUnsafe('echo', 'Hi server!')
        .then((response) =>
            console.log(
                'Response!!!',
                response,
                'Response time:',
                performance.now() - start,
            ),
        )
        .catch((e) => console.error(e));
});

/**
 * Send a command to the backend.
 */
export const sendCommand = async <T extends Array<unknown>, K>(
    type: string,
    ...args: T
): Promise<CommandResponse<K>> => {
    await initialize();
    return sendCommandUnsafe(type, ...args);
};

/**
 * Send an epm request to the backend.
 * Internal; do not export for use on papi
 */
const sendEpmRequest = async <T extends Array<unknown>, K>(
    type: string,
    ...args: T
): Promise<CommandResponse<K>> => {
    await initialize();
    return sendEpmRequestUnsafe(type, ...args);
};

/**
 * Register commands on the papi to be handled here
 * @param commands list of command names to register for handling here
 * @returns response whose contents are a list of commands that were not successfully registered if error
 */
export const registerCommands = async (...commands: string[]) => {
    await initialize();
    return registerCommandsUnsafe(...commands);
};

/**
 * Unregister commands on the papi that were being handled here
 * @param commands list of command names to unregister from handling here
 * @returns response whose contents are a list of commands that were not successfully unregistered if error
 */
export const unregisterCommands = async (...commands: string[]) => {
    await initialize();
    return unregisterCommandsUnsafe(...commands);
};
