// @flow

import React, { Component } from 'react';
import { batch } from 'react-redux';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { Icon, IconMenuThumb } from '../../../base/icons';
import {
    getLocalParticipant
} from '../../../base/participants';
import { Popover } from '../../../base/popover';
import { connect } from '../../../base/redux';
import { setParticipantContextMenuOpen } from '../../../base/responsive-ui/actions';
import { getLocalVideoTrack } from '../../../base/tracks';
import ConnectionIndicatorContent from '../../../connection-indicator/components/web/ConnectionIndicatorContent';
import { isJaneWaitingAreaPageVisible } from '../../../jane-waiting-area';
import { hideToolboxOnTileView } from '../../../toolbox/actions';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';
import { renderConnectionStatus } from '../../actions.web';

import ConnectionStatusButton from './ConnectionStatusButton';
import FlipLocalVideoButton from './FlipLocalVideoButton';
import HideSelfViewVideoButton from './HideSelfViewVideoButton';
import VideoMenu from './VideoMenu';


/**
 * The type of the React {@code Component} props of
 * {@link LocalVideoMenuTriggerButton}.
 */
type Props = {

    /**
     * The redux dispatch function.
     */
     dispatch: Function,

    /**
     * Gets a ref to the current component instance.
     */
     getRef: Function,

    /**
     * The id of the local participant.
     */
    _localParticipantId: string,

    /**
     * The position relative to the trigger the local video menu should display
     * from. Valid values are those supported by AtlasKit
     * {@code InlineDialog}.
     */
    _menuPosition: string,

    /**
     * Whether to display the Popover as a drawer.
     */
    _overflowDrawer: boolean,

    /**
     * Whether to render the connection info pane.
     */
    _showConnectionInfo: boolean,

    /**
     * Shows/hides the local video flip button.
     */
    _showLocalVideoFlipButton: boolean,

    /**
     * Shows/hides the hide self view button.
     */
    _showHideSelfViewButton: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React Component for displaying an icon associated with opening the
 * the video menu for the local participant.
 *
 * @extends {Component}
 */
class LocalVideoMenuTriggerButton extends Component<Props> {
    /**
     * Reference to the Popover instance.
     */
    popoverRef: Object;

    /**
     * Initializes a new LocalVideoMenuTriggerButton instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.popoverRef = React.createRef();
        this._onPopoverClose = this._onPopoverClose.bind(this);
        this._onPopoverOpen = this._onPopoverOpen.bind(this);
    }

    /**
     * Triggers showing the popover's context menu.
     *
     * @returns {void}
     */
    showContextMenu() {
        if (this.popoverRef && this.popoverRef.current) {
            this.popoverRef.current.showDialog();
        }
    }

    /**
     * Calls the ref(instance) getter.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        if (this.props.getRef) {
            this.props.getRef(this);
        }
    }

    /**
     * Calls the ref(instance) getter.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        if (this.props.getRef) {
            this.props.getRef(null);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _localParticipantId,
            _menuPosition,
            _showConnectionInfo,
            _overflowDrawer,
            _showLocalVideoFlipButton,
            _showHideSelfViewButton,
            t
        } = this.props;

        const content = _showConnectionInfo
            ? <ConnectionIndicatorContent participantId = { _localParticipantId } />
            : (
                <VideoMenu id = 'localVideoMenu'>
                    <FlipLocalVideoButton />
                    { _showHideSelfViewButton && <HideSelfViewVideoButton /> }
                    { isMobileBrowser()
                            && <ConnectionStatusButton participantId = { _localParticipantId } />
                    }
                </VideoMenu>
            );

        return (
            isMobileBrowser() || _showLocalVideoFlipButton
                ? <Popover
                    content = { content }
                    onPopoverClose = { this._onPopoverClose }
                    onPopoverOpen = { this._onPopoverOpen }
                    overflowDrawer = { _overflowDrawer }
                    position = { _menuPosition }
                    ref = { this.popoverRef }>
                    {!_overflowDrawer && (
                        <span
                            className = 'popover-trigger local-video-menu-trigger'>
                            {!isMobileBrowser() && <Icon
                                ariaLabel = { t('dialog.localUserControls') }
                                role = 'button'
                                size = '1em'
                                src = { IconMenuThumb }
                                tabIndex = { 0 }
                                title = { t('dialog.localUserControls') } />
                            }
                        </span>
                    )}
                </Popover>
                : null
        );
    }

    _onPopoverOpen: () => void;

    /**
     * Disable and hide toolbox while context menu is open.
     *
     * @returns {void}
     */
    _onPopoverOpen() {
        this.props.dispatch(setParticipantContextMenuOpen(true));
        this.props.dispatch(hideToolboxOnTileView());
    }

    _onPopoverClose: () => void;

    /**
     * Render normal context menu next time popover dialog opens.
     *
     * @returns {void}
     */
    _onPopoverClose() {
        const { dispatch } = this.props;

        batch(() => {
            dispatch(setParticipantContextMenuOpen(false));
            dispatch(renderConnectionStatus(false));
        });
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code LocalVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const currentLayout = getCurrentLayout(state);
    const localParticipant = getLocalParticipant(state);
    const { disableLocalVideoFlip } = state['features/base/config'];
    const videoTrack = getLocalVideoTrack(state['features/base/tracks']);
    const { overflowDrawer } = state['features/toolbox'];
    const { showConnectionInfo } = state['features/base/connection'];

    let _menuPosition;

    switch (currentLayout) {
    case LAYOUTS.TILE_VIEW:
        _menuPosition = 'left-start';
        break;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
        _menuPosition = 'left-end';
        break;
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
        _menuPosition = 'top';
        break;
    default:
        _menuPosition = 'auto';
    }

    return {
        _menuPosition,
        _showLocalVideoFlipButton: !disableLocalVideoFlip && videoTrack?.videoType !== 'desktop',
        _overflowDrawer: overflowDrawer,
        _localParticipantId: localParticipant.id,
        _showConnectionInfo: showConnectionInfo,
        _showHideSelfViewButton: !isJaneWaitingAreaPageVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(LocalVideoMenuTriggerButton));
