// @flow
import { Component } from 'react';

import { renderConferenceTimer } from '../';
import { setConferenceStartTime } from '../../base/conference';
import { getConferenceTimestamp } from '../../base/conference/functions';
import { getLocalizedDurationFormatter } from '../../base/i18n';
import { getParticipantCount } from '../../base/participants';
import { connect } from '../../base/redux';
import { getRemoteTracks } from '../../base/tracks';

/**
 * The type of the React {@code Component} props of {@link ConferenceTimer}.
 */
type Props = {

    /**
     * The UTC timestamp representing the time when first participant joined.
     */
    _startTimestamp: ?number,
    conferenceHasStarted: boolean,

    /**
     * Style to be applied to the rendered text.
     */
    textStyle: ?Object,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,
    conferenceHasStarted: boolean
};

/**
 * The type of the React {@code Component} state of {@link ConferenceTimer}.
 */
type State = {

    /**
     * Value of current conference time.
     */
    timerValue: string
};

/**
 * ConferenceTimer react component.
 *
 * @class ConferenceTimer
 * @extends Component
 */
class ConferenceTimer extends Component<Props, State> {

    /**
     * Handle for setInterval timer.
     */
    _interval;

    /**
     * Initializes a new {@code ConferenceTimer} instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            timerValue: getLocalizedDurationFormatter(0)
        };
    }

    /**
     * Stops the conference timer when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._stopTimer();
    }

    // eslint-disable-next-line require-jsdoc
    componentDidUpdate(prevProps) {
        if (prevProps.conferenceHasStarted !== this.props.conferenceHasStarted && !prevProps.conferenceHasStarted) {
            this.props.dispatch(setConferenceStartTime(new Date()));
            this._startTimer();
        }
        if (prevProps.conferenceHasStarted !== this.props.conferenceHasStarted && prevProps.conferenceHasStarted) {
            this._stopTimer();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { timerValue } = this.state;
        const { _startTimestamp, textStyle } = this.props;

        if (!_startTimestamp) {
            return null;
        }

        return renderConferenceTimer(timerValue, textStyle);
    }

    /**
     * Sets the current state values that will be used to render the timer.
     *
     * @param {number} refValueUTC - The initial UTC timestamp value.
     * @param {number} currentValueUTC - The current UTC timestamp value.
     *
     * @returns {void}
     */
    _setStateFromUTC(refValueUTC, currentValueUTC) {
        if (!refValueUTC || !currentValueUTC) {
            return;
        }

        if (currentValueUTC < refValueUTC) {
            return;
        }

        const timerMsValue = currentValueUTC - refValueUTC;

        const localizedTime = getLocalizedDurationFormatter(timerMsValue);

        this.setState({
            timerValue: localizedTime
        });
    }

    /**
     * Start conference timer.
     *
     * @returns {void}
     */
    _startTimer() {
        this.setState({
            timerValue: getLocalizedDurationFormatter(0)
        }, () => {
            this._setStateFromUTC(this.props._startTimestamp, (new Date()).getTime());

            this._interval = setInterval(() => {
                this._setStateFromUTC(this.props._startTimestamp, (new Date()).getTime());
            }, 1000);
        });
    }

    /**
     * Stop conference timer.
     *
     * @returns {void}
     */
    _stopTimer() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code ConferenceTimer}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *      _startTimestamp: number
 * }}
 */
export function _mapStateToProps(state: Object) {
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);

    return {
        _startTimestamp: getConferenceTimestamp(state),
        conferenceHasStarted: participantCount > 1 && remoteTracks.length > 0
    };
}

export default connect(_mapStateToProps)(ConferenceTimer);
