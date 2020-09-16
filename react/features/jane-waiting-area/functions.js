// @flow

import jwtDecode from 'jwt-decode';

/**
 * Mutes or unmutes a track.
 *
 * @param {Object} track - The track to be configured.
 * @param {boolean} shouldMute - If it should mute or not.
 * @returns {Promise<void>}
 */
function applyMuteOptionsToTrack(track, shouldMute) {
    if (track.isMuted() === shouldMute) {
        return;
    }

    if (shouldMute) {
        return track.mute();
    }

    return track.unmute();
}


/**
 * Selector for determining if the device status strip is visible or not.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isDeviceStatusVisible(state: Object): boolean {
    return !((isAudioDisabled(state) && isPrejoinVideoDisabled(state))
        || (isPrejoinAudioMuted(state) && isPrejoinVideoMuted(state)));
}

/**
 * Selector for getting the active video/content sharing track.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function getActiveVideoTrack(state: Object): Object {
    const track = getVideoTrack(state) || getContentSharingTrack(state);

    if (track && track.isActive()) {
        return track;
    }

    return null;
}

/**
 * Returns a list with all the prejoin tracks configured according to
 * user's preferences.
 *
 * @param {Object} state - The state of the app.
 * @returns {Promise<Object[]>}
 */
export async function getAllPrejoinConfiguredTracks(state: Object): Promise<Object[]> {
    const tracks = [];
    const audioTrack = getAudioTrack(state);
    const videoTrack = getVideoTrack(state);
    const csTrack = getContentSharingTrack(state);

    if (csTrack) {
        tracks.push(csTrack);
    } else if (videoTrack) {
        await applyMuteOptionsToTrack(videoTrack, isPrejoinVideoMuted(state));
        tracks.push(videoTrack);
    }

    if (audioTrack) {
        await applyMuteOptionsToTrack(audioTrack, isPrejoinAudioMuted(state));
        isPrejoinAudioMuted(state) && audioTrack.mute();
        tracks.push(audioTrack);
    }

    return tracks;
}

/**
 * Selector for getting the prejoin audio track.
 *
 * @param {Object} state - The state of the app.
 * @returns {Object}
 */
export function getAudioTrack(state: Object): Object {
    return state['features/janeWaitingArea']?.audioTrack;
}

/**
 * Selector for getting the prejoin content sharing track.
 *
 * @param {Object} state - The state of the app.
 * @returns {Object}
 */
export function getContentSharingTrack(state: Object): Object {
    return state['features/janeWaitingArea']?.contentSharingTrack;
}

/**
 * Returns the text for the prejoin status bar.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDeviceStatusText(state: Object): string {
    return state['features/janeWaitingArea']?.deviceStatusText;
}

/**
 * Returns the type of the prejoin status bar: 'ok'|'warning'.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDeviceStatusType(state: Object): string {
    return state['features/janeWaitingArea']?.deviceStatusType;
}

/**
 * Returns the 'conferenceUrl' used for dialing out.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutConferenceUrl(state: Object): string {
    return `${getRoomName(state)}@${state['features/base/config'].hosts.muc}`;
}

/**
 * Selector for getting the dial out country.
 *
 * @param {Object} state - The state of the app.
 * @returns {Object}
 */
export function getDialOutCountry(state: Object): Object {
    return state['features/janeWaitingArea'].dialOutCountry;
}

/**
 * Selector for getting the dial out number (without prefix).
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutNumber(state: Object): string {
    return state['features/janeWaitingArea'].dialOutNumber;
}


/**
 * Returns the full dial out number (containing country code and +).
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getFullDialOutNumber(state: Object): string {
    const dialOutNumber = getDialOutNumber(state);
    const country = getDialOutCountry(state);

    return `+${country.dialCode}${dialOutNumber}`;
}

/**
 * Selector for getting the prejoin video track.
 *
 * @param {Object} state - The state of the app.
 * @returns {Object}
 */
export function getVideoTrack(state: Object): Object {
    return state['features/janeWaitingArea']?.videoTrack;
}

/**
 * Selector for getting the mute status of the prejoin audio.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinAudioMuted(state: Object): boolean {
    return state['features/janeWaitingArea']?.audioMuted;
}

/**
 * Selector for getting the mute status of the prejoin video.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinVideoMuted(state: Object): boolean {
    return state['features/janeWaitingArea']?.videoMuted;
}

/**
 * Selector for getting the error if any while creating streams.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getRawError(state: Object): string {
    return state['features/janeWaitingArea']?.rawError;
}

/**
 * Selector for getting state of the prejoin audio.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isAudioDisabled(state: Object): Object {
    return state['features/janeWaitingArea']?.audioDisabled;
}

/**
 * Selector for getting state of the prejoin video.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinVideoDisabled(state: Object): Object {
    return state['features/janeWaitingArea']?.videoDisabled;
}

/**
 * Selector for getting the visiblity state for the 'JoinByPhoneDialog'.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isJoinByPhoneDialogVisible(state: Object): boolean {
    return state['features/janeWaitingArea']?.showJoinByPhoneDialog;
}

/**
 * Returns true if the prejoin page is enabled and no flag
 * to bypass showing the page is present.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinPageEnabled(state: Object): boolean {
    // return state['features/base/config'].prejoinPageEnabled
    //     && !state['features/base/settings'].userSelectedSkipPrejoin;
    const {jwt} = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const shouldEnablePreJoinPage = jwtPayload && jwtPayload.context && jwtPayload.context.ws_host && jwtPayload.context.ws_token;

    return state['features/base/config'].prejoinPageEnabled || shouldEnablePreJoinPage
}

/**
 * Returns true if the prejoin page is visible & active.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPrejoinPageVisible(state: Object): boolean {
    return isPrejoinPageEnabled(state) && state['features/janeWaitingArea']?.showPrejoin;
}

export async function checkOtherParticipantsReady(jwt, jwtPayload) {
    const url = new URL(jwtPayload.context.check_ready_status_url);

    const params = {jwt: jwt};
    url.search = new URLSearchParams(params).toString();

    return fetch(url).then(response => response.json()).then(res => res.other_participants_ready);
}
