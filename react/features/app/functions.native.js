// @flow

import { NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { toState } from '../base/redux';
import { getServerURL } from '../base/settings';

/**
 * Retrieves the default URL for the app. This can either come from a prop to
 * the root App component or be configured in the settings.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {string} - Default URL for the app.
 */
export function getDefaultURL(stateful: Function | Object) {
    const state = toState(stateful);

    return getServerURL(state);
}

/**
 * Returns application name.
 *
 * @returns {string} The application name.
 */
export function getName() {
    return NativeModules.AppInfo.name;
}

/**
 * Returns the path to the Jitsi Meet SDK bundle on iOS. On Android it will be
 * undefined.
 *
 * @returns {string|undefined}
 */
export function getSdkBundlePath() {
    return NativeModules.AppInfo.sdkBundlePath;
}

/**
 * Returns ios device id.
 *
 * @returns {string}
 */
export function getBrowserSessionId() {
    return DeviceInfo.getUniqueId();
}

/**
 * Returns ios device id.
 *
 * @returns {string}
 */
export function getAppVersion() {
    return DeviceInfo.getVersion();
}

/**
 * Returns native app version defined by Jane.
 *
 * @returns {string}
 */
export function getClientVersion() {
    return getAppVersion();
}
