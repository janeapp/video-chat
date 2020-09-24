/* eslint-disable */

import React, {Component} from 'react';
import {connect} from '../../base/redux';
import {
    checkOtherParticipantsReadyStatus,
    updateParticipantReadyStatus
} from '../functions';
import {Socket} from '../../../../service/Websocket/socket';
import jwtDecode from 'jwt-decode';

type Props = {
    t: Function,
    jwt: string,
    jwtPayload: Object,
    participantType: string,
    participant: Object,
};

class SocketConnection extends Component<Props, State> {
    constructor(props) {
        super(props);
        this.socket = null;
        this.pollingInterval = null;
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    componentDidMount() {
        const { jwt, jwtPayload, participant, participantType } = this.props;
        if (participantType === 'Patient') {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'waiting');
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'webview page is ready' }));
        this._connectSocket();
    }

    componentWillUnmount() {
        this.pollingInterval && clearInterval(this.pollingInterval);
        this.socket && this.socket.disconnect();
    }

    _onMessageUpdate(event) {
        const { participantType } = this.props;
        if (event.info && event.info.status && event.participant_type && (event.participant_type !== participantType)) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: { otherParticipantsStatus: event.info.status } }));
        }
    }

    async _polling() {
        const { jwt, jwtPayload, participantType } = this.props;
        const otherParticipantsStatus = await checkOtherParticipantsReadyStatus(jwt, jwtPayload, participantType);

        const status = otherParticipantsStatus && otherParticipantsStatus.info && otherParticipantsStatus.info.status;
        if (status) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: { otherParticipantsStatus: status } }));
        }
    }

    _pollForReadyStatus() {
        this.pollingInterval = setInterval(this._polling.bind(this), 10000);
    }

    _connectionStatusListener(status) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ message: status }));
    };

    async _connectSocket() {
        const { jwt, jwtPayload, participantType } = this.props;
        const socketJwtPayload = jwtDecode(jwtPayload.context.ws_token);
        try {
            const otherParticipantsStatus = await checkOtherParticipantsReadyStatus(jwt, jwtPayload, participantType);
            if (otherParticipantsStatus
                && otherParticipantsStatus.info
                && otherParticipantsStatus.info.status) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ message: { otherParticipantsStatus: otherParticipantsStatus.info.status } }));
            }

            if (socketJwtPayload) {
                this.socket = new Socket({
                    socket_host: jwtPayload.context.ws_host + '22',
                    ws_token: jwtPayload.context.ws_token
                });
                this.socket.onMessageUpdateListener = this._onMessageUpdate.bind(this);
                this.socket.connectionStatusListener = this._connectionStatusListener.bind(this);
                this.socket.pollForReadyStatus = this._pollForReadyStatus.bind(this);
                this.socket.connect();
            }
        } catch (e) {
            console.log(e);
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

    return {
        jwt, jwtPayload, participantType, participant
    };
}

export default connect(mapStateToProps)(SocketConnection);
