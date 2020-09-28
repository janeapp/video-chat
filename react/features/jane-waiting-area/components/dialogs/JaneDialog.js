/* eslint-disable */

import React, {Component} from 'react';
import {getLocalizedDateFormatter, translate} from '../../../base/i18n';
import {connect} from '../../../base/redux';
import ActionButton from '../buttons/ActionButton';
import AudioSettingsButton
    from '../../../toolbox/components/web/AudioSettingsButton';
import VideoSettingsButton
    from '../../../toolbox/components/web/VideoSettingsButton';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import {
    checkLocalParticipantCanJoin,
    checkRemoteParticipantIsWaiting, updateParticipantReadyStatus
} from '../../functions';
import {
    joinConference as joinConferenceAction,
} from '../../actions';

type Props = {
    joinConference: Function,
    t: Function,
    jwt: string,
    jwtPayload: Object,
    participantType: string,
    participant: Object,
    remoteParticipantsStatus: string
};

class JaneDialog extends Component<Props> {
    constructor(props) {
        super(props);
        this._closeWindow = this._closeWindow.bind(this);
        this._joinConference = this._joinConference.bind(this);
    }

    _joinConference() {
        const { jwt, jwtPayload, joinConference, participant, participantType } = this.props;
        updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'joined');
        joinConference();
    }

    _getDialogTitleMsg(localParticipantCanJoin) {
        const { participantType, t } = this.props;
        let title;
        if (localParticipantCanJoin) {
            title = '';
            if (participantType === 'StaffMember') {
                title = t('janeWaitingArea.whenYouAreReady');
            }
        } else {
            title = t('janeWaitingArea.testYourDevice');
        }

        return <div className='jane-waiting-area-info-title-msg'>{title}</div>;
    }

    _getDialogTitle(localParticipantCanJoin) {
        const { participantType, t } = this.props;
        let header;
        if (participantType === 'StaffMember') {
            if (localParticipantCanJoin) {
                header = t('janeWaitingArea.patientIsReady');
            } else {
                header = t('janeWaitingArea.waitClient');
            }
        } else if (localParticipantCanJoin) {
            header = t('janeWaitingArea.practitionerIsReady');
        } else {
            header = t('janeWaitingArea.waitPractitioner');
        }

        return <div className='jane-waiting-area-info-title'>{header}</div>;
    }

    _getStartDate() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';

        if (startAt) {
            return (<p>
                {
                    getLocalizedDateFormatter(startAt).format('MMMM D, YYYY')
                }
            </p>);
        }

        return null;
    }

    _getStartTimeAndEndTime() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';
        const endAt = jwtPayload && jwtPayload.context && jwtPayload.context.end_at || '';

        if (!startAt || !endAt) {
            return null;
        }

        return (<p>
            {
                `${getLocalizedDateFormatter(startAt).format('h:mm')} -
            ${getLocalizedDateFormatter(endAt).format('h:mm A')}`
            }
        </p>);
    }

    _getDuration() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';
        const endAt = jwtPayload && jwtPayload.context && jwtPayload.context.end_at || '';

        if (!startAt || !endAt) {
            return null;
        }
        const duration = getLocalizedDateFormatter(endAt).valueOf() - getLocalizedDateFormatter(startAt).valueOf();

        return (<p>
            {
                `${moment.duration(duration).asMinutes()} Minutes`
            }
        </p>);
    }

    _closeWindow() {
        window.close();
    }

    _getBtnText() {
        const { participantType } = this.props;

        return participantType === 'StaffMember' ? 'Admit Client' : 'Begin';
    }

    render() {
        const {
            participantType,
            jwtPayload,
            t,
            remoteParticipantsStatus
        } = this.props;
        const localParticipantCanJoin = checkLocalParticipantCanJoin(remoteParticipantsStatus);
        const { _onCheckboxChange, _joinConference, _closeWindow } = this;

        return (<div className='jane-waiting-area-info-area-container'>
                <div className='jane-waiting-area-info-area'>
                    <div className='jane-waiting-area-info'>
                        <div className='jane-waiting-area-info-logo-wrapper'>
                            <div className='jane-waiting-area-info-logo'/>
                            {participantType === 'StaffMember' && checkRemoteParticipantIsWaiting(remoteParticipantsStatus) &&
                            <p className='jane-waiting-area-info-patient-waiting'>Client
                                is waiting</p>}
                        </div>
                        <div className='jane-waiting-area-info-text-wrapper'>
                            {
                                this._getDialogTitle(localParticipantCanJoin)
                            }
                            {
                                this._getDialogTitleMsg(localParticipantCanJoin)
                            }
                            <div className='jane-waiting-area-info-detail'>
                                <p>
                                    {
                                        jwtPayload && jwtPayload.context && jwtPayload.context.treatment
                                    }
                                </p>
                                <p>
                                    {
                                        jwtPayload && jwtPayload.context && jwtPayload.context.practitioner_name
                                    }
                                </p>
                                {
                                    this._getStartDate()
                                }
                                {
                                    this._getStartTimeAndEndTime()
                                }
                                {
                                    this._getDuration()
                                }
                            </div>
                        </div>
                    </div>
                    {
                        <div
                            className='jane-waiting-area-preview-join-btn-container'>
                            {
                                localParticipantCanJoin && <ActionButton
                                    onClick={_joinConference}
                                    type='primary'>
                                    {this._getBtnText()}
                                </ActionButton>
                            }
                            {
                                !localParticipantCanJoin && participantType === 'StaffMember'
                                && <ActionButton
                                    onClick={_closeWindow}
                                    type='close'>
                                    Close
                                </ActionButton>
                            }
                        </div>
                    }
                </div>
                <div className='jane-waiting-area-preview-btn-container'>
                    <AudioSettingsButton visible={true}/>
                    <VideoSettingsButton visible={true}/>
                </div>
                <div className='jane-waiting-area-checkbox-container'>
                    <input
                        className='jane-waiting-area-checkbox'
                        onChange={_onCheckboxChange}
                        type='checkbox'/>
                    <span>{t('janeWaitingArea.doNotShow')}</span>
                </div>
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
        jwt,
        jwtPayload,
        participantType,
        participant,
        remoteParticipantsStatus
    };
}

function mapDispatchToProps(dispatch): Object {
    return {
        joinConference() {
            dispatch(joinConferenceAction());
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(JaneDialog));
