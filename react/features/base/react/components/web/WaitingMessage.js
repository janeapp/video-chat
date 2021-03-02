// @flow
/* eslint-disable */
import jwtDecode from 'jwt-decode';
import React, { Component } from 'react';

import { isJaneTestCall } from '../../../conference';
import { getLocalizedDateFormatter, translate, getTimeStamp } from '../../../i18n';
import {
    getLocalParticipantType,
    getParticipantCount
} from '../../../participants';
import { connect } from '../../../redux';
import { getRemoteTracks } from '../../../tracks';

type Props = {
    appointmentStartAt: string,
    conferenceHasStarted: boolean,
    isStaffMember: boolean,
    testMode: boolean
};

type State = {
    beforeAppointmentStart: boolean,
};

class WaitingMessage extends Component<Props, State> {

    _interval;


    constructor(props: Props) {
        super(props);

        this.state = {
            beforeAppointmentStart: false,
            hideWaitingMessage: !props.testMode && props.isStaffMember
        };
    }

    componentDidMount() {
        this._startTimer();
    }

    _startTimer() {
        const { appointmentStartAt, conferenceHasStarted } = this.props;

        if (appointmentStartAt && !conferenceHasStarted) {
            const appointmentStartAtTimeStamp = getTimeStamp(appointmentStartAt)
            const now = new Date().getTime();

            if (now < appointmentStartAtTimeStamp) {
                this.setState({
                    beforeAppointmentStart: true
                }, () => {
                    this._setInterval(appointmentStartAtTimeStamp);
                });
            }
        }
    }

    _setInterval(appointmentStartTimeStamp) {
        this._interval = setInterval(() => {
            const { conferenceHasStarted } = this.props;
            const now = new Date().getTime();

            if ((appointmentStartTimeStamp < now) || conferenceHasStarted) {
                this.setState({
                    beforeAppointmentStart: false
                }, () => {
                    this._stopTimer();
                });
            }
        }, 1000);
    }

    _stopTimer() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }

    render() {
        const { conferenceHasStarted } = this.props;

        if (conferenceHasStarted) {
            return null;
        }

        return (
            <div>
                {
                    this._renderWaitingMessage()
                }
            </div>
        );
    }

    _renderWaitingMessage() {

        const { beforeAppointmentStart } = this.state;
        const { testMode, appointmentStartAt, isStaffMember } = this.props;
        let header = <p>Waiting for the other participant to join...</p>;
        let text = <p>Sit back, relax and take a moment for yourself.</p>;

        if (beforeAppointmentStart && appointmentStartAt) {
            header = (<p>Your appointment will begin
                at {getLocalizedDateFormatter(appointmentStartAt).format('hh:mm A')}</p>);
        }

        if (testMode) {
            header = <p>Testing your audio and video...</p>;
            text = (<p>
                This is just a test area. Begin your online appointment from
                your <span>{
                    isStaffMember ? 'schedule' : 'upcoming appointments'
                }</span> page.
            </p>);
        }

        return (<div className = 'waitingMessage'>
            {
                header
            }
            {
                text
            }
        </div>);
    }
}

function _mapStateToProps(state) {
    const { jwt } = state['features/base/jwt'];
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);

    const participantType = getLocalParticipantType(state);
    const jwtPayload = jwt && jwtDecode(jwt);

    return {
        conferenceHasStarted: participantCount > 1 && remoteTracks.length > 0,
        testMode: isJaneTestCall(state),
        isStaffMember: participantType === 'StaffMember',
        appointmentStartAt: jwtPayload && jwtPayload.context && jwtPayload.context.start_at ?? ''
    };
}

export default connect(_mapStateToProps)(translate(WaitingMessage));
