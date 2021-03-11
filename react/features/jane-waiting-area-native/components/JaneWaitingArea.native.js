// @flow
/* eslint-disable require-jsdoc*/
import React, { Component } from 'react';
import { connect } from '../../base/redux';
import { translate } from '../../base/i18n';
import DialogBox from './DialogBox.native';
import { updateParticipantReadyStatus } from '../functions';

type Props = {
    appstate: Object
};

class JaneWaitingAreaNative extends Component<Props, State> {
    componentDidMount() {
        updateParticipantReadyStatus('waiting');
    }

    render() {
        return (this.props.appstate && this.props.appstate.appState === 'active'
            && <DialogBox />) || null;
    }
}

function mapStateToProps(state): Object {
    const appstate = state['features/background'];

    return {
        appstate
    };
}

export default connect(mapStateToProps)(translate(JaneWaitingAreaNative));
