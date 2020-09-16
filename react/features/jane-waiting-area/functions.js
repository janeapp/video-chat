/* eslint-disable */
import jwtDecode from 'jwt-decode';


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
    return !((isAudioDisabled(state) && isPrejoinVideoDisabled(state))
        || (isPrejoinAudioMuted(state) && isPrejoinVideoMuted(state)));
}

export function getActiveVideoTrack(state: Object): Object {
    const track = getVideoTrack(state) || getContentSharingTrack(state);

    if (track && track.isActive()) {
        return track;
    }

    return null;
}

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

export function isPrejoinAudioMuted(state: Object): boolean {
    return state['features/jane-waiting-area']?.audioMuted;
}

export function isPrejoinVideoMuted(state: Object): boolean {
    return state['features/jane-waiting-area']?.videoMuted;
}

export function getRawError(state: Object): string {
    return state['features/jane-waiting-area']?.rawError;
}

export function isAudioDisabled(state: Object): Object {
    return state['features/jane-waiting-area']?.audioDisabled;
}

export function isPrejoinVideoDisabled(state: Object): Object {
    return state['features/jane-waiting-area']?.videoDisabled;
}

export function getPreJoinPageDisplayName(state: Object): string {
    return state['features/base/participants'][0].name || '';
}

export function isPrejoinPageEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const shouldEnablePreJoinPage = jwtPayload && jwtPayload.context && jwtPayload.context.ws_host && jwtPayload.context.ws_token;

    return state['features/base/config'].prejoinPageEnabled || shouldEnablePreJoinPage;
}

export function isPrejoinPageVisible(state: Object): boolean {
    return isPrejoinPageEnabled(state) && state['features/jane-waiting-area']?.showPrejoin;
}

export async function checkOtherParticipantsReady(jwt, jwtPayload) {
    const url = new URL(jwtPayload.context.check_ready_status_url);

    const params = { jwt };

    url.search = new URLSearchParams(params).toString();

    return fetch(url).then(response => response.json())
.then(res => res.other_participants_ready);
}

export function updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant) {
    if (jwt && jwtPayload) {
        const wsUpdateUrl = jwtPayload.context.participant_ready_url;
        const obj = {
            jwt,
            info: participantType === 'StaffMember' ? 'practitioner_ready' : 'patient_ready',
            participant_type: participantType === 'StaffMember' ? 'staff_member' : 'patient',
            participant_id: participant.participant_id,
            participant_name: participant.name,
            room_name: jwtPayload.room
        };
        const data = new Blob([JSON.stringify(obj, null, 2)], { type: 'text/plain; charset=UTF-8' });

        navigator.sendBeacon(wsUpdateUrl, data);
    }
}
