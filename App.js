import React, {useEffect, useState} from 'react';
import {Platform, StyleSheet, TextInput, Text, TouchableOpacity, View} from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import BackgroundTimer from 'react-native-background-timer';
import Connection from "./src/components/Connection";
import Conference from "./src/components/Conference";
import LocalStream from "./src/components/LocalStream";
import RemoteStream from "./src/components/RemoteStream";
import {useDispatch, useSelector} from "react-redux";
import {clear} from "./src/store/actions/call";
import messaging from '@react-native-firebase/messaging';
import InCallManager from 'react-native-incall-manager';
import {call, getAllUsers, registerDevice, setObjectValue, stop} from "./src/utils";
import {
    getToken,
    createPoltergeistUser,
    updatePoltergeistUser,
    getRandomNumber,
    getNewUuid,
    getObjectValue
} from "./src/utils";

BackgroundTimer.start();

const hitSlop = {top: 10, left: 10, right: 10, bottom: 10};
const styles = StyleSheet.create({
    incomingCallContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        justifyContent: 'center',
    },
    incomingCallContainerButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'space-between',
        height: 36,
        marginTop: 20,
        borderRadius: 2,
        marginHorizontal: 5,
    },
    usersController: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 200
    },
    userControllerbutton: {
        color: 'white',
        backgroundColor: 'grey',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'space-between',
        height: 36,
        marginTop: 20,
        borderRadius: 2,
        marginHorizontal: 5,
    },
    container: {
        flex: 1,
        marginTop: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mediaContainer: {},
    button: {
        marginTop: 20,
        marginBottom: 20,
    },
    callButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        width: '100%',
    },
    logContainer: {
        flex: 3,
        width: '100%',
        backgroundColor: '#D9D9D9',
    },
    log: {
        fontSize: 10,
    }
});
const isIOS = Platform.OS === 'ios';


export default function App() {
    const conference = useSelector(state => state.conference);
    const connection = useSelector(state => state.connection);
    const localTracks = useSelector(state => state.localTrack);
    const [status, setStatus] = useState("calling");
    const [sessionId, setSessionId] = useState(null);
    const [hasVideo, setHasVideo] = useState(false);
    const dispatch = useDispatch();
    const [muted, setMuted] = useState(false);
    const [cameraMode, setCameraMode] = useState("front");
    const [audioMode, setAudioMode] = useState("microphone");
    const [callingMode, setCallingMode] = useState("video");
    const [token, setToken] = useState(null);
    const [callAnswered, setCallAnswered] = useState(false);
    const [users, setUsers] = useState([]);
    const [oponentUserId, setOponentUserId] = useState(null);
    const [newIncomingCall, setNewIncomingCall] = useState(false);
    const [isCaller, setIsCaller] = useState(false);
    const [callUUID, setCallUUID] = useState(null);
    const [params, setParams] = useState({});
    const [nameView, setNameView] = useState(true);
    const [deviceToken, setDeviceToken] = useState(null);
    const [name, setName] = useState(null);

    // for forground message firebase
    useEffect(() => {
        fetchUsers();
        messaging().getToken().then(async (token) => {
            setDeviceToken(token);
        });

        messaging().onMessage(async remoteMessage => {
            console.log("forground notification received", remoteMessage);
            if (sessionId) {
                return;
            }
            const {userId, name, hasVideo, action} = remoteMessage.data;
            let phoneNumber = remoteMessage.data.phoneNumber || getRandomNumber();
            if (action === "stop") {
                InCallManager.stopRingtone();
                InCallManager.stop();
                return callUUID ? cleanUp(callUUID) : cleanUp();
            }
            const token = await getToken(remoteMessage.data.sessionId, {id: userId, name});
            const params = {
                room: remoteMessage.data.sessionId,
                token,
                hasVideo,
                phoneNumber,
                user: userId,
                name,
                status: "ringing"
            };
            await updatePoltergeistUser(params);
            setParams(params);
            setNewIncomingCall(true);
            InCallManager.startRingtone('_BUNDLE_'); // or _DEFAULT_ or system filename with extension
        });
    }, []);

    // to fetch all users
    const fetchUsers = async () => {
        const userInfo = await getObjectValue("userInfo");
        if (!userInfo?.userId) {
            return;
        }
        setName(userInfo.name);
        setNameView(false);
        const response = await getAllUsers() || {};
        const users = [];
        for (const [key, value] of Object.entries(response)) {
            if (key !== userInfo.userId) {
                users.push(value);
            }
        }
        setUsers(users);
    }
    // callee side methods from native dialer
    const onAnswerCallAction = async (data) => {
        console.log("on call answered called");
        const {callUUID} = data;
        const {room, user, name, phoneNumber, hasVideo, token} = await getObjectValue("incomingUserInfo");
        console.log('incomingUserInfo', await getObjectValue("incomingUserInfo"));
        setCallAnswered(true);
        setHasVideo(hasVideo);
        setSessionId(room);
        setToken(token);
        setCallUUID(callUUID);
        RNCallKeep.startCall(callUUID, phoneNumber, name);
        await updatePoltergeistUser({
            room,
            token,
            status: "accepted",
            user
        });
        BackgroundTimer.setTimeout(() => {
            RNCallKeep.setCurrentCallActive(callUUID);
        }, 1000);
        if (!isIOS) {
            RNCallKeep.backToForeground();
        }
        setStatus("connected");
    };

    const onEndCallAction = async (data) => {
        console.log("on call end called");
        const {room, user, name, token} = await getObjectValue("incomingUserInfo");
        let {callUUID} = data;
        if (!callAnswered) {
            await updatePoltergeistUser({
                room,
                name,
                token,
                status: "rejected",
                user
            });
        }
        cleanUp(callUUID);
    };
    // from custom dialer
    const answerCall = async () => {
        setNewIncomingCall(false);
        setHasVideo(params.hasVideo);
        setSessionId(params.room);
        setToken(params.token);
        await updatePoltergeistUser({...params, status: "accepted"});
        setStatus("connected");
        InCallManager.stopRingtone();
    }

    const rejectCall = async () => {
        cleanUp();
        setNewIncomingCall(false);
        await updatePoltergeistUser({...params, status: "rejected"});
        InCallManager.stopRingtone();
        InCallManager.stop();
    }


    // caller side methods

    const startCall = async (hasVideo, userId, name, avatar) => {
        if (sessionId || newIncomingCall) {
            console.log("Call has already started");
            return;
        }
        const userInfo = await getObjectValue("userInfo");
        const randomSessionId = Date.now().toString();
        const token = await getToken(randomSessionId, {id: userInfo.userId, name: userInfo?.name});
        setHasVideo(hasVideo);
        setSessionId(randomSessionId);
        setToken(token);
        setOponentUserId(userId);
        setIsCaller(true);
        setStatus("calling");
    };

    const onUserStatusChanged = (id, status) => {
        console.log('id, status', id, status);
        setStatus(status);
        switch (status) {
            case "ringing":
                InCallManager.start({media: 'audio', ringback: '_BUNDLE_'});
                break;
            case "busy":
                InCallManager.stop({busytone: '_DTMF_'}); // or _BUNDLE_ or _DEFAULT_
                break;
            case "rejected":
                InCallManager.stop();
                InCallManager.stopRingback();
                cleanUp();
                break;
            case "connected":
                InCallManager.stop();
                InCallManager.stopRingback();
                setCallAnswered(callAnswered);
                break;
            case "expired":
                InCallManager.stopRingback();
                InCallManager.stopRingback();
                cleanUp();
        }
    };

    // common methods for callee and caller side
    const switchCamera = () => {
        localTracks.forEach(track => {
            if (track.type === "video") {
                track._switchCamera();
                setCameraMode(cameraMode === 'front' ? 'back' : 'front')
            }
        });
    }


    const onToggleMute = (data) => {
        localTracks.forEach(track => {
            if (track.type === "audio") {
                track.isMuted() ? track.unmute() : track.mute();
            }
        });
    };

    const switchVideo = () => {
        localTracks.forEach(track => {
            if (track.getType() === "video") {
                callingMode === "video" ? track.mute() : track.unmute();
            }
        });
        setCallingMode(callingMode === "video" ? "audio" : "video");
    }

    const changeAudioRoute = () => {
        if (isIOS) {
            InCallManager.setForceSpeakerphoneOn(audioMode === 'microphone');
        } else {
            InCallManager.setSpeakerphoneOn(audioMode === 'microphone');
        }
        setAudioMode(audioMode === 'speaker' ? 'microphone' : 'speaker');
    }

    const onUserLeft = (id) => {
        console.log('onUserLeft.....', id);
        callUUID ? cleanUp(callUUID) : cleanUp();
    };

    const onConferenceJoined = async () => {
        if (!isCaller) {
            return;
        }

        await createPoltergeistUser({
            room: sessionId,
            token,
            status,
            user: oponentUserId,
            name: oponentUserId,
            domain: "sariska.io"
        });

        const params = {sessionId, userId: oponentUserId, name: oponentUserId};
        if (hasVideo) {
            params["hasVideo"] = hasVideo;
        }
        await call(params);
    };


    const switchToHomeView = async () => {
        if (name) {
            const randomNumber = getRandomNumber();
            await setObjectValue("userInfo", {userId: randomNumber, name});
            setNameView(false);
            await registerDevice({deviceToken, userId: randomNumber, name});
            await fetchUsers();
        }
    }

    const cleanUp = async (callUUID) => {
        if (callUUID) {
            RNCallKeep.endCall(callUUID);
        }
        if (isCaller) {
            await stop({sessionId, userId: oponentUserId});
        }
        cleanupMediaSession();
        cleanupMessagingSession();
        setSessionId(null);
        setToken(null);
        dispatch(clear());
        setNewIncomingCall(false);
        console.log("calll cleanup !!!!!!!!");
    };

    const cleanupMediaSession = async () => {
        if (conference?.isJoined()) {
            localTracks.forEach(track => async () => {
                await track.dispose()
            });
            await conference.leave();
            await connection.disconnect();
        }
    };

    const cleanupMessagingSession = () => {
    };


    const hangup = async () => {
        InCallManager.stop();
        InCallManager.stopRingback();
        callUUID ? cleanUp(callUUID) : cleanUp();
    };


    useEffect(() => {
        RNCallKeep.addEventListener('answerCall', onAnswerCallAction);
        RNCallKeep.addEventListener('endCall', onEndCallAction);
        RNCallKeep.addEventListener('didPerformSetMutedCallAction', onToggleMute);

        return () => {
            RNCallKeep.removeEventListener('answerCall', onAnswerCallAction);
            RNCallKeep.removeEventListener('endCall', onEndCallAction);
            RNCallKeep.removeEventListener('didPerformSetMutedCallAction', onToggleMute);
        }
    }, []);

    return (
        <View>
            {sessionId && <Text style={{textAlign: 'center'}}>{status}</Text>}
            {nameView ? <View style={{paddingTop: 100, paddingLeft: 100}}>
                <TextInput
                    style={{height: 60}}
                    placeholder="Enter your name"
                    onChangeText={name => setName(name)}
                    defaultValue={name}
                />
                <TouchableOpacity
                    onPress={() => switchToHomeView()}
                    style={styles.button}
                    hitSlop={hitSlop}
                >
                    <Text>Start</Text>
                </TouchableOpacity>
            </View> : <View>
                {newIncomingCall && <View style={styles.incomingCallContainer}>
                    <TouchableOpacity
                        onPress={() => answerCall()}
                        style={styles.incomingCallContainerButton}
                        hitSlop={hitSlop}
                    >
                        <Text>answer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => rejectCall()}
                        style={styles.incomingCallContainerButton}
                        hitSlop={hitSlop}
                    >
                        <Text>decline</Text>
                    </TouchableOpacity>
                </View>}
                {sessionId && <View style={styles.callButtons}>
                    <TouchableOpacity onPress={() => hangup()} style={styles.button}
                                      hitSlop={hitSlop}>
                        <Text>End call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => switchVideo()}
                        style={styles.button}
                        hitSlop={hitSlop}
                    >
                        <Text>{callingMode === "video" ? 'Audio' : 'Video'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => onToggleMute()}
                        style={styles.button}
                        hitSlop={hitSlop}
                    >
                        <Text>{muted ? 'Unmute' : 'Mute'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => switchCamera()}
                        style={styles.button}
                        hitSlop={hitSlop}
                    >
                        <Text>{cameraMode === "front" ? 'Back' : 'Front'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => changeAudioRoute()}
                        style={styles.button}
                        hitSlop={hitSlop}
                    >
                        <Text>{audioMode === 'speaker' ? 'Microphone' : 'Speaker'}</Text>
                    </TouchableOpacity>
                </View>}
                {sessionId && <LocalStream hasVideo={hasVideo}/>}
                {sessionId && <RemoteStream/>}
                <Connection token={token}/>
                <Conference onUserLeft={onUserLeft} conferenceJoined={onConferenceJoined}
                            onUserStatusChanged={onUserStatusChanged}/>
                {users.map(item => <View key={item.userId} style={styles.usersController}>
                    <TouchableOpacity
                        style={styles.userControllerbutton}
                        hitSlop={hitSlop}
                    >
                        <Text>{item.name}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => startCall(true, item.userId, item.name)}
                        style={styles.userControllerbutton}
                        hitSlop={hitSlop}
                    >
                        <Text>Video Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => startCall(false, item.userId, item.name)}
                        style={styles.userControllerbutton}
                        hitSlop={hitSlop}
                    >
                        <Text>Audio Call</Text>
                    </TouchableOpacity>
                </View>)}
            </View>}
        </View>
    );
}
