// @flow

import throttle from 'lodash/throttle';
import type { Dispatch } from 'redux';

import { NOTIFICATIONS_ENABLED, getFeatureFlag } from '../base/flags';
import { getParticipantCount } from '../base/participants/functions';

import {
    CLEAR_NOTIFICATIONS,
    HIDE_NOTIFICATION,
    HIDE_RAISE_HAND_NOTIFICATIONS,
    SET_HD_VIDEO_ALERT_ENABLED,
    SET_NOTIFICATIONS_ENABLED,
    SHOW_NOTIFICATION
} from './actionTypes';
import {
    NOTIFICATION_TIMEOUT,
    NOTIFICATION_TYPE,
    SILENT_JOIN_THRESHOLD
} from './constants';

/**
 * Clears (removes) all the notifications.
 *
 * @returns {{
 *     type: CLEAR_NOTIFICATIONS
 * }}
 */
export function clearNotifications() {
    return {
        type: CLEAR_NOTIFICATIONS
    };
}

/**
 * Removes the notification with the passed in id.
 *
 * @param {string} uid - The unique identifier for the notification to be
 * removed.
 * @returns {{
 *     type: HIDE_NOTIFICATION,
 *     uid: string
 * }}
 */
export function hideNotification(uid: string) {
    return {
        type: HIDE_NOTIFICATION,
        uid
    };
}

/**
 * Removes the raise hand notifications.
 *
 * @returns {{
 *     type: HIDE_RAISE_HAND_NOTIFICATIONS
 * }}
 */
export function hideRaiseHandNotifications() {
    return {
        type: HIDE_RAISE_HAND_NOTIFICATIONS
    };
}

/**
 * Stops notifications from being displayed.
 *
 * @param {boolean} enabled - Whether or not notifications should display.
 * @returns {{
 *     type: SET_NOTIFICATIONS_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setNotificationsEnabled(enabled: boolean) {
    return {
        type: SET_NOTIFICATIONS_ENABLED,
        enabled
    };
}

/**
 * Queues an error notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @returns {Object}
 */
export function showErrorNotification(props: Object) {
    return showNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.ERROR
    });
}

/**
 * Queues a notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @param {number} timeout - How long the notification should display before
 * automatically being hidden.
 * @returns {Function}
 */
export function showNotification(props: Object = {}, timeout: ?number) {
    return function(dispatch: Function, getState: Function) {
        const { notifications } = getState()['features/base/config'];
        const enabledFlag = getFeatureFlag(getState(), NOTIFICATIONS_ENABLED, true);

        const shouldDisplay = enabledFlag
            && (!notifications
                || notifications.includes(props.descriptionKey)
                || notifications.includes(props.titleKey));

        if (shouldDisplay) {
            return dispatch({
                type: SHOW_NOTIFICATION,
                props,
                timeout,
                uid: props.uid || window.Date.now().toString()
            });
        }
    };
}

/**
 * Queues a warning notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @param {number} timeout - How long the notification should display before
 * automatically being hidden.
 * @returns {Object}
 */
export function showWarningNotification(props: Object, timeout: ?number) {
    return showNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.WARNING
    }, timeout);
}

/**
 * An array of names of participants that have joined the conference. The array
 * is replaced with an empty array as notifications are displayed.
 *
 * @private
 * @type {string[]}
 */
let joinedParticipantsNames = [];

/**
 * A throttled internal function that takes the internal list of participant
 * names, {@code joinedParticipantsNames}, and triggers the display of a
 * notification informing of their joining.
 *
 * @private
 * @type {Function}
 */
const _throttledNotifyParticipantConnected = throttle((dispatch: Dispatch<any>, getState: Function) => {
    const participantCount = getParticipantCount(getState());

    // Skip join notifications altogether for large meetings.
    if (participantCount > SILENT_JOIN_THRESHOLD) {
        joinedParticipantsNames = [];

        return;
    }

    const joinedParticipantsCount = joinedParticipantsNames.length;

    let notificationProps;

    if (joinedParticipantsCount >= 3) {
        notificationProps = {
            titleArguments: {
                name: joinedParticipantsNames[0]
            },
            titleKey: 'notify.connectedThreePlusMembers'
        };
    } else if (joinedParticipantsCount === 2) {
        notificationProps = {
            titleArguments: {
                first: joinedParticipantsNames[0],
                second: joinedParticipantsNames[1]
            },
            titleKey: 'notify.connectedTwoMembers'
        };
    } else if (joinedParticipantsCount) {
        notificationProps = {
            titleArguments: {
                name: joinedParticipantsNames[0]
            },
            titleKey: 'notify.connectedOneMember'
        };
    }

    if (notificationProps) {
        dispatch(
            showNotification(notificationProps, NOTIFICATION_TIMEOUT));
    }

    joinedParticipantsNames = [];

}, 2000, { leading: false });

/**
 * Queues the display of a notification of a participant having connected to
 * the meeting. The notifications are batched so that quick consecutive
 * connection events are shown in one notification.
 *
 * @param {string} displayName - The name of the participant that connected.
 * @returns {Function}
 */
export function showParticipantJoinedNotification(displayName: string) {
    joinedParticipantsNames.push(displayName);

    return (dispatch: Dispatch<any>, getState: Function) => _throttledNotifyParticipantConnected(dispatch, getState);
}

/**
 * Enable/disable the hd video alert.
 *
 * @param {boolean} hdAlertEnabled - Whether or not the alert should display.
 * @returns {{
 *     type: SET_HD_VIDEO_ALERT_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setHdVideoAlertEnabled(hdAlertEnabled: boolean) {
    return {
        type: SET_HD_VIDEO_ALERT_ENABLED,
        hdAlertEnabled
    };
}
