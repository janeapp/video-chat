// @flow
/* eslint-disable */

import { Component } from 'react';
import { connect } from '../../base/redux';
import {
    checkRoomStatus,
    getRemoteParticipantsReadyStatus, isRNSocketWebView,
    updateParticipantReadyStatus
} from '../functions';
import {
    updateRemoteParticipantsStatus as updateRemoteParticipantsStatusAction,
    updateRemoteParticipantsStatusFromSocket as updateRemoteParticipantsStatusFromSocketAction
} from '../actions';
import { Socket } from '../../../../service/Websocket/socket';
import jwtDecode from 'jwt-decode';
import { RemoteParticipantStatus } from '../RemoteParticipantStatus';

type Props = {
    t: Function,
    jwt: string,
    jwtPayload: Object,
    participantType: string,
    participant: Object,
    isRNWebViewPage: boolean,
    updateRemoteParticipantsStatusFromSocket: Function,
    updateRemoteParticipantsStatus: Function
};

class SocketConnection extends Component<Props> {
    socket: Object;

    pollingInterval: ?Function;

    _onMessageUpdate: Function;

    constructor(props) {
        super(props);
        this.socket = {};
        this.pollingInterval = null;
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    componentDidMount() {
        const { jwt, jwtPayload, participant, participantType, isRNWebViewPage } = this.props;

        if (participantType === 'Patient') {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'waiting');
        }

        if (isRNWebViewPage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'webview page is ready' }));
        } else {
            window.onunload = window.onbeforeunload = function() {
                updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'left');
            };
        }
        this._connectSocket();
    }

    componentWillUnmount() {
        this.pollingInterval && clearInterval(this.pollingInterval);
        this.socket && this.socket.disconnect();
    }

    _onMessageUpdate(event) {
        const { participantType, isRNWebViewPage, updateRemoteParticipantsStatusFromSocket } = this.props;

        if (event.info && event.info.status && event.participant_type && (event.participant_type !== participantType)) {
            if (isRNWebViewPage) {
                window.ReactNativeWebView
                    .postMessage(JSON.stringify({ message: { socketRemoteParticipantsEvent: event } }));
            } else {
                const status = new RemoteParticipantStatus(event);

                updateRemoteParticipantsStatusFromSocket(status);
            }
        }
    }

    async _polling() {
        const { jwt, jwtPayload, participantType, isRNWebViewPage, updateRemoteParticipantsStatus } = this.props;
        const response = await checkRoomStatus(jwt, jwtPayload, participantType);
        const remoteParticipantsStatus = await getRemoteParticipantsReadyStatus(response.participants_status, participantType);

        if (isRNWebViewPage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: { remoteParticipantsStatus } }));
        } else {
            updateRemoteParticipantsStatus(remoteParticipantsStatus);
        }
    }

    _pollForReadyStatus() {
        this.pollingInterval = setInterval(this._polling.bind(this), 10000);
    }

    _connectionStatusListener(status) {
        const { isRNWebViewPage } = this.props;

        if (isRNWebViewPage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: status }));
        } else {
            console.log(status);
        }
    }

    async _connectSocket() {
        const { jwt, jwtPayload, participantType, isRNWebViewPage, updateRemoteParticipantsStatus } = this.props;

        try {
            const response = await checkRoomStatus(jwt, jwtPayload, participantType);
            const remoteParticipantsStatus = await getRemoteParticipantsReadyStatus(response.participants_status, participantType);

            if (isRNWebViewPage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ message: { remoteParticipantsStatus } }));
            } else {
                updateRemoteParticipantsStatus(remoteParticipantsStatus);
            }

            this.socket = new Socket({
                socket_host: response.socket_host,
                ws_token: response.socket_token
            });
            this.socket.onMessageUpdateListener = this._onMessageUpdate.bind(this);
            this.socket.connectionStatusListener = this._connectionStatusListener.bind(this);
            this.socket.pollForReadyStatus = this._pollForReadyStatus.bind(this);
            this.socket.connect();
        } catch (e) {
            console.log(e);
            this._pollForReadyStatus();
        }
    }

    render() {
        return null;
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const participant = jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
    const participantType = participant && participant.participant_type || null;
    const { locationURL } = state['features/base/connection'];
    const isRNWebViewPage = isRNSocketWebView(locationURL);

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        isRNWebViewPage
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateRemoteParticipantsStatus(status) {
            dispatch(updateRemoteParticipantsStatusAction(status));
        },
        updateRemoteParticipantsStatusFromSocket(status) {
            dispatch(updateRemoteParticipantsStatusFromSocketAction(status));
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SocketConnection);
