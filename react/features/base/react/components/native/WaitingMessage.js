// @flow
/* eslint-disable */
import React, { Component } from 'react/index';
import { Animated, Easing, Text, SafeAreaView, Image } from 'react-native';
import styles from './styles';
import { getLocalizedDateFormatter, translate } from '../../../i18n';
import { connect } from '../../../redux';
import { getParticipantCount } from '../../../participants';
import { getRemoteTracks } from '../../../tracks';
import jwtDecode from 'jwt-decode';
import View from 'react-native-webrtc/RTCView';
import moment from 'moment';

const watermarkImg = require('../../../../../../images/watermark.png');

type Props = {
    _isGuest: boolean,
    jwt: Object,
    conferenceHasStarted: boolean,
    stopAnimation: boolean,
    waitingMessageFromProps: string
};

type State = {
    beforeAppointmentStart: boolean,
    appointmentStartAt: string
};

class WaitingMessage extends Component<Props, State> {

    _interval;

    constructor(props: Props) {
        super(props);

        this.state = {
            beforeAppointmentStart: false,
            appointmentStartAt: '',
            fadeAnim: new Animated.Value(0)
        };
        this.animatedValue = new Animated.Value(0);
    }

    componentDidMount() {
        this._startTimer();
        this._animate();
    }

    _animate() {
        this.animatedValue.setValue(0);
        Animated.timing(
            this.animatedValue,
            {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear
            }
        )
            .start(() => this._animate());
    }

    _startTimer() {
        const { jwt, conferenceHasStarted } = this.props;
        const jwtPayload = jwt && jwtDecode(jwt);
        if (jwtPayload && jwtPayload.context && !conferenceHasStarted) {
            const { start_at } = jwtPayload.context || 0;
            const appointmentStartTimeStamp = moment(start_at, 'YYYY-MM-DD HH:mm:ss')
                .valueOf();
            const now = new Date().getTime();
            if (now < appointmentStartTimeStamp) {
                this.setState({
                    beforeAppointmentStart: true,
                    appointmentStartAt: start_at
                }, () => {
                    this._setInterval(appointmentStartTimeStamp);
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

    getWaitingMessage() {
        const { waitingMessageFromProps } = this.props;
        const { beforeAppointmentStart, appointmentStartAt } = this.state;
        let header, text;

        header = waitingMessageFromProps ? waitingMessageFromProps.header : 'Waiting for the other participant to join...';

        text = waitingMessageFromProps ? waitingMessageFromProps.text : 'Sit back, relax and take a moment for yourself.';

        if (beforeAppointmentStart && appointmentStartAt && !waitingMessageFromProps) {
            const time = moment(appointmentStartAt, 'YYYY-MM-DD HH:mm')
                .format('YYYY-MM-DD HH:mm');
            header = `Your appointment will begin at ${getLocalizedDateFormatter(time)
                .format('hh:mm A')}`;
        }

        if (this._isTestMode()) {
            header = 'Testing your audio and video...';
            text = 'This is just a test area. Begin your online appointment from your Upcoming Appointments page.';
        }

        return <View style={{ backgroundColor: 'transparent' }}>
            <Text style={styles.waitingMessageHeader}>
                {
                    header
                }
            </Text>
            <Text style={styles.waitingMessageText}>
                {
                    text
                }
            </Text>
        </View>;
    }

    _isTestMode() {
        const { jwt } = this.props;
        const jwtPayload = jwt && jwtDecode(jwt) || null;
        const participantId = jwtPayload && jwtPayload.context && jwtPayload.context.user && jwtPayload.context.user.participant_id;
        const videoChatSessionId = jwtPayload && jwtPayload.context && jwtPayload.context.video_chat_session_id;
        const participantEmail = jwtPayload && jwtPayload.context && jwtPayload.context.user && jwtPayload.context.user.email;

        return jwtPayload && participantId === 0 && videoChatSessionId === 0 && participantEmail === 'test@test.com';
    }

    render() {
        const { stopAnimation, conferenceHasStarted } = this.props;
        const animate = (stopAnimation || conferenceHasStarted) ? null : this.animatedValue.interpolate({
            inputRange: [ 0, .5, 1 ],
            outputRange: [ .1, 1, .1 ]
        });

        const image = <Image style={styles.watermark}
                             source={watermarkImg}/>;

        return <SafeAreaView>
            <View style={[ styles.waitingMessageContainer ]}>
                <Animated.View className='waitingMessage'
                               style={[ styles.waitingMessageImage, {
                                   opacity: animate
                               } ]}>
                    {
                        image
                    }
                </Animated.View>
                {
                    !conferenceHasStarted && this.getWaitingMessage()
                }
            </View>
        </SafeAreaView>;
    }
}

function _mapStateToProps(state) {
    const { jwt } = state['features/base/jwt'];
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);

    return {
        jwt,
        conferenceHasStarted: participantCount > 1 && remoteTracks.length > 0
    };
}

export default connect(_mapStateToProps)(translate(WaitingMessage));
