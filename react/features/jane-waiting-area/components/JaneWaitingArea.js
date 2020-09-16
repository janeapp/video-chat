/* eslint-disable */
import React, { Component } from 'react';
import {
    joinConference as joinConferenceAction
} from '../actions';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import {
    isDeviceStatusVisible,
    checkOtherParticipantsReady,
    updateParticipantReadyStatus,
    getPreJoinPageDisplayName
} from '../functions';
import DeviceStatus from './preview/DeviceStatus';
import Preview from './preview/Preview';
import { Sockets } from '../../../../service/Websocket/socket';
import jwtDecode from 'jwt-decode';
import { Watermarks } from '../../base/react/components/web';
import JaneDialog from './dialogs/JaneDialog';

type Props = {
    t: Function,
    jwt: string,
    jwtPayload: Object,
    participantType: string,
    participant: Object,
    deviceStatusVisible: boolean,
    joinConference: Function
};

type State = {
    localParticipantCanJoin: boolean
}

class JaneWaitingArea extends Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            localParticipantCanJoin: false
        };
        this.socket = null;
        this._joinConference = this._joinConference.bind(this);
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    componentDidMount() {
        const { jwt, jwtPayload, participant, participantType } = this.props;
        if (participantType === 'Patient') {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant);
        }
        this._connectSocket();
    }

    componentWillUnmount() {
        this.socket && this.socket.disconnect();
    }

    _onMessageUpdate(event) {
        const { participantType } = this.props;

        if (event.info === 'practitioner_ready' && participantType === 'Patient') {
            this.setState({
                localParticipantCanJoin: true
            });
        }
        if (event.info === 'patient_ready' && participantType === 'StaffMember') {
            this.setState({
                localParticipantCanJoin: true
            });
        }
    }

    _joinConference() {
        const { jwt, jwtPayload, joinConference, participant, participantType } = this.props;
        if (participantType === 'StaffMember') {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant);
        }
        joinConference();
    }

    async _connectSocket() {
        const { jwt, jwtPayload } = this.props;
        const socketJwtPayload = jwtDecode(jwtPayload.context.ws_token);

        try {
            const otherParticipantsReady = await checkOtherParticipantsReady(jwt, jwtPayload);

            if (otherParticipantsReady) {
                this.setState({
                    localParticipantCanJoin: true
                });
            } else if (socketJwtPayload) {
                this.socket = new Sockets({
                    socket_host: jwtPayload.context.ws_host,
                    ws_token: jwtPayload.context.ws_token
                });
                this.socket.onMessageUpdateListener = this._onMessageUpdate.bind(this);
            }
        } catch (e) {
            console.log(e);
        }
    }

    render() {
        const {
            name,
            participantType,
            deviceStatusVisible
        } = this.props;

        const { localParticipantCanJoin } = this.state;
        const stopAnimation = participantType === 'StaffMember';
        const waitingMessageHeader = participantType === 'StaffMember' ? '' : 'Waiting for the practitioner...';


        return (
            <div className = 'jane-waiting-area-full-page'>
                <Watermarks
                    stopAnimation = { stopAnimation || localParticipantCanJoin }
                    waitingMessageHeader = { waitingMessageHeader } />
                <Preview name = { name } />
                <JaneDialog
                    localParticipantCanJoin = { localParticipantCanJoin }
                    joinConference = { this._joinConference } />
                {deviceStatusVisible && <DeviceStatus />}
            </div>
        );
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const participant = jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
    const participantType = participant && participant.participant_type || null;

    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        jwt,
        jwtPayload,
        participantType,
        participant,
        name: getPreJoinPageDisplayName(state)
    };
}

const mapDispatchToProps = {
    joinConference: joinConferenceAction
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(JaneWaitingArea));
