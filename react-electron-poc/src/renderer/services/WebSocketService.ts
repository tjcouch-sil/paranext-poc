/** Whether this service has finished setting up */
let initialized = false;
/** Whether the websocket connection is being set up or has finished connecting (does not return to false when connected is true) */
let connecting = false;
/** Whether this service has a websocket connection */
let connected = false;
/** The websocket connected to the server */
let websocket: WebSocket | undefined;
/** Represents when the client id has not been assigned by the server */
const CLIENT_ID_UNASSIGNED = '';
/** The client id for this browser as assigned by the server */
let clientId: string = CLIENT_ID_UNASSIGNED;
/** An unsubscriber for the current initClient subscription. Only want to get client id once per connection,
 *  and don't want to subscribe multiple times on accident */
let unsubscribeInitClient: Unsubscriber | undefined;
/** All message subscriptions - arrays of functions that run each time a message with a specific message type comes in */
const messageSubscriptions = new Map<
    MessageType,
    ((eventData: Message) => void)[]
>();

export type InitClient = {
    type: 'initClient';
    clientId: string;
};
export type ClientConnect = {
    type: 'clientConnect';
    sender: string;
    contents: string;
};
export type Event = {
    type: 'event';
    sender: string;
    contents: string;
};
export type Request = {
    type: 'request';
    sender: string;
    requestId: number;
    contents: string;
};
export type Response = {
    type: 'response';
    /** The process that originally sent the Request that matches to this response */
    sender: string;
    requestId: number;
    /** The process that sent this Response */
    responder: string;
    contents: string;
};

export type Message = InitClient | ClientConnect | Event | Request | Response;

export const MessageTypes = [
    'initClient',
    'clientConnect',
    'event',
    'request',
    'response',
] as const;
export type MessageType = typeof MessageTypes[number];

/** Send a message to the server via websocket */
const sendMessage = (message: Message): void => {
    // TODO: add message queueing
    if (!connected || !websocket)
        throw new Error(
            `Trying to send message when not connected! Message ${message}`,
        );

    websocket.send(JSON.stringify(message));
};

/**
 * Receives and appropriately publishes server websocket messages
 * @param event websocket message information
 */
const onMessage = (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data) as Message;

    const callbacks = messageSubscriptions.get(data.type);
    if (callbacks) callbacks.forEach((callback) => callback(data));
};

/**
 * Unsubscribes a function from running on websocket messages
 * @param messageType the type of message from which to unsubscribe the function
 * @param callback function to unsubscribe from being run on websocket messages.
 * @returns true if successfully unsubscribed
 * Likely will never need to be exported from this file. Just use subscribe, which returns a matching unsubscriber function that runs this.
 */
const unsubscribe = (
    messageType: MessageType,
    callback: (eventData: Message) => void,
): boolean => {
    const callbacks = messageSubscriptions.get(messageType);

    if (!callbacks) return false; // Did not find any callbacks for the message type

    const callbackIndex = callbacks.indexOf(callback);
    if (callbackIndex < 0) return false; // Did not find this callback for the message type

    // Remove the callback
    callbacks.splice(callbackIndex, 1);

    // Remove the map entry if there are no more callbacks
    if (callbacks.length === 0) messageSubscriptions.delete(messageType);

    // Indicate successfully removed the callback
    return true;
};

/** Function to run to stop calling a function on some websocket message. Returns true if successfully unsubscribed */
type Unsubscriber = () => boolean;
/**
 * Subscribes a function to run on every websocket message
 * @param messageType the type of message on which to subscribe the function
 * @param callback function to run with the contents of the websocket message
 * @returns unsubscriber function to run to stop calling the passed-in function on websocket messages
 */
export const subscribe = (
    messageType: MessageType,
    // Any is here because I dunno how to narrow Message type to a specific message type in parameters of a functoin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (eventData: Message | any) => void,
): Unsubscriber => {
    let callbacks = messageSubscriptions.get(messageType);
    if (!callbacks) {
        callbacks = [];
        messageSubscriptions.set(messageType, callbacks);
    }
    callbacks.push(callback);

    return () => unsubscribe(messageType, callback);
};

/** The next requestId to use for identifying requests */
let nextRequestId = 0;
// TODO: implement request timeout logic
type LiveRequest = {
    requestId: number;
    resolve: (value: Response | PromiseLike<Response>) => void;
    reject: (reason?: any) => void;
};
/** All requests that are waiting for a response */
const requests = new Map<number, LiveRequest>();

/**
 * Send a request to the server and resolve after receiving a response
 * @param contents contents to send in the request
 * @returns promise that resolves with the response message
 */
export const request = async (contents: string): Promise<Response> => {
    const requestId = nextRequestId;
    nextRequestId += 1;

    // Set up a promise we can resolve later
    let liveRequest: LiveRequest | undefined;
    const requestPromise = new Promise<Response>((resolve, reject) => {
        liveRequest = {
            requestId,
            resolve,
            reject,
        };
    });

    if (!liveRequest)
        throw new Error(
            `Live request was not created for requestId ${requestId}`,
        );

    // Send the request corresponding to the live request promise
    sendMessage({
        type: 'request',
        sender: clientId,
        requestId,
        contents,
    });

    // Save the live request to resolve when we get the response
    requests.set(requestId, liveRequest);

    return requestPromise;
};

/** Sets up the WebSocketService - does not connect the websocket. Automatically run when connect has been run */
export const initialize = () => {
    if (initialized) return;

    // Set up subscriptions that the service needs to work
    // Get the client id from the server on new connections
    subscribe('initClient', ({ clientId: newClientId }: InitClient) => {
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
    });

    initialized = true;
};

/** Disconnects from the server websocket */
export const disconnect = () => {
    // We don't need to run this if we aren't at least connecting (or connected)
    if (!connecting || !websocket) return;

    if (websocket.readyState === websocket.OPEN) websocket.close();

    // Remove event listeners
    websocket.removeEventListener('message', onMessage);
    websocket.removeEventListener('close', disconnect);

    if (unsubscribeInitClient) unsubscribeInitClient();
    clientId = CLIENT_ID_UNASSIGNED;

    connecting = false;
    connected = false;
};

/** Sets up the WebSocketService by connecting to the server websocket */
export const connect = async (): Promise<void> => {
    // We don't need to run this more than once
    if (connecting) return;

    if (!initialized) initialize();

    connecting = true;

    websocket = new WebSocket('ws://localhost:5122/ws');

    // Mark that we have connected to the websocket
    const onOpen = () => {
        if (!websocket) {
            connecting = false;
            return;
        }

        connected = true;

        sendMessage({
            type: 'clientConnect',
            sender: 'the client',
            contents: 'Hello server! This is from the Client',
        });

        websocket.removeEventListener('open', onOpen);
    };

    websocket.addEventListener('open', onOpen);
    websocket.addEventListener('message', onMessage);
    websocket.addEventListener('close', disconnect);
};
