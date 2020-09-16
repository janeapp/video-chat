/* eslint-disable */
import React, {Component} from 'react';
import {
    joinConference as joinConferenceAction
} from '../actions';
import {translate} from '../../base/i18n';
import {connect} from '../../base/redux';
import {
    isDeviceStatusVisible,
    checkOtherParticipantsReadyStatus,
    updateParticipantReadyStatus,
    getPreJoinPageDisplayName
} from '../functions';
import DeviceStatus from './preview/DeviceStatus';
import Preview from './preview/Preview';
import {Socket} from '../../../../service/Websocket/socket';
import jwtDecode from 'jwt-decode';
import {Watermarks} from '../../base/react/components/web';
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
        this.pollingInterval = null;
        this._joinConference = this._joinConference.bind(this);
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    componentDidMount() {
        const { jwt, jwtPayload, participant, participantType } = this.props;
        if (participantType === 'Patient') {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, true);
        }
        window.addEventListener('beforeunload', function (event) {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, false);
        });
        this._connectSocket();
    }

    componentWillUnmount() {
        this.pollingInterval && clearInterval(this.pollingInterval);
        this.socket && this.socket.disconnect();
    }

    _onMessageUpdate(event) {
        const { participant } = this.props;
        const otherParticipantsAreReady = event.info.participant_ready && (event.info.participant_id !== participant.id);
        this.setState({
            localParticipantCanJoin: otherParticipantsAreReady
        });
    }

    _joinConference() {
        const { jwt, jwtPayload, joinConference, participant, participantType } = this.props;
        if (participantType === 'StaffMember') {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, true);
        }
        joinConference();
    }

    async _polling() {
        try {
            const { jwt, jwtPayload } = this.props;
            const otherParticipantsReady = await checkOtherParticipantsReadyStatus(jwt, jwtPayload);

            if (otherParticipantsReady) {
                this.setState({
                    localParticipantCanJoin: true
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    _pollForReadyStatus() {
        this.pollingInterval = setInterval(this._polling.bind(this), 10000);
    }

    async _connectSocket() {
        const { jwt, jwtPayload, participantType } = this.props;
        const socketJwtPayload = jwtDecode(jwtPayload.context.ws_token);

        try {
            const otherParticipantsStatus = await checkOtherParticipantsReadyStatus(jwt, jwtPayload);
            const localParticipantCanJoin = participantType === 'StaffMember' ? otherParticipantsStatus.length : otherParticipantsStatus;
            if (localParticipantCanJoin) {
                this.setState({
                    localParticipantCanJoin: true
                });
            }
            if (socketJwtPayload) {
                this.socket = new Socket({
                    socket_host: jwtPayload.context.ws_host,
                    ws_token: jwtPayload.context.ws_token
                });
                this.socket.onMessageUpdateListener = this._onMessageUpdate.bind(this);
                this.socket.pollForReadyStatus = this._pollForReadyStatus.bind(this);
                this.socket.connect();
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
            <div className='jane-waiting-area-full-page'>
                <Watermarks
                    stopAnimation={stopAnimation || localParticipantCanJoin}
                    waitingMessageHeader={waitingMessageHeader}/>
                <Preview name={name}/>
                <JaneDialog
                    localParticipantCanJoin={localParticipantCanJoin}
                    joinConference={this._joinConference}/>
                {deviceStatusVisible && <DeviceStatus/>}
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
