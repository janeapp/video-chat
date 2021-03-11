// @flow
/* eslint-disable require-jsdoc,max-len, no-undef*/
import jwtDecode from 'jwt-decode';
import _ from 'lodash';

export function isJaneWaitingAreaPageEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) ?? null;
    const shouldEnableJaneWaitingAreaPage = jwtPayload && jwtPayload.context && jwtPayload.context.waiting_area_enabled ?? false;

    return state['features/base/config'].janeWaitingAreaPageEnabled || shouldEnableJaneWaitingAreaPage;
}

export function isJaneWaitingAreaPageVisible(state: Object): boolean {
    return isJaneWaitingAreaPageEnabled(state) && state['features/jane-waiting-area-native']?.showJaneWaitingArea;
}

export function updateParticipantReadyStatus(status: string): void {
    try {
        const { jwt } = APP.store.getState()['features/base/jwt'];
        const jwtPayload = jwt && jwtDecode(jwt) ?? {};
        const updateParticipantStatusUrl = _.get(jwtPayload, 'context.update_participant_status_url') ?? '';
        const info = { status };

        // sendAnalytics(createWaitingAreaParticipantStatusChangedEvent(status));

        return fetch(updateParticipantStatusUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'jwt': jwt,
                'info': info
            })
        }).then(res => {
            if (!res.ok) {
                throw Error('Can Not Update Current Participant\'s Status.');
            }
        });
    } catch (e) {
        console.error(e);
    }
}

export function checkLocalParticipantCanJoin(remoteParticipantsStatuses, participantType) {
    return remoteParticipantsStatuses && remoteParticipantsStatuses.length > 0 && remoteParticipantsStatuses.some(v => {
        if (participantType === 'StaffMember') {
            return v.info && (v.info.status === 'joined' || v.info.status === 'waiting');
        }

        return v.info && v.info.status === 'joined';

    }) ?? false;
}
