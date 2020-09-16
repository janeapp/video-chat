// @flow

import React from 'react';
import { Icon, IconArrowDown } from '../../../base/icons';

const classNameByType = {
    primary: 'jane-waiting-area-btn--primary',
    secondary: 'jane-waiting-area-btn--secondary',
    available: 'jane-waiting-area-btn--available',
    text: 'jane-waiting-area-btn--text',
    close: 'jane-waiting-area-btn--close'
};

type Props = {

    /**
     * Text of the button.
     */
    children: React$Node,

    /**
     * Text css class of the button.
     */
    className?: string,

    /**
     * If the button is disabled or not.
     */
    disabled?: boolean,

    /**
     * If the button has options.
     */
    hasOptions?: boolean,

    /**
     * The type of th button: primary, secondary, text.
     */
    type: string,

    /**
     * OnClick button handler.
     */
    onClick: Function,

    /**
     * Click handler for options.
     */
    onOptionsClick?: Function
};

/**
 * Button used for prejoin actions: Join/Join without audio/Join by phone.
 *
 * @returns {ReactElement}
 */
function ActionButton({ children, className, disabled, hasOptions, type, onClick, onOptionsClick }: Props) {
    let ownClassName = 'jane-waiting-area-btn';
    let clickHandler = onClick;
    let optionsClickHandler = onOptionsClick;

    if (disabled) {
        clickHandler = null;
        optionsClickHandler = null;
        ownClassName = `${ownClassName} jane-waiting-area-btn--disabled`;
    } else {
        ownClassName = `${ownClassName} ${classNameByType[type]}`;
    }
    const cls = className ? `${className} ${ownClassName}` : ownClassName;

    return (
        <div
            className = { cls }
            onClick = { clickHandler }>
            {children}
        </div>
    );
}

export default ActionButton;
