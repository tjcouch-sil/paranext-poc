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

/** Sets up the WebSocketService - does not connect the websocket. Automatically run when connect has been run */
export const initialize = () => {
    if (initialized) return;

    // TODO: Might be best to make a singleton or something
    WebSocketService.connect();

    // Set up subscriptions that the service needs to work
    // Get the client id from the server on new connections
    /* subscribe('initClient', ({ clientId: newClientId }: InitClient) => {
        if (clientId !== CLIENT_ID_UNASSIGNED)
            throw new Error(
                `Received initClient message multiple times! Current clientId: ${clientId}. New clientId: ${newClientId}`,
            );

        clientId = newClientId;
        console.log(`Got clientId ${clientId}`);

        if (!websocket) return;

        sendMessage({
            type: 'clientStuff',
            sender: clientId,
            contents:
                'Hello server part 2! This is from the Client, and it is a long message!',
        } as unknown as Message);

        sendMessage({
            type: 'clientStuff',
            sender: clientId,
            contents: 'Hello server part 3! This is from the Client',
        } as unknown as Message);

        const start = performance.now();
        request('Hi server!')
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

    // Handle response messages to requests we made
    subscribe('response', (response: Response) => {
        const { sender, responder, requestId } = response;
        if (clientId !== sender)
            throw new Error(`Received response with sender ${sender}!`);

        const liveRequest = requests.get(requestId);
        if (!liveRequest)
            throw new Error(
                `Received response for nonexistent requestId ${requestId}`,
            );

        // Remove the request from the requests because it is receiving a response
        requests.delete(requestId);

        // Run the request's response function with the response
        liveRequest.resolve(response);
    }); */

    initialized = true;
};
