// @flow
/* eslint-disable */

import { Component } from 'react';

import { notifyBugsnag } from '../../../../../bugsnag';
import { Socket } from '../../../../../service/Websocket/socket';
import {
    createWaitingAreaModalEvent,
    createWaitingAreaSocketEvent,
    sendAnalytics
} from '../../../analytics';
import {
    redirectToStaticPage
} from '../../../app/actions';
import { getLocalParticipantInfoFromJwt, getLocalParticipantType } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import { playSound as playSoundAction } from '../../../base/sounds';
import { showErrorNotification as showErrorNotificationAction } from '../../../notifications';
import {
    setJaneWaitingAreaAuthState as setJaneWaitingAreaAuthStateAction,
    updateRemoteParticipantsStatuses as updateRemoteParticipantsStatusesAction,
    updateRemoteParticipantsStatusesFromSocket as updateRemoteParticipantsStatusesFromSocketAction
} from '../../actions';
import { POLL_INTERVAL, REDIRECT_TO_WELCOME_PAGE_DELAY, CLOSE_BROWSER_DELAY } from '../../constants';
import {
    checkRoomStatus,
    getRemoteParticipantsStatuses
} from '../../functions';
const UNABLE_TO_CONNECT_SOCKET = 'Unable to connect Socket.IO';

class SocketConnection extends Component<Props> {

    socket: Object;

    interval: ?IntervalID;

    connectionAttempts: number;

    constructor(props) {
        super(props);
        this.socket = null;
        this.interval = undefined;
        this.connectionAttempts = 0;
    }

    componentDidMount() {
        this._fetchDataAndconnectSocket();
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
        this.socket && this.socket.disconnect();
    }

    _onMessageReceivedListener(event) {
        const { participantType, updateRemoteParticipantsStatusesFromSocket } = this.props;

        if (event.info && event.info.status && event.participant_type && (event.participant_type !== participantType)) {
            updateRemoteParticipantsStatusesFromSocket(event);
            sendAnalytics(createWaitingAreaSocketEvent('message.received', event));
        }
    }

    _connectionStatusListener(status) {
        if (status && status.error && !this.interval) {
            sendAnalytics(createWaitingAreaSocketEvent('error', status.error));
            sendAnalytics(createWaitingAreaModalEvent('polling.started'));
            notifyBugsnag(status.error);
            console.log('socket fallback to polling');
            this._polling();
        }

        if (status && status.event === 'connected' && this.interval) {
            sendAnalytics(createWaitingAreaModalEvent('polling.stoped'));
            clearInterval(this.interval);
            this.interval = undefined
            this.connectionAttempts = 0;
        }
    }

    _redirectToWelcomePage() {
        const { redirectToWelcomePage } = this.props;

        // Wait 5 seconds before redirecting user to the welcome page
        setTimeout(() => {
            redirectToWelcomePage();
        }, REDIRECT_TO_WELCOME_PAGE_DELAY);
    }

    _polling() {
        this.interval
            = setInterval(
            () => {
                this._fetchDataAndconnectSocket();
            },
            POLL_INTERVAL);
    }

    setUpListeners(){
        this.socket.on('error', reason => {
            this.autoReconnecting = false;
            this._connectionStatusListener({ error: reason });
            console.error(UNABLE_TO_CONNECT_SOCKET, reason);
        });

        // this will trigger internal reconnect mechanism if a connection error occurs
        this.socket.on('connect_error', reason => {
            this.autoReconnecting = true;
            this._connectionStatusListener({ error: reason });
            console.error(UNABLE_TO_CONNECT_SOCKET, reason);
        });

        this.socket.on('connect', () => {
            this.autoReconnecting = false;
            this._connectionStatusListener({ event: 'connected' });
            console.info('websocket connected');
            sendAnalytics(createWaitingAreaSocketEvent('connected'));
        });

        // this only applies to socket.io's internal reconnect mechanism
        this.socket.on('reconnect_attempt', () => {
            this.socket.io.opts.query.token = this.ws_token;
            console.info('automatically reconnecting');
        });

        this.socket.on('disconnect', () => {
            console.info('websocket disconnected');
            this._connectionStatusListener({ event: 'disconnected' });
        });

        this.socket.on('message', payload => {
            const event_object = JSON.parse(payload);

            this._onMessageReceivedListener(event_object);
        });
    }

    async _fetchDataAndconnectSocket() {
        const { participantType,
            updateRemoteParticipantsStatuses,
            setJaneWaitingAreaAuthState,
            jwt, showErrorNotification } = this.props;
        try {
            // fetch data
            const response = await checkRoomStatus(jwt);
            const remoteParticipantsStatuses = getRemoteParticipantsStatuses(response.participant_statuses, participantType);

            // This action will update the remote participant states in reducer
            updateRemoteParticipantsStatuses(remoteParticipantsStatuses);

            if (this.socket) {
                this.socket.reconnect(response.socket_token);
            } else {
                this.socket = new Socket({
                    socket_host: response.socket_host,
                    ws_token: response.socket_token
                });
                this.socket.connect();
                this.setUpListeners();
            }
        } catch (error) {
            if (this.connectionAttempts === 3) {
                if (error && error.error === 'Signature has expired') {
                    setJaneWaitingAreaAuthState('failed');
                }
                showErrorNotification({
                    description: error && error.error,
                    titleKey: 'janeWaitingArea.errorTitleKey'
                });

                // send event to datadog
                sendAnalytics(createWaitingAreaModalEvent('polling.stoped'));
                clearInterval(this.interval);
                this.interval = undefined
                return this._redirectToWelcomePage();
            }
            this.connectionAttempts++;
            this._fetchDataAndconnectSocket();
        }
    }

    render() {
        return null;
    }
}

function mapStateToProps(state): Object {
    const participant = getLocalParticipantInfoFromJwt(state);
    const participantType = getLocalParticipantType(state);
    const { remoteParticipantsStatuses } = state['features/jane-waiting-area'];
    const { jwt } = state['features/base/jwt'];

    return {
        participantType,
        participant,
        remoteParticipantsStatuses,
        jwt
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateRemoteParticipantsStatuses(status) {
            dispatch(updateRemoteParticipantsStatusesAction(status));
        },
        updateRemoteParticipantsStatusesFromSocket(status) {
            dispatch(updateRemoteParticipantsStatusesFromSocketAction(status));
        },
        playSound(soundId) {
            dispatch(playSoundAction(soundId));
        },
        setJaneWaitingAreaAuthState(state) {
            dispatch(setJaneWaitingAreaAuthStateAction(state));
        },
        showErrorNotification(error) {
            dispatch(showErrorNotificationAction(error));
        },
        redirectToWelcomePage() {
            dispatch(redirectToStaticPage('/'));
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SocketConnection);
