import * as WebSocketService from '@services/WebSocketService';
import {
    serializeRequestType,
    CATEGORY_COMMAND,
    CATEGORY_EPM,
    CommandHandler,
    CommandRegistration,
    Unsubscriber,
    ComplexResponse,
} from '@util/PapiUtil';
import memoizeOne from 'memoize-one';

/**
 * Handles communication with the Paratext backend in a unified format
 */

/** Whether this service has finished setting up */
let initialized = false;

/** Map of command name to unregister function for that command */
const commandUnsubscribers = new Map<string, Unsubscriber>();

function addThree(a: number, b: number, c: number) {
    return a + b + c;
}
function squareAndConcat(a: number, b: string) {
    return a * a + b.toString();
}
/** Commands that this process will handle. Registered automatically at initialization */
const commandFunctions: { [commandName: string]: CommandHandler } = {
    addThree,
    squareAndConcat,
};

/**
 * Send a command to the backend.
 * WARNING: THIS DOES NOT CHECK FOR INITIALIZATION. DO NOT USE OUTSIDE OF INITIALIZATION. Use sendCommand
 */
const sendCommandUnsafe = async <T extends Array<unknown>, K>(
    type: string,
    ...args: T
): Promise<ComplexResponse<K>> => {
    return WebSocketService.request(
        serializeRequestType(CATEGORY_COMMAND, type),
        args,
    );
};

/**
 * Send an epm request to the backend.
 * WARNING: THIS DOES NOT CHECK FOR INITIALIZATION. DO NOT USE OUTSIDE OF INITIALIZATION. Use sendEpmRequest
 */
const sendEpmRequestUnsafe = async <T extends Array<unknown>, K>(
    type: string,
    ...args: T
): Promise<ComplexResponse<K>> => {
    return WebSocketService.request(
        serializeRequestType(CATEGORY_EPM, type),
        args,
    );
};

/**
 * Unregister commands on the papi that were being handled here
 * WARNING: THIS DOES NOT CHECK FOR INITIALIZATION. DO NOT USE OUTSIDE OF INITIALIZATION. Use unregisterCommands
 * @param commands list of command names to unregister from handling here
 * @returns response whose contents are a list of commands that were not successfully unregistered if error
 * TODO: instead of having an independent unregister, refactor so registerCommandsUnsafe returns a promise and an unsubscriber per command
 */
const unregisterCommandsUnsafe = async (
    ...commandNames: string[]
): Promise<ComplexResponse<string[]>> => {
    const commandResponse = await sendEpmRequestUnsafe<string[], string[]>(
        'unregisterCommands',
        ...commandNames,
    );

    commandNames.forEach((commandName) => {
        if (
            commandResponse.success ||
            !commandResponse.contents?.includes(commandName)
        ) {
            // Command successfully unregistered. Unsubscribe the command request handler!
            const commandUnsubscriber = commandUnsubscribers.get(commandName);
            if (commandUnsubscriber) {
                commandUnsubscriber();
                commandUnsubscribers.delete(commandName);
            } else
                throw Error(
                    `Command ${commandName} does not have a handler to remove`,
                );
        }
    });

    if (!commandResponse.success) {
        console.error(commandResponse.errorMessage, commandResponse);
    }

    return commandResponse;
};

/**
 * Register commands on the papi to be handled here
 * WARNING: THIS DOES NOT CHECK FOR INITIALIZATION. DO NOT USE OUTSIDE OF INITIALIZATION. Use registerCommands
 * @param commands list of commands and handlers to register for handling here
 * @returns response whose contents are a list of commands that were not successfully registered if error
 */
const registerCommandsUnsafe = async (
    ...commands: CommandRegistration[]
): Promise<ComplexResponse<string[]>> => {
    const commandResponse = await sendEpmRequestUnsafe<string[], string[]>(
        'registerCommands',
        ...commands.map((command) => command.commandName),
    );

    commands.forEach((commandRegistration) => {
        if (
            commandResponse.success ||
            !commandResponse.contents?.includes(commandRegistration.commandName)
        ) {
            // Command successfully registered. Register to respond to the command request
            commandUnsubscribers.set(
                commandRegistration.commandName,
                WebSocketService.registerRequestHandler(
                    serializeRequestType(
                        CATEGORY_COMMAND,
                        commandRegistration.commandName,
                    ),
                    commandRegistration.handler,
                ),
            );
        }
    });

    if (!commandResponse.success) {
        console.error(commandResponse.errorMessage, commandResponse);
    }

    return commandResponse;
};

/** Sets up the CommunicationService */
export const initialize = memoizeOne(async (): Promise<void> => {
    if (initialized) return;

    // TODO: Might be best to make a singleton or something
    await WebSocketService.connect();

    // Set up subscriptions that the service needs to work

    // Register built-in commands
    console.log(
        await registerCommandsUnsafe(
            ...Object.entries(commandFunctions).map(
                ([commandName, handler]) => ({
                    commandName,
                    handler,
                }),
            ),
        ),
    );

    // On closing, try to remove command listeners
    // TODO: should probably do this on the server when the connection closes
    window.addEventListener('beforeunload', async () => {
        /* unsubscribeRequests(); */
        await unregisterCommandsUnsafe(...commandUnsubscribers.keys());
    });

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
): Promise<ComplexResponse<K>> => {
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
): Promise<ComplexResponse<K>> => {
    await initialize();
    return sendEpmRequestUnsafe(type, ...args);
};

/**
 * Register commands on the papi to be handled here
 * @param commands list of commands and handlers to register for handling here
 * @returns response whose contents are a list of commands that were not successfully registered if error
 */
export const registerCommands = async (...commands: CommandRegistration[]) => {
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
