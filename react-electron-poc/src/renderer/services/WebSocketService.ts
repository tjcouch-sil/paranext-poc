/** Whether this service is being set up or has finished setting up (does not return to false when connected is true) */
let connecting = false;
/** Whether this service is finished setting up and we have a websocket connection */
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

type InitClient = {
    type: 'initClient';
    clientId: string;
};
type ClientConnect = {
    type: 'clientConnect';
    sender: string;
    contents: string;
};
type Event = {
    type: 'event';
    sender: string;
    contents: string;
};

type Message = InitClient | ClientConnect | Event;

const MessageTypes = ['initClient', 'clientConnect', 'event'] as const;
type MessageType = typeof MessageTypes[number];

/**
 * Receives and appropriately publishes server websocket messages
 * @param event websocket message information
 */
const onMessage = (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data) as Message;
    console.log('From server:', data);

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

    connecting = true;

    websocket = new WebSocket('ws://localhost:5122/ws');

    // Mark that we have connected to the websocket
    const onOpen = () => {
        if (!websocket) {
            connecting = false;
            return;
        }

        connected = true;

        websocket.send(
            JSON.stringify({
                type: 'clientConnect',
                sender: 'the client',
                contents: 'Hello server! This is from the Client',
            }),
        );

        websocket.removeEventListener('open', onOpen);
    };

    websocket.addEventListener('open', onOpen);
    websocket.addEventListener('message', onMessage);
    websocket.addEventListener('close', disconnect);

    unsubscribeInitClient = subscribe(
        'initClient',
        ({ clientId: newClientId }: InitClient) => {
            if (clientId !== CLIENT_ID_UNASSIGNED)
                throw new Error(
                    `Received initClient message multiple times! Current clientId: ${clientId}. New clientId: ${newClientId}`,
                );

            clientId = newClientId;
            console.log(`Got clientId ${clientId}`);

            if (!websocket) return;

            websocket.send(
                JSON.stringify({
                    type: 'clientStuff',
                    sender: clientId,
                    contents:
                        'Hello server part 2! This is from the Client, and it is a long message!',
                }),
            );

            websocket.send(
                JSON.stringify({
                    type: 'clientStuff',
                    sender: clientId,
                    contents: 'Hello server part 3! This is from the Client',
                }),
            );
        },
    );
};

const sendMessage = async (): Promise<void> => {};

/** Sets up the WebSocketService by connecting to the server websocket */
const initialize = async (): Promise<void> => connect();
