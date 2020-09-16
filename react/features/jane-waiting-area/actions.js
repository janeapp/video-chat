/* eslint-disable */

import {
    ADD_PREJOIN_AUDIO_TRACK,
    ADD_PREJOIN_CONTENT_SHARING_TRACK,
    ADD_PREJOIN_VIDEO_TRACK,
    PREJOIN_START_CONFERENCE,
    SET_DEVICE_STATUS,
    SET_PREJOIN_AUDIO_DISABLED,
    SET_PREJOIN_AUDIO_MUTED,
    SET_PREJOIN_DEVICE_ERRORS,
    SET_PREJOIN_PAGE_VISIBILITY,
    SET_PREJOIN_VIDEO_DISABLED,
    SET_PREJOIN_VIDEO_MUTED,
    CONNECT_JANE_SOCKET_SERVER
} from './actionTypes';
import { createLocalTrack } from '../base/lib-jitsi-meet';
import logger from './logger';

import {
    getAudioTrack,
    getVideoTrack,
} from './functions';

export function addPrejoinAudioTrack(value: Object) {
    return {
        type: ADD_PREJOIN_AUDIO_TRACK,
        value
    };
}

export function addPrejoinVideoTrack(value: Object) {
    return {
        type: ADD_PREJOIN_VIDEO_TRACK,
        value
    };
}

export function addPrejoinContentSharingTrack(value: Object) {
    return {
        type: ADD_PREJOIN_CONTENT_SHARING_TRACK,
        value
    };
}

export function initPrejoin(tracks: Object[], errors: Object) {
    return async function(dispatch: Function) {
        const audioTrack = tracks.find(t => t.isAudioTrack());
        const videoTrack = tracks.find(t => t.isVideoTrack());

        dispatch(setPrejoinDeviceErrors(errors));

        if (audioTrack) {
            dispatch(addPrejoinAudioTrack(audioTrack));
        } else {
            dispatch(setAudioDisabled());
        }

        if (videoTrack) {
            if (videoTrack.videoType === 'desktop') {
                dispatch(addPrejoinContentSharingTrack(videoTrack));
                dispatch(setPrejoinVideoDisabled(true));
            } else {
                dispatch(addPrejoinVideoTrack(videoTrack));
            }
        } else {
            dispatch(setPrejoinVideoDisabled(true));
        }
    };
}

export function joinConference() {
    return function(dispatch: Function) {
        dispatch(setPrejoinPageVisibility(false));
        dispatch(startConference());
    };
}

export function replacePrejoinAudioTrack(track: Object) {
    return async (dispatch: Function, getState: Function) => {
        const oldTrack = getAudioTrack(getState());

        oldTrack && await oldTrack.dispose();
        dispatch(addPrejoinAudioTrack(track));
    };
}

export function replaceAudioTrackById(deviceId: string) {
    return async (dispatch: Function) => {
        try {
            const track = await createLocalTrack('audio', deviceId);

            dispatch(replacePrejoinAudioTrack(track));
        } catch (err) {
            dispatch(setDeviceStatusWarning('prejoin.audioTrackError'));
            logger.log('Error replacing audio track', err);
        }
    };
}

export function replacePrejoinVideoTrack(track: Object) {
    return async (dispatch: Function, getState: Function) => {
        const oldTrack = getVideoTrack(getState());

        oldTrack && await oldTrack.dispose();
        dispatch(addPrejoinVideoTrack(track));
    };
}

export function replaceVideoTrackById(deviceId: Object) {
    return async (dispatch: Function) => {
        try {
            const track = await createLocalTrack('video', deviceId);

            dispatch(replacePrejoinVideoTrack(track));
        } catch (err) {
            dispatch(setDeviceStatusWarning('prejoin.videoTrackError'));
            logger.log('Error replacing video track', err);
        }
    };
}

export function setPrejoinAudioMuted(value: boolean) {
    return {
        type: SET_PREJOIN_AUDIO_MUTED,
        value
    };
}

export function setPrejoinVideoDisabled(value: boolean) {
    return {
        type: SET_PREJOIN_VIDEO_DISABLED,
        value
    };
}

export function setPrejoinVideoMuted(value: boolean) {
    return {
        type: SET_PREJOIN_VIDEO_MUTED,
        value
    };
}

export function setAudioDisabled() {
    return {
        type: SET_PREJOIN_AUDIO_DISABLED
    };
}

export function setDeviceStatusOk(deviceStatusText: string) {
    return {
        type: SET_DEVICE_STATUS,
        value: {
            deviceStatusText,
            deviceStatusType: 'ok'
        }
    };
}

export function setDeviceStatusWarning(deviceStatusText: string) {
    return {
        type: SET_DEVICE_STATUS,
        value: {
            deviceStatusText,
            deviceStatusType: 'warning'
        }
    };
}

export function setPrejoinDeviceErrors(value: Object) {
    return {
        type: SET_PREJOIN_DEVICE_ERRORS,
        value
    };
}

export function setPrejoinPageVisibility(value: boolean) {
    return {
        type: SET_PREJOIN_PAGE_VISIBILITY,
        value
    };
}

function startConference() {
    return {
        type: PREJOIN_START_CONFERENCE
    };
}

function connectJaneSocketServer() {
    return {
        type: CONNECT_JANE_SOCKET_SERVER
    };
}
