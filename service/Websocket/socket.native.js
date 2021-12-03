import { NativeModules, NativeEventEmitter } from 'react-native';
const { SocketIO, RNEventEmitter } = NativeModules;
/*eslint-disable*/
export class Socket {
    constructor(options) {
        this.options = options || {};
        this.socket_host = this.options.socket_host || '';
        this.ws_token = this.options.ws_token || '';
        this.autoReconnecting = false;
        this.opts =  {
            token: this.ws_token,
        }

        this.socket = SocketIO;
        this.isConnected = false;
        this.handlers = {};
        this.onAnyHandler = null;
        const eventEmitter = new NativeEventEmitter(RNEventEmitter);
        eventEmitter.addListener('socketEvent', this._handleEvent.bind(this));
        // Set default handlers
        this.defaultHandlers = {
            connect: () => {
                this.isConnected = true;
            },

            disconnect: () => {
                this.isConnected = false;
            }
        };
        // Set initial configuration
        this.socket.initialise(this.socket_host, this.opts);
    }

    // eslint-disable-next-line require-jsdoc
    _handleEvent(event) {
        if (this.handlers.hasOwnProperty(event.name)) {
            this.handlers[event.name](
                event.hasOwnProperty('items') ? event.items : null
            );
        }

        if (this.defaultHandlers.hasOwnProperty(event.name)) {
            this.defaultHandlers[event.name]();
        }

        if (this.onAnyHandler) {
            this.onAnyHandler(event);
        }
    }

    connect() {
        this.socket.connect();
    }

    on(event, handler) {
        this.handlers[event] = handler;
    }

    onAny(handler) {
        this.onAnyHandler = handler;
    }

    disconnect(fast) {
        if (typeof fast === 'undefined') {
            fast = false;
        }
        // this.socket.close(fast);
    }

    reconnect() {
        this.socket.reconnect();
    }
}

