/**
 * The prefix of the {@code localStorage} key into which {@link storeConfig}
 * stores and from which {@link restoreConfig} restores.
 *
 * @protected
 * @type string
 */
export const _CONFIG_STORE_PREFIX = 'config.js';

/**
 * The list of all possible UI buttons.
 *
 * @protected
 * @type Array<string>
 */
// export const TOOLBAR_BUTTONS = [
//     'camera',
//     'chat',
//     'closedcaptions',
//     'desktop',
//     'download',
//     'embedmeeting',
//     'etherpad',
//     'feedback',
//     'filmstrip',
//     'fullscreen',
//     'hangup',
//     'help',
//     'invite',
//     'livestreaming',
//     'microphone',
//     'mute-everyone',
//     'mute-video-everyone',
//     'participants-pane',
//     'profile',
//     'raisehand',
//     'recording',
//     'security',
//     'select-background',
//     'settings',
//     'shareaudio',
//     'sharedvideo',
//     'shortcuts',
//     'stats',
//     'tileview',
//     'toggle-camera',
//     'videoquality'
// ];

export const TOOLBAR_BUTTONS = [
    'microphone', 'camera', 'desktop', 'fullscreen',
    'fodeviceselection', 'hangup', 'profile', 'chat', 'settings', 'raisehand',
    'videoquality', 'tileview', 'mute-everyone'
];

/**
 * The toolbar buttons to show on premeeting screens.
 */
export const PREMEETING_BUTTONS = [ 'microphone', 'camera', 'select-background', 'invite', 'settings' ];

/**
  * The toolbar buttons to show on 3rdParty prejoin screen.
  */
export const THIRD_PARTY_PREJOIN_BUTTONS = [ 'microphone', 'camera', 'select-background' ];
