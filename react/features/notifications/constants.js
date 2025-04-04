// @flow

/**
 * The standard time when auto-disappearing notifications should disappear.
 */
export const NOTIFICATION_TIMEOUT = 2500;

/**
 * Notification timeout type.
 */
export const NOTIFICATION_TIMEOUT_TYPE = {
    SHORT: 'short',
    MEDIUM: 'medium',
    LONG: 'long',
    STICKY: 'sticky'
};

/**
 * The set of possible notification types.
 *
 * @enum {string}
 */
export const NOTIFICATION_TYPE = {
    ERROR: 'error',
    INFO: 'info',
    NORMAL: 'normal',
    SUCCESS: 'success',
    WARNING: 'warning'
};

/**
 * A mapping of notification type to priority of display.
 *
 * @enum {number}
 */
export const NOTIFICATION_TYPE_PRIORITIES = {
    [NOTIFICATION_TYPE.ERROR]: 5,
    [NOTIFICATION_TYPE.INFO]: 3,
    [NOTIFICATION_TYPE.NORMAL]: 3,
    [NOTIFICATION_TYPE.SUCCESS]: 3,
    [NOTIFICATION_TYPE.WARNING]: 4
};

/**
 * Amount of participants beyond which no join notification will be emitted.
 */
export const SILENT_JOIN_THRESHOLD = 30;
