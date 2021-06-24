/**
 * @format
 */
import 'sariska-media-transport/build/modules/mobile/polyfills';
import {AppRegistry, Platform} from 'react-native';
import React from "react"
import App from './App';
import {name as appName} from './app.json';
import {Provider} from 'react-redux';
import messaging from "@react-native-firebase/messaging";
import RNCallKeep from 'react-native-callkeep';
import {getToken, updatePoltergeistUser, getRandomNumber, getNewUuid, setObjectValue} from "./src/utils";
import {store} from "./src/store/store";
import BackgroundTimer from "react-native-background-timer";

async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    }
}

requestUserPermission();

const options = {
    ios: {
        appName: 'SariskaMediaReactNative',
        imageName: 'sim_icon',
        supportsVideo: false,
        maximumCallGroups: '1',
        maximumCallsPerCallGroup: '1'
    },
    android: {
        alertTitle: 'Permissions Required',
        alertDescription:
            'This application needs to access your phone calling accounts to make calls',
        cancelButton: 'Cancel',
        okButton: 'ok',
        imageName: 'sim_icon',
        foregroundService: {
            channelId: 'com.sariskamediareactnative',
            channelName: 'Foreground service for my app',
            notificationTitle: 'My app is running on background',
            notificationIcon: 'Path to the resource icon of the notification',
        },
    }
};

const isIOS = Platform.OS === 'ios';

try {
    RNCallKeep.setup(options);
    RNCallKeep.setAvailable(true); // Only used for Android, see doc above.
} catch (err) {
    console.error('initializeCallKeep error:', err.message);
}


// for background
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log("background notification received");
    const newUUID = getNewUuid();
    const {sessionId, userId, name, hasVideo, action} = remoteMessage.data;
    let phoneNumber = remoteMessage.data.phoneNumber || getRandomNumber();
    const token = await getToken(sessionId, {id: userId, name});

    if (action === "stop") {
        const userInfo = await getObjectValue("incomingUserInfo");
        RNCallKeep.endCall(userInfo.newUUID);
        return Promise.resolve()
    }

    const params = {
        room: sessionId,
        token,
        newUUID,
        hasVideo,
        phoneNumber,
        user: userId,
        name,
        status: "ringing"
    };

    await updatePoltergeistUser(params);
    if (isIOS && RNCallKeep.checkIfBusy()) {
        params.status = "busy";
        await updatePoltergeistUser(params);
        return Promise.resolve();
    }
    await setObjectValue("incomingUserInfo", params);
    RNCallKeep.displayIncomingCall(newUUID, phoneNumber, name, 'number', hasVideo);
    BackgroundTimer.setTimeout(() => {
        RNCallKeep.backToForeground();
    }, 0);
    return Promise.resolve();
});


const ReduxProvider = () => {
    return (
        <Provider store={store}>
            <App/>
        </Provider>
    )
}

AppRegistry.registerComponent(appName, () => ReduxProvider);
