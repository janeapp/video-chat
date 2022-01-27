// @flow
import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';

import styles from './styles';

type Props = {
    onPress: Function,
    title: string,
    disabled?: boolean,
    loading?: boolean
};

export const ActionButton = (props: Props): React$Node => {

    const containerStyle = props.disabled ? styles.disabledButtonContainer : styles.joinButtonContainer;
    const titleStyle = props.disabled ? styles.disabledButtonText : styles.joinButtonText;
    const content = props.loading ? (<ActivityIndicator
        size = 'small' />) : <Text style = { [ styles.actionBtnTitle, titleStyle ] }>{props.title}</Text>;

    return (<TouchableOpacity
        disabled = { props.disabled }
        onPress = { props.onPress }
        style = { [ styles.actionButtonContainer, containerStyle ] }>
        {
            content
        }
    </TouchableOpacity>);
};
