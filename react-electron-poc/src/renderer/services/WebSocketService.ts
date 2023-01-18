import {
    ComplexRequest,
    ComplexResponse,
    RequestHandlerType,
    Unsubscriber,
} from '@util/PapiUtil';
import { getErrorMessage } from '@util/Util';

/**
 * Handles setting up a websocket connection to the Paratext backend
 */

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
/** All message subscriptions - arrays of functions that run each time a message with a specific message type comes in */
const messageSubscriptions = new Map<
    MessageType,
    ((eventData: Message) => void)[]
>();
/** Map of requestType to registered handler for that request */
const requestRegistrations = new Map<string, RequestRegistration>();

/** Information about the request handler and how to run it */
// Any is probably fine because we likely never know or care about the args or return
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RequestRegistration<T = any, K = any> = {
    requestType: string;
    handler: RequestHandler<T, K> | RequestHandler<T[], K>;
    handlerType: RequestHandlerType;
};

/**
 * Args handler function for a request. Called when a request is handled.
 * The function should accept the spread of the contents array of the request as its parameters.
 * The function should return an object that becomes the contents object of the response.
 * This type of handler is a normal function.
 */
// Any is probably fine because we likely never know or care about the args or return
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ArgsRequestHandler<T extends Array<unknown> = any[], K = any> = (
    ...args: T
) => K;

/**
 * Contents handler function for a request. Called when a request is handled.
 * The function should accept the contents object of the request as its single parameter.
 * The function should return an object that becomes the contents object of the response.
 */
// Any is probably fine because we likely never know or care about the args or return
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContentsRequestHandler<T = any, K = any> = (contents: T) => K;

/**
 * Complex handler function for a request. Called when a request is handled.
 * The function should accept a ComplexRequest object as its single parameter.
 * The function should return a ComplexResponse object that becomes the response..
 * This type of handler is the most flexible of the request handlers.
 */
// Any is probably fine because we likely never know or care about the args or return
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComplexRequestHandler<T = any, K = any> = (
    request: ComplexRequest<T>,
) => ComplexResponse<K>;

/** Handler function for a request */
// Any is probably fine because we likely never know or care about the args or return
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RequestHandler<T = any, K = any> =
    | ArgsRequestHandler<T[], K>
    | ContentsRequestHandler<T, K>
    | ComplexRequestHandler<T, K>;

enum MessageType {
    InitClient = 'initClient',
    ClientConnect = 'clientConnect',
    Event = 'event',
    Request = 'request',
    Response = 'response',
}
/* const MessageTypes = Object.values(MessageType); */

type InitClient = {
    type: MessageType.InitClient;
    clientId: string;
};
type ClientConnect = {
    type: MessageType.ClientConnect;
    sender: string;
    contents: string;
};
/** One-way broadcast that something has occurred */
type Event<T> = {
    type: MessageType.Event;
    /** What kind of event this is */
    eventType: string;
    sender: string;
    contents?: T;
};
/** Request to do something and to respond */
type Request<T = unknown> = {
    type: MessageType.Request;
    /** What kind of request this is. Certain command, event, etc */
    requestType: string;
    sender: string;
    requestId: number;
} & ComplexRequest<T>;
/** Response to a request */
type Response<K = unknown> = {
    type: MessageType.Response;
    /** What kind of request this is. Certain command, event, etc */
    requestType: string;
    /** The process that originally sent the Request that matches to this response */
    sender: string;
    requestId: number;
    /** The process that sent this Response */
    responder: string;
} & ComplexResponse<K>;

type Message =
    | InitClient
    | ClientConnect
    | Event<unknown>
    | Request<unknown>
    | Response<unknown>;

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

/**
 * Subscribes a function to run on websocket messages of a particular type
 * @param messageType the type of message on which to subscribe the function
 * @param callback function to run with the contents of the websocket message
 * @returns unsubscriber function to run to stop calling the passed-in function on websocket messages
 */
export const subscribe = (
    messageType: MessageType,
    // Any is here because I dunno how to narrow Message type to a specific message type in parameters of a function
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
type LiveRequest<T> = {
    requestId: number;
    resolve: (value: Response<T> | PromiseLike<Response<T>>) => void;
    reject: (reason?: unknown) => void;
};
/** All requests that are waiting for a response */
// Disabled no-explicit-any because assigning a request with generic type to LiveRequest<unknown> gave error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requests = new Map<number, LiveRequest<any>>();

/**
 * Send a request to the server and resolve after receiving a response
 * @param requestType the type of request
 * @param contents contents to send in the request
 * @returns promise that resolves with the response message
 */
export const request = async <T, K>(
    requestType: string,
    contents: T,
): Promise<Response<K>> => {
    const requestId = nextRequestId;
    nextRequestId += 1;

    // Set up a promise we can resolve later
    let liveRequest: LiveRequest<K> | undefined;
    const requestPromise = new Promise<Response<K>>((resolve, reject) => {
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

    // Save the live request to resolve when we get the response
    requests.set(requestId, liveRequest);

    // Send the request corresponding to the live request promise
    sendMessage({
        type: MessageType.Request,
        requestType,
        sender: clientId,
        requestId,
        contents,
    });

    return requestPromise;
};

/**
 * Unregisters a request handler from running on requests
 * @param requestType the type of request from which to unregister the handler
 * @param handler function to unregister from running on requests
 * @returns true if successfully unregistered
 * Likely will never need to be exported from this file. Just use registerRequestHandler, which returns a matching unsubscriber function that runs this.
 */
function unregisterRequestHandler(
    requestType: string,
    handler: RequestHandler,
): boolean {
    if (requestRegistrations.get(requestType)?.handler === handler) {
        requestRegistrations.delete(requestType);
        return true;
    }
    return false;
}

/**
 * Register a request handler to run on requests. Must register requests with the server to receive them here.
 * @param requestType the type of request on which to register the handler
 * @param handler function to register to run on requests
 * @param handlerType type of handler function - indicates what type of parameters and what return type the handler has
 * @returns unsubscriber function to run to stop the passed-in function from handling requests
 */
export function registerRequestHandler(
    requestType: string,
    handler: ContentsRequestHandler,
    handlerType?: RequestHandlerType,
): Unsubscriber;
export function registerRequestHandler(
    requestType: string,
    handler: ComplexRequestHandler,
    handlerType?: RequestHandlerType,
): Unsubscriber;
export function registerRequestHandler(
    requestType: string,
    handler: ArgsRequestHandler,
    handlerType?: RequestHandlerType,
): Unsubscriber;
export function registerRequestHandler(
    requestType: string,
    handler: RequestHandler,
    handlerType = RequestHandlerType.Args,
): Unsubscriber {
    requestRegistrations.set(requestType, {
        requestType,
        handler,
        handlerType,
    });
    return () => unregisterRequestHandler(requestType, handler);
}

/** Disconnects from the server websocket */
export const disconnect = () => {
    // We don't need to run this if we aren't at least connecting (or connected)
    if (!connecting || !websocket) return;

    if (websocket.readyState === websocket.OPEN) websocket.close();

    // Remove event listeners
    websocket.removeEventListener('message', onMessage);
    websocket.removeEventListener('close', disconnect);

    clientId = CLIENT_ID_UNASSIGNED;

    connecting = false;
    connected = false;
};

// TODO: memoize this so it only runs once and always returns the same promise
/** Sets up the WebSocketService by connecting to the server websocket */
export const connect = (): Promise<void> => {
    // We don't need to run this more than once
    if (connecting || connected) return Promise.resolve();

    connecting = true;

    /** Function that resolves the connection promise to be run after receiving a client id */
    let resolveConnect: () => void;
    /** Function that rejects the connection promise */
    let rejectConnect: (reason?: string) => void;

    /** The promise that resolves when the service is finished connecting */
    const connectPromise = new Promise<void>((resolve, reject) => {
        resolveConnect = resolve;
        rejectConnect = reject;
    });

    // Set up subscriptions that the service needs to work
    // Get the client id from the server on new connections
    const unsubscribeInitClient = subscribe(
        MessageType.InitClient,
        ({ clientId: newClientId }: InitClient) => {
            if (clientId !== CLIENT_ID_UNASSIGNED)
                throw new Error(
                    `Received initClient message multiple times! Current clientId: ${clientId}. New clientId: ${newClientId}`,
                );

            clientId = newClientId;
            console.log(`Got clientId ${clientId}`);

            if (!websocket) {
                rejectConnect('websocket is gone!');
                return;
            }

            // Finished setting up WebSocketService and connecting! Resolve the promise
            connected = true;
            resolveConnect();

            sendMessage({
                type: MessageType.ClientConnect,
                sender: 'the client',
                contents: 'Hello server! This is from the Client',
            });

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
        },
    );

    // Handle response messages to requests we made
    const unsubscribeResponse = subscribe(
        MessageType.Response,
        (response: Response<unknown>) => {
            const { sender, responder, requestId } = response;
            if (clientId !== sender)
                throw new Error(
                    `Received response from ${responder} with wrong sender ${sender}!`,
                );

            const liveRequest = requests.get(requestId);
            if (!liveRequest)
                throw new Error(
                    `Received response from ${responder} for nonexistent requestId ${requestId}`,
                );

            // Remove the request from the requests because it is receiving a response
            requests.delete(requestId);

            // Run the request's response function with the response
            liveRequest.resolve(response);
        },
    );

    // Respond to requests from the server
    const unsubscribeRequest = subscribe(
        MessageType.Request,
        (requestMessage: Request<unknown>) => {
            const registration = requestRegistrations.get(
                requestMessage.requestType,
            );

            let result: unknown | undefined;
            let success = false;
            let errorMessage = '';

            if (!registration)
                // There is no handler registered for this request. Respond failure
                errorMessage = 'No handler was found to process the request';
            else
                switch (registration.handlerType) {
                    case RequestHandlerType.Args:
                        try {
                            result = requestMessage.contents
                                ? (registration.handler as ArgsRequestHandler)(
                                      ...(requestMessage.contents as unknown[]),
                                  )
                                : (
                                      registration.handler as ArgsRequestHandler
                                  )();
                            success = true;
                        } catch (e) {
                            errorMessage = getErrorMessage(e);
                        }
                        break;
                    case RequestHandlerType.Contents:
                        try {
                            result = (
                                registration.handler as ContentsRequestHandler
                            )(requestMessage.contents);
                            success = true;
                        } catch (e) {
                            errorMessage = getErrorMessage(e);
                        }
                        break;
                    case RequestHandlerType.Complex: {
                        // Not sure if it's really responsible to put the whole requestMessage in. Might want to destructure and just pass ComplexRequest members
                        const response = (
                            registration.handler as ComplexRequestHandler
                        )(requestMessage);
                        // Breaking out the contents of the ComplexResponse to use existing variables. Should we destructure instead to support other fields? It was not playing well with Typescript
                        result = response.contents;
                        success = response.success;
                        errorMessage = response.errorMessage;
                        break;
                    }
                    default:
                        throw Error(
                            `RequestHandlerType.${registration.handlerType} not supported! On requestType ${requestMessage.requestType}`,
                        );
                }

            if (!success && !errorMessage) {
                errorMessage =
                    'The JS-handled request was not handled successfully';
            }

            sendMessage({
                type: MessageType.Response,
                requestType: requestMessage.requestType,
                sender: requestMessage.sender,
                requestId: requestMessage.requestId,
                responder: clientId,
                contents: result,
                success,
                errorMessage,
            });
        },
    );

    websocket = new WebSocket('ws://localhost:5122/ws');

    // Do stuff when we open the web socket. Does not represent successfully connectnig as we need a client id
    // Cannot send messages here as we are not considered to be fully connected
    // TODO: if the web socket never opens, we never remove the onOpen event listener. Pls fix
    const onOpen = () => {
        if (!websocket) {
            connecting = false;
            return;
        }

        websocket.removeEventListener('open', onOpen);
    };

    websocket.addEventListener('open', onOpen);
    websocket.addEventListener('message', onMessage);
    websocket.addEventListener('close', () => {
        if (!connected)
            // The service is not connected, so reject the connection promise
            rejectConnect('Web socket closed before connecting!');
        unsubscribeInitClient();
        unsubscribeResponse();
        unsubscribeRequest();
        disconnect();
    });

    return connectPromise;
};
