// @flow
import React, { Component } from 'react/index';
import {
    Animated,
    Text,
    Image,
    TouchableOpacity
} from 'react-native';
import styles, { WAITING_MESSAGE_CONTIANER_BACKGROUND_COLOR } from './styles';
import { getLocalizedDateFormatter, translate, getTimeStamp } from '../../../i18n';
import { connect } from '../../../redux';
import { getParticipantCount } from '../../../participants';
import { getRemoteTracks } from '../../../tracks';
import jwtDecode from 'jwt-decode';
import { isJaneTestCall } from '../../../conference';
import { Icon, IconClose } from '../../../../base/icons';
import { isIPhoneX } from '../../../../base/styles/functions.native';
import { getLocalParticipantType } from '../../../../base/participants/functions';
const watermarkImg = require('../../../../../../images/watermark.png');

const WATERMARK_ANIMATION_INPUT_RANGE = [ 0, 0.5, 1 ];
const WATERMARK_ANIMATION_OUTPUT_RANGE = [ 0.1, 1, 0.1 ];

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
        this.animatedValue = new Animated.Value(0);
        this._onClose = this._onClose.bind(this);
    }

    componentDidMount() {
        this._startTimer();
    }

    _startTimer() {
        const { appointmentStartAt, conferenceHasStarted } = this.props;

        if (appointmentStartAt && !conferenceHasStarted) {
            const appointmentStartAtTimeStamp = getTimeStamp(appointmentStartAt);
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

    _onClose() {
        this.setState({
            hideWaitingMessage: true
        });
    }

    _getWaitingMessage() {
        const { testMode, appointmentStartAt } = this.props;
        const { beforeAppointmentStart } = this.state;

        let header = (<Text
            style = { styles.waitingMessageHeader }>Waiting for the other participant to join...</Text>);

        let text = <Text style = { styles.waitingMessageText }>Sit back, relax and take a moment for yourself.</Text>;

        if (beforeAppointmentStart && appointmentStartAt) {
            const timeStamp = getTimeStamp(appointmentStartAt);

            header = (
                <Text style = { styles.waitingMessageHeader }>Your appointment will
                    begin at {getLocalizedDateFormatter(timeStamp)
                        .format('hh:mm A')}</Text>);
        }

        if (testMode) {
            header
                = (<Text style = { styles.waitingMessageHeader }>Testing your audio and
                    video...</Text>);

            text = (<Text style = { styles.waitingMessageText }>
                When you are done testing your audio and video, hang up to close this screen.
                Begin your online appointment from your upcoming appointments page.
            </Text>);
        }

        return (<TouchableOpacity
            activeOpacity = { 1 }
            style = { styles.messageWrapper }>
            {
                header
            }
            {
                text
            }
        </TouchableOpacity>);
    }

    _renderCloseBtn() {
        return (<TouchableOpacity
            onPress = { this._onClose }
            style = { styles.waitingMessageCloseBtn }>
            <Icon
                size = { 22 }
                src = { IconClose } />
        </TouchableOpacity>);
    }

    _renderWaitingMessage() {
        const { hideWaitingMessage } = this.state;
        const animate = hideWaitingMessage ? null : this.animatedValue.interpolate({
            inputRange: WATERMARK_ANIMATION_INPUT_RANGE,
            outputRange: WATERMARK_ANIMATION_OUTPUT_RANGE
        });

        const image = (<Image
            source = { watermarkImg }
            style = { styles.watermark } />);
        const backgroundColor = hideWaitingMessage ? 'transparent' : WAITING_MESSAGE_CONTIANER_BACKGROUND_COLOR;
        const paddingTop = isIPhoneX() ? 60 : 40;

        return (<TouchableOpacity
            activeOpacity = { 1 }
            style = { [
                styles.waitingMessageContainer, {
                    backgroundColor,
                    paddingTop
                }
            ] }>
            <Animated.View
                style = { [ styles.watermarkWrapper, {
                    opacity: animate
                } ] }>
                {
                    image
                }
            </Animated.View>
            {
                !hideWaitingMessage && this._getWaitingMessage()
            }
            {
                !hideWaitingMessage && this._renderCloseBtn()
            }
        </TouchableOpacity>);
    }

    render() {
        const { conferenceHasStarted } = this.props;

        if (conferenceHasStarted) {
            return null;
        }

        return (
            this._renderWaitingMessage()
        );
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
