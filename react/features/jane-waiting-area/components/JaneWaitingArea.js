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
    joinConference: Function,
};

type State = {
    otherParticipantsStatus: string
}

class JaneWaitingArea extends Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            otherParticipantsStatus: ''
        };
        this.socket = null;
        this.pollingInterval = null;
        this._joinConference = this._joinConference.bind(this);
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    componentDidMount() {
        const { jwt, jwtPayload, participant, participantType } = this.props;
        window.onunload = window.onbeforeunload = function () {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'left');
        };
        if (participantType === 'Patient') {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'waiting');
        }
        this._connectSocket();
    }

    componentWillUnmount() {
        this.pollingInterval && clearInterval(this.pollingInterval);
        this.socket && this.socket.disconnect();
    }

    _onMessageUpdate(event) {
        const { participantType } = this.props;
        if (event && event.info && event.info.status && event.participant_type && (event.participant_type !== participantType)) {
            this.setState({
                otherParticipantsStatus: event.info.status
            });
        }
    }

    _joinConference() {
        const { jwt, jwtPayload, joinConference, participant, participantType } = this.props;
        updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'joined');
        joinConference();
    }

    async _polling() {
        try {
            const { jwt, jwtPayload, participantType } = this.props;
            const otherParticipantsStatus = await checkOtherParticipantsReadyStatus(jwt, jwtPayload, participantType);
            const status = otherParticipantsStatus && otherParticipantsStatus.info && otherParticipantsStatus.info.status;
            if (status) {
                this.setState({
                    otherParticipantsStatus: status
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
            const otherParticipantsStatus = await checkOtherParticipantsReadyStatus(jwt, jwtPayload, participantType);
            this.setState({
                otherParticipantsStatus: otherParticipantsStatus && otherParticipantsStatus.info && otherParticipantsStatus.info.status
            });
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

        const { otherParticipantsStatus } = this.state;
        const stopAnimation = participantType === 'StaffMember' || otherParticipantsStatus && otherParticipantsStatus !== 'left';
        const waitingMessageHeader = participantType === 'StaffMember' ? '' : 'Waiting for the practitioner...';

        return (
            <div className='jane-waiting-area-full-page'>
                <Watermarks
                    stopAnimation={stopAnimation}
                    waitingMessageHeader={waitingMessageHeader}/>
                <Preview name={name}/>
                <JaneDialog
                    otherParticipantsStatus={otherParticipantsStatus}
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
