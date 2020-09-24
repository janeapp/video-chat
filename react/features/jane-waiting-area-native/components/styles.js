// @flow
import { BoxModel } from '../../base/styles';
import { JaneWeb, ColorPalette } from '../../base/styles';

export default {
    prejoinContainer: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30
    },
    preJoinDialogBoxWrapper: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 5,
        flexDirection: 'column'
    },
    preJoinDialogBoxInnerWrapper: {
        flexDirection: 'row',
        paddingTop: 20,
        paddingBottom: 15
    },
    logoWrapper: {
        width: '25%',
        alignItems: 'center'
    },
    logo: {
        marginBottom: 4 * BoxModel.margin,
        width: '50%',
        height: undefined,
        aspectRatio: 1437 / 1188
    },
    messageWrapper: {
        width: '75%',
        alignItems: 'flex-start'
        ,
        paddingRight: 15
    },
    infoDetailContainer: {
        marginTop: 20
    },
    title: {
        fontSize: 14,
        color: ColorPalette.santasGray,
        ...JaneWeb.semiBold
    },
    titleMsg: {
        fontSize: 12,
        marginTop: 20,
        color: ColorPalette.manateeLight,
        ...JaneWeb.regular
    },
    msgText: {
        fontSize: 12,
        color: ColorPalette.manatee,
        ...JaneWeb.bold
    },
    actionButtonContainer: {
        width: 150,
        height: 35,
        backgroundColor: ColorPalette.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        borderColor: ColorPalette.btnBorder,
        borderWidth: 1
    },
    actionBtnTitle: {
        color: ColorPalette.btnTextDefault,
        fontSize: 14,
        ...JaneWeb.regular
    },
    actionButtonWrapper: {
        width: '100%',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: ColorPalette.btnBorder
    },
    joinButtonContainer: {
        backgroundColor: ColorPalette.jane
    },
    joinButtonText: {
        color: ColorPalette.white
    }
};
