/* eslint-disable */
import jwtDecode from 'jwt-decode';
import {RemoteParticipantStatus} from './RemoteParticipantStatus';

function applyMuteOptionsToTrack(track, shouldMute) {
    if (track.isMuted() === shouldMute) {
        return;
    }

    if (shouldMute) {
        return track.mute();
    }

    return track.unmute();
}


export function isDeviceStatusVisible(state: Object): boolean {
    return !((isAudioDisabled(state) && isJaneWaitingAreaVideoDisabled(state))
        || (isJaneWaitingAreaAudioMuted(state) && isJaneWaitingAreaVideoMuted(state)));
}

export function getActiveVideoTrack(state: Object): Object {
    const track = getVideoTrack(state) || getContentSharingTrack(state);

    if (track && track.isActive()) {
        return track;
    }

    return null;
}

export async function getAllJaneWaitingAreaConfiguredTracks(state: Object): Promise<Object[]> {
    const tracks = [];
    const audioTrack = getAudioTrack(state);
    const videoTrack = getVideoTrack(state);
    const csTrack = getContentSharingTrack(state);

    if (csTrack) {
        tracks.push(csTrack);
    } else if (videoTrack) {
        await applyMuteOptionsToTrack(videoTrack, isJaneWaitingAreaVideoMuted(state));
        tracks.push(videoTrack);
    }

    if (audioTrack) {
        await applyMuteOptionsToTrack(audioTrack, isJaneWaitingAreaAudioMuted(state));
        isJaneWaitingAreaAudioMuted(state) && audioTrack.mute();
        tracks.push(audioTrack);
    }

    return tracks;
}

export function getAudioTrack(state: Object): Object {
    return state['features/jane-waiting-area']?.audioTrack;
}

export function getContentSharingTrack(state: Object): Object {
    return state['features/jane-waiting-area']?.contentSharingTrack;
}

export function getDeviceStatusText(state: Object): string {
    return state['features/jane-waiting-area']?.deviceStatusText;
}

export function getDeviceStatusType(state: Object): string {
    return state['features/jane-waiting-area']?.deviceStatusType;
}

export function getVideoTrack(state: Object): Object {
    return state['features/jane-waiting-area']?.videoTrack;
}

export function isJaneWaitingAreaAudioMuted(state: Object): boolean {
    return state['features/jane-waiting-area']?.audioMuted;
}

export function isJaneWaitingAreaVideoMuted(state: Object): boolean {
    return state['features/jane-waiting-area']?.videoMuted;
}

export function getRawError(state: Object): string {
    return state['features/jane-waiting-area']?.rawError;
}

export function isAudioDisabled(state: Object): Object {
    return state['features/jane-waiting-area']?.audioDisabled;
}

export function isJaneWaitingAreaVideoDisabled(state: Object): Object {
    return state['features/jane-waiting-area']?.videoDisabled;
}

export function getJaneWaitingAreaPageDisplayName(state: Object): string {
    return state['features/base/participants'][0].name || '';
}

export function isJaneWaitingAreaPageEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const shouldEnableJaneWaitingAreaPage = jwtPayload && jwtPayload.context && jwtPayload.context.waiting_area_enabled

    return state['features/base/config'].janeWaitingAreaPageEnabled || shouldEnableJaneWaitingAreaPage;
}

export function isJaneWaitingAreaPageVisible(state: Object): boolean {
    return isJaneWaitingAreaPageEnabled(state) && state['features/jane-waiting-area']?.showJaneWaitingArea;
}

export async function checkRoomStatus(jwt, jwtPayload) {
    const url = new URL(jwtPayload.context.room_status_url);

    const params = { jwt };

    url.search = new URLSearchParams(params).toString();

    return fetch(url).then(response => response.json())
        .then(res => res);
}

export async function getRemoteParticipantsReadyStatus(participantsStatus, participantType) {
    const remoteParticipantType = participantType === 'StaffMember' ? 'Patient' : 'StaffMember';
    let remoteParticipantStatus = [];
    participantsStatus && participantsStatus.forEach((v) => {
        if (v.participant_type === remoteParticipantType) {
            remoteParticipantStatus.push(new RemoteParticipantStatus(v));
        }
    });
    return remoteParticipantStatus;
}

export function updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, status) {
    if (jwt && jwtPayload) {
        const updateParticipantStatusUrl = jwtPayload.context.update_participant_status_url;
        const info = { status };
        const obj = {
            jwt,
            info,
            participant_type: participantType === 'StaffMember' ? 'staff_member' : 'patient',
            participant_id: participant.participant_id,
            participant_name: participant.name,
            room_name: jwtPayload.room
        };
        const data = new Blob([JSON.stringify(obj, null, 2)], { type: 'text/plain; charset=UTF-8' });
        navigator.sendBeacon(updateParticipantStatusUrl, data);
    }
}

export function isRNSocketWebView(locationURL) {
    return String(locationURL.href).includes('RNsocket=true');
}

export function checkLocalParticipantCanJoin(remoteParticipantsStatus) {
    // TODO: in future we will update the logic below for Group call
    return remoteParticipantsStatus.length > 0 && remoteParticipantsStatus.some(v => {
        return v.info && v.info.status !== 'left';
    });
}

export function checkRemoteParticipantIsWaiting(remoteParticipantsStatus) {
    // TODO: in future we will update the logic below for Group call
    return remoteParticipantsStatus.length > 0 && remoteParticipantsStatus.some(v => {
        return v.info && v.info.status === 'waiting';
    });
}
