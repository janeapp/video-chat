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
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant);
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
        if ((event.info === 'practitioner_ready' && participantType === 'Patient') || (event.info === 'patient_ready' && participantType === 'StaffMember')) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: { localParticipantCanJoin: true } }));
        }
    }

    async _polling() {
        const { jwt, jwtPayload } = this.props;
        const otherParticipantsReady = await checkOtherParticipantsReadyStatus(jwt, jwtPayload);

        if (otherParticipantsReady) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: { localParticipantCanJoin: true } }));
        }
    }

    _pollForReadyStatus() {
        this.pollingInterval = setInterval(this._polling.bind(this), 10000);
    }

    _connectionStatusListener = (status) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ message: status }));
    };

    async _connectSocket() {
        const { jwt, jwtPayload } = this.props;
        const socketJwtPayload = jwtDecode(jwtPayload.context.ws_token);
        try {
            const otherParticipantsReady = await checkOtherParticipantsReadyStatus(jwt, jwtPayload);
            if (otherParticipantsReady) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ message: { localParticipantCanJoin: true } }));
            } else {
                if (socketJwtPayload) {
                    this.socket = new Socket({
                        socket_host: jwtPayload.context.ws_host,
                        ws_token: jwtPayload.context.ws_token
                    });
                    this.socket.onMessageUpdateListener = this._onMessageUpdate.bind(this);
                    this.socket.connectionStatusListener = this._connectionStatusListener.bind(this);
                    this.socket.pollForReadyStatus = this._pollForReadyStatus.bind(this);
                    this.socket.connect();
                }
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
