// @flow
/* eslint-disable */

import React, { Component } from 'react';
import InlineDialog from '@atlaskit/inline-dialog';
import { Icon } from '../../base/icons/components';
import { IconHangup, IconClose } from '../../base/icons';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import _ from 'lodash';
import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { appNavigate } from '../../app';
import { disconnect } from '../../base/connection';

export type Props = {
    showTooltip: boolean,
    dispatch: Function
};

type State = {
    showTooltip: boolean,
};

const closeIconStyle = {
    display: 'inline',
    position: 'absolute',
    top: 3,
    right: 3
};

const toolboxIconStyle = {
    background: '#bf2117',
    border: '1px solid #bf2117'
};


class TestHangupButton extends Component<Props, State> {

    constructor(props) {
        super(props);
        this.state = {
            showTooltip: props.showTooltip || false
        };
    }

    tooltipIsClosedByUser = false;

    _hangup = _.once(() => {
        sendAnalytics(createToolbarEvent('hangup'));
        this.props.dispatch(disconnect(true));
    });

    static getDerivedStateFromProps(props, state) {
        if (props.showTooltip !== state.showTooltip) {
            return {
                showTooltip: props.showTooltip
            };
        }
        return null;
    }

    _onClick(): void {
        this._hangup();
    }

    _onCloseIconClick(): void {
        this.setState({
            showTooltip: false
        }, () => {
            this.tooltipIsClosedByUser = true;
        });
    }

    render(): React$Node {

        return (
            <div class="toolbox-button test-hangup-btn">
                <InlineDialog
                    content={
                        <span>Finished testing? Click here.
                            <Icon
                                src={IconClose}
                                size={14}
                                onClick={this._onCloseIconClick.bind(this)}
                                style={closeIconStyle}/>
                        </span>}
                    isOpen={this.state.showTooltip && !this.tooltipIsClosedByUser}
                    position={'top center'}>
                    <div className="toolbox-icon"
                         style={toolboxIconStyle}
                    >
                        <Icon
                            src={IconHangup}
                            onClick={this._onClick.bind(this)}/>
                    </div>
                </InlineDialog>
            </div>
        );
    }
}

export default translate(connect()(TestHangupButton));
