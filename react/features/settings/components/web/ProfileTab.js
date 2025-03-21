// @flow

import Button from '@atlaskit/button/standard-button';
import Checkbox from '@atlaskit/checkbox';
import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import UIEvents from '../../../../../service/UI/UIEvents';
import {
    sendAnalytics,
    createProfilePanelButtonEvent
} from '../../../analytics';
import { AbstractDialogTab } from '../../../base/dialog';
import type { Props as AbstractDialogTabProps } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { openLogoutDialog } from '../../actions';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link ProfileTab}.
 */
export type Props = {
    ...$Exact<AbstractDialogTabProps>,

    /**
     * Whether or not server-side authentication is available.
     */
    authEnabled: boolean,

    /**
     * The name of the currently (server-side) authenticated user.
     */
    authLogin: string,

    /**
     * Whether or not to hide the self view.
     */
    disableSelfView: boolean,

    /**
     * The display name to display for the local participant.
     */
    displayName: string,

    /**
     * The email to display for the local participant.
     */
    email: string,

    /**
     * If the display name is read only.
     */
    readOnlyName: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * React {@code Component} for modifying the local user's profile.
 *
 * @extends Component
 */
class ProfileTab extends AbstractDialogTab<Props> {
    static defaultProps = {
        displayName: '',
        email: ''
    };

    /**
     * Initializes a new {@code ConnectedSettingsDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ConnectedSettingsDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onAuthToggle = this._onAuthToggle.bind(this);
        this._onDisplayNameChange = this._onDisplayNameChange.bind(this);
        this._onEmailChange = this._onEmailChange.bind(this);
        this._onChange = this._onChange.bind(this);
    }

    _onDisplayNameChange: (Object) => void;

    /**
     * Changes display name of the user.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onDisplayNameChange({ target: { value } }) {
        super._onChange({ displayName: value });
    }

    _onEmailChange: (Object) => void;

    /**
     * Changes email of the user.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onEmailChange({ target: { value } }) {
        super._onChange({ email: value });
    }

    _onChange: (Object) => void;

    /**
     * Changes the disable self view state.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onChange({ target }) {
        super._onChange({ disableSelfView: target.checked });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            authEnabled,
            displayName,
            disableSelfView,
            email,
            readOnlyName,
            t
        } = this.props;

        return (
            <div>
                <div className = 'profile-edit'>
                    <div className = 'profile-edit-field'>
                        <FieldTextStateless
                            autoComplete = 'name'
                            compact = { true }
                            id = 'setDisplayName'
                            isReadOnly = { readOnlyName }
                            label = { t('profile.setDisplayNameLabel') }
                            onChange = { this._onDisplayNameChange }
                            placeholder = { t('settings.name') }
                            shouldFitContainer = { true }
                            type = 'text'
                            value = { displayName } />
                    </div>
                    <div className = 'profile-edit-field'>
                        <FieldTextStateless
                            compact = { true }
                            id = 'setEmail'
                            label = { t('profile.setEmailLabel') }
                            onChange = { this._onEmailChange }
                            placeholder = { t('profile.setEmailInput') }
                            shouldFitContainer = { true }
                            type = 'text'
                            value = { email } />
                    </div>
                </div>
                <br />
                <Checkbox
                    isChecked = { disableSelfView }
                    label = { t('videothumbnail.hideSelfView') }
                    name = 'disableSelfView'
                    onChange = { this._onChange } />
                { authEnabled && this._renderAuth() }
            </div>
        );
    }

    _onAuthToggle: () => void;

    /**
     * Shows the dialog for logging in or out of a server and closes this
     * dialog.
     *
     * @private
     * @returns {void}
     */
    _onAuthToggle() {
        if (this.props.authLogin) {
            sendAnalytics(createProfilePanelButtonEvent('logout.button'));

            APP.store.dispatch(openLogoutDialog(
                () => APP.UI.emitEvent(UIEvents.LOGOUT)
            ));
        } else {
            sendAnalytics(createProfilePanelButtonEvent('login.button'));

            APP.UI.emitEvent(UIEvents.AUTH_CLICKED);
        }
    }

    /**
     * Returns a React Element for interacting with server-side authentication.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderAuth() {
        const {
            authLogin,
            t
        } = this.props;

        return (
            <div>
                <h2 className = 'mock-atlaskit-label'>
                    { t('toolbar.authenticate') }
                </h2>
                { authLogin
                    && <div className = 'auth-name'>
                        { t('settings.loggedIn', { name: authLogin }) }
                    </div> }
                <Button
                    appearance = 'primary'
                    id = 'login_button'
                    onClick = { this._onAuthToggle }
                    type = 'button'>
                    { authLogin ? t('toolbar.logout') : t('toolbar.login') }
                </Button>
            </div>
        );
    }
}

export default translate(ProfileTab);
