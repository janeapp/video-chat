// @flow
/* eslint-disable require-jsdoc, react/no-multi-comp, react/jsx-handler-names*/
import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import { Image, Linking, Text, View, Clipboard } from 'react-native';
import { WebView } from 'react-native-webview';

import { createWaitingAreaPageEvent, sendAnalytics } from '../../../analytics';
import { connect as startConference } from '../../../base/connection';
import { getLocalizedDateFormatter } from '../../../base/i18n';
import { getLocalParticipantFromJwt, getLocalParticipantType } from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    enableJaneWaitingArea,
    setJaneWaitingAreaAuthState,
    updateRemoteParticipantsStatuses
} from '../../actions';
import {
    checkLocalParticipantCanJoin,
    updateParticipantReadyStatus
} from '../../functions';

import { ActionButton } from './ActionButton';
import styles from './styles';

type DialogTitleProps = {
    participantType: string,
    localParticipantCanJoin: boolean,
    authState: string
}

type DialogBoxProps = {
    joinConferenceAction: Function,
    startConferenceAction: Function,
    enableJaneWaitingAreaAction: Function,
    jwtPayload: Object,
    jwt: string,
    participantType: string,
    updateRemoteParticipantsStatusesAction: Function,
    setJaneWaitingAreaAuthStateAction: Function,
    locationURL: string,
    remoteParticipantsStatuses: Array<Object>,
    authState: string,
    localParticipantCanJoin: boolean
};

type SocketWebViewProps = {
    onError: Function,
    onMessageUpdate: Function,
    locationURL: string
}

const getWebViewUrl = (locationURL: any) => {
    let uri = locationURL.href;

    uri = `${uri}&RNsocket=true`;

    return uri;
};

const SocketWebView = (props: SocketWebViewProps) => {
    const injectedJavascript = `(function() {
          window.postMessage = function(data) {
            window.ReactNativeWebView.postMessage(data);
          };
        })()`;

    return (<View
        style = { styles.socketView }>
        <WebView
            injectedJavaScript = { injectedJavascript }
            onError = { props.onError }
            onMessage = { props.onMessageUpdate }
            source = {{ uri: getWebViewUrl(props.locationURL) }}
            startInLoadingState = { false } />
    </View>);
};

class DialogBox extends Component<DialogBoxProps> {

    _joinConference: Function;
    _webviewOnError: Function;
    _return: Function;
    _onMessageUpdate: Function;

    constructor(props) {
        super(props);
        this._joinConference = this._joinConference.bind(this);
        this._webviewOnError = this._webviewOnError.bind(this);
        this._return = this._return.bind(this);
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    componentDidMount() {
        const { jwt } = this.props;

        Clipboard.setString('');
        sendAnalytics(
            createWaitingAreaPageEvent('loaded', undefined));
        updateParticipantReadyStatus(jwt, 'waiting');
    }


    _webviewOnError(error) {
        try {
            throw new Error(error);
        } catch (e) {
            sendAnalytics(
                createWaitingAreaPageEvent('webview.error', {
                    error
                }));
            this._joinConference();
        }
    }

    componentDidUpdate(prevProps: DialogBoxProps): * {
        const { localParticipantCanJoin, participantType } = this.props;

        if (prevProps.localParticipantCanJoin !== localParticipantCanJoin
            && participantType === 'Patient'
            && localParticipantCanJoin) {
            // set a 1 sec delay here to ensure that the practitioner can join the call first.
            setTimeout(() => {
                this._joinConference();
            }, 1000);
        }
    }

    componentWillUnmount(): * {
        const { updateRemoteParticipantsStatusesAction } = this.props;

        updateRemoteParticipantsStatusesAction([]);
    }

    _joinConference() {
        const { startConferenceAction, enableJaneWaitingAreaAction, jwt } = this.props;

        updateParticipantReadyStatus(jwt, 'joined');
        enableJaneWaitingAreaAction(false);
        startConferenceAction();
    }

    _getStartDate() {
        const { jwtPayload } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';

        if (startAt) {
            return (<Text style = { styles.msgText }>
                {
                    getLocalizedDateFormatter(startAt)
                        .format('MMMM D, YYYY')
                }
            </Text>);
        }

        return null;
    }

    _getStartTimeAndEndTime() {
        const { jwtPayload } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';
        const endAt = _.get(jwtPayload, 'context.end_at') ?? '';

        if (!startAt || !endAt) {
            return null;
        }

        return (<Text style = { styles.msgText }>
            {
                `${getLocalizedDateFormatter(startAt)
                    .format('h:mm')} - ${getLocalizedDateFormatter(endAt)
                    .format('h:mm A')}`
            }
        </Text>);
    }

    _getDuration() {
        const { jwtPayload } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';
        const endAt = _.get(jwtPayload, 'context.end_at') ?? '';

        if (!startAt || !endAt) {
            return null;
        }
        const duration = getLocalizedDateFormatter(endAt)
            .valueOf() - getLocalizedDateFormatter(startAt)
            .valueOf();


        return (<Text style = { styles.msgText }>
            {
                `${moment.duration(duration)
                    .asMinutes()} Minutes`
            }
        </Text>);
    }

    _getBtnText() {
        const { participantType } = this.props;

        return participantType === 'StaffMember' ? 'Admit Client' : 'Begin';
    }

    _return() {
        const { jwtPayload, jwt } = this.props;
        const leaveWaitingAreaUrl = _.get(jwtPayload, 'context.leave_waiting_area_url') ?? '';

        sendAnalytics(
            createWaitingAreaPageEvent('return.button', {
                event: 'clicked'
            }));
        updateParticipantReadyStatus(jwt, 'left');
        Linking.openURL(leaveWaitingAreaUrl);
    }

    _parseJsonMessage(string) {
        try {
            return string && JSON.parse(string) && JSON.parse(string).message;
        } catch (e) {
            return null;
        }
    }

    _onMessageUpdate(event) {
        const { updateRemoteParticipantsStatusesAction, setJaneWaitingAreaAuthStateAction } = this.props;
        const webViewEvent = this._parseJsonMessage(event.nativeEvent.data);
        const remoteParticipantsStatuses = webViewEvent && webViewEvent.remoteParticipantsStatuses ?? null;

        console.log(webViewEvent, 'incoming web view event');

        if (remoteParticipantsStatuses) {
            updateRemoteParticipantsStatusesAction(remoteParticipantsStatuses);
        }

        if (webViewEvent && webViewEvent.error) {
            sendAnalytics(
                createWaitingAreaPageEvent('webview.error', {
                    error: webViewEvent.error
                }));
            if (webViewEvent.error.error === 'Signature has expired') {
                setJaneWaitingAreaAuthStateAction('failed');
            } else {
                this._joinConference();
            }
        }
    }

    render() {
        const {
            participantType,
            jwtPayload,
            locationURL,
            authState,
            localParticipantCanJoin
        } = this.props;

        return (<View style = { styles.janeWaitingAreaContainer }>
            <View style = { styles.janeWaitingAreaDialogBoxWrapper }>
                <View style = { styles.janeWaitingAreaDialogBoxInnerWrapper }>
                    <View style = { styles.logoWrapper }>
                        <Image
                            source = { require('../../../../../images/jane_logo_72.png') }
                            style = { styles.logo } />
                    </View>
                    <View style = { styles.messageWrapper }>
                        {
                            <DialogTitleHeader
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin }
                                participantType = { participantType } />
                        }
                        {
                            <DialogTitleMsg
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin }
                                participantType = { participantType } />
                        }
                        <View style = { styles.infoDetailContainer }>
                            <Text style = { [ styles.msgText, styles.boldText ] }>
                                {
                                    jwtPayload && jwtPayload.context && jwtPayload.context.treatment
                                }
                            </Text>
                            <Text style = { [ styles.msgText, styles.boldText ] }>
                                {
                                    jwtPayload && jwtPayload.context && jwtPayload.context.practitioner_name
                                }
                            </Text>
                            {
                                this._getStartDate()
                            }
                            {
                                this._getStartTimeAndEndTime()
                            }
                            {
                                this._getDuration()
                            }
                        </View>
                    </View>
                </View>
                {
                    participantType === 'StaffMember' && <View style = { styles.actionButtonWrapper }>
                        {
                            authState !== 'failed'
                        && <ActionButton
                            containerStyle = { styles.joinButtonContainer }
                            disabled = { !localParticipantCanJoin }
                            onPress = { this._joinConference }
                            title = { this._getBtnText() }
                            titleStyle = { styles.joinButtonText } />
                        }
                        {
                            authState === 'failed'
                        && <ActionButton
                            onPress = { this._return }
                            title = { 'Return to my Schedule' } />
                        }
                    </View>
                }
                {
                    participantType === 'Patient' && authState === 'failed'
                    && <View style = { styles.actionButtonWrapper }>
                        <ActionButton
                            onPress = { this._return }
                            title = { 'Return to my account' } />
                    </View>
                }
            </View>
            <SocketWebView
                locationURL = { locationURL }
                onError = { this._webviewOnError }
                onMessageUpdate = { this._onMessageUpdate } />
        </View>);

    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) ?? null;
    const participant = getLocalParticipantFromJwt(state);
    const participantType = getLocalParticipantType(state);
    const { locationURL } = state['features/base/connection'];
    const { remoteParticipantsStatuses, authState } = state['features/jane-waiting-area'];
    const localParticipantCanJoin = checkLocalParticipantCanJoin(remoteParticipantsStatuses, participantType);

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        locationURL,
        remoteParticipantsStatuses,
        authState,
        localParticipantCanJoin
    };
}

const mapDispatchToProps = {
    startConferenceAction: startConference,
    enableJaneWaitingAreaAction: enableJaneWaitingArea,
    updateRemoteParticipantsStatusesAction: updateRemoteParticipantsStatuses,
    setJaneWaitingAreaAuthStateAction: setJaneWaitingAreaAuthState
};

export default connect(mapStateToProps, mapDispatchToProps)(DialogBox);

const DialogTitleHeader = (props: DialogTitleProps) => {
    const { participantType, authState, localParticipantCanJoin } = props;
    const tokenExpiredHeader = 'Your appointment booking has expired';
    let header;

    if (participantType === 'StaffMember') {
        if (localParticipantCanJoin) {
            header = 'Your patient is ready to begin the session.';
        } else {
            header = 'Waiting for your client...';
        }
    } else {
        header = 'Your practitioner will let you into the session when ready...';
    }

    return (<Text
        style = { styles.title }>{ authState === 'failed' ? tokenExpiredHeader : header }</Text>);
};

const DialogTitleMsg = (props: DialogTitleProps) => {
    const { authState, localParticipantCanJoin, participantType } = props;
    const isStaffMember = participantType === 'StaffMember';

    if (authState === 'failed') {
        return null;
    }

    if (localParticipantCanJoin && isStaffMember) {
        return (<Text style = { styles.titleMsg }>
            When you are ready to begin, click on button below to admit your client into the video session.
        </Text>);
    }

    return <>
        <Text
            style = { styles.titleMsg }>
            Please keep your app open to stay on the call.
        </Text>
        <Text
            style = { styles.titleMsg }>
            You may test your audio and video while you wait.
        </Text>
        {
            !isStaffMember && <Text
                style = { styles.titleMsg }>
                Your call will automatically begin momentarily.
            </Text>
        }
    </>;
};
