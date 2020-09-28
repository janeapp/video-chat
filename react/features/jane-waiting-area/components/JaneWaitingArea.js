/* eslint-disable */
import React, {Component} from 'react';
import {
    joinConference as joinConferenceAction
} from '../actions';
import {translate} from '../../base/i18n';
import {connect} from '../../base/redux';
import {
    isDeviceStatusVisible,
    getPreJoinPageDisplayName
} from '../functions';
import DeviceStatus from './preview/DeviceStatus';
import Preview from './preview/Preview';
import jwtDecode from 'jwt-decode';
import {Watermarks} from '../../base/react/components/web';
import JaneDialog from './dialogs/JaneDialog';
import SocketConnection from './SocketConnection.web';

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
    remoteParticipantsStatus: string
}

class JaneWaitingArea extends Component<Props, State> {
    constructor(props) {
        super(props);
    }

    render() {
        const {
            name,
            participantType,
            deviceStatusVisible,
            remoteParticipantsStatus
        } = this.props;
        const stopAnimation = participantType === 'StaffMember' || remoteParticipantsStatus && remoteParticipantsStatus !== 'left';
        const waitingMessageHeader = participantType === 'StaffMember' ? '' : 'Waiting for the practitioner...';

        return (
            <div className='jane-waiting-area-full-page'>
                <Watermarks
                    stopAnimation={stopAnimation}
                    waitingMessageHeader={waitingMessageHeader}/>
                <Preview name={name}/>
                <JaneDialog/>
                {deviceStatusVisible && <DeviceStatus/>}
                <SocketConnection/>
            </div>
        );
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const { remoteParticipantsStatus } = state['features/jane-waiting-area'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const participant = jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
    const participantType = participant && participant.participant_type || null;

    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        jwt,
        jwtPayload,
        participantType,
        participant,
        remoteParticipantsStatus,
        name: getPreJoinPageDisplayName(state)
    };
}

export default connect(mapStateToProps)(translate(JaneWaitingArea));
