// @flow

import React from 'react';

type Props = {

    /**
     * The text for the Label.
     */
    children: React$Node,

    /**
     * The CSS class of the label.
     */
    className?: string,

    /**
     * The (round) number prefix for the Label.
     */
    number?: string | number,

    /**
     * The click handler.
     */
    onClick?: Function,
};

/**
 *  Label for the dialogs.
 *
 *  @returns {ReactElement}
 */
function Label({ children, className, number, onClick }: Props) {
    const containerClass = className
        ? `jane-waiting-area-dialog-label ${className}`
        : 'jane-waiting-area-dialog-label';

    return (
        <div
            className = { containerClass }
            onClick = { onClick }>
            {number && <div className = 'jane-waiting-area-dialog-label-num'>{number}</div>}
            <span>{children}</span>
        </div>
    );
}

export default Label;
