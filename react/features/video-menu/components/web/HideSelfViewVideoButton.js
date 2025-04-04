/* @flow */

import React, { PureComponent } from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { updateSettings } from '../../../base/settings';
import { showNotification } from '../../../notifications';
import { openSettingsDialog, SETTINGS_TABS } from '../../../settings';

import VideoMenuButton from './VideoMenuButton';

/**
 * The type of the React {@code Component} props of {@link HideSelfViewVideoButton}.
 */
type Props = {

    /**
     * Whether or not to hide the self view.
     */
    disableSelfView: boolean,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * Click handler executed aside from the main action.
     */
    onClick?: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements a React {@link Component} which displays a button for hiding the local video.
 *
 * @augments Component
 */
class HideSelfViewVideoButton extends PureComponent<Props> {
    /**
     * Initializes a new {@code HideSelfViewVideoButton} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {null|ReactElement}
     */
    render() {
        const {
            t
        } = this.props;

        return (
            <VideoMenuButton
                buttonText = { t('videothumbnail.hideSelfView') }
                displayClass = 'hideselflink'
                id = 'hideselfviewbutton'
                onClick = { this._onClick } />
        );
    }

    _onClick: () => void;

    /**
     * Hides the local video.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { disableSelfView, dispatch, onClick } = this.props;

        onClick && onClick();
        dispatch(updateSettings({
            disableSelfView: !disableSelfView
        }));
        if (!disableSelfView) {
            dispatch(showNotification({
                titleKey: 'notify.selfViewTitle',
                customActionNameKey: [ 'settings.title' ],
                customActionHandler: () =>
                    dispatch(openSettingsDialog(SETTINGS_TABS.PROFILE))
            }));
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code FlipLocalVideoButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { disableSelfView } = state['features/base/config'];

    return {
        disableSelfView: Boolean(disableSelfView)
    };
}

export default translate(connect(_mapStateToProps)(HideSelfViewVideoButton));
