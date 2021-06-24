import React, {useEffect} from 'react';
import SariskaMediaTransport from "sariska-media-transport";
import {useSelector, useDispatch} from 'react-redux'
import {addRemoteTrack, removeRemoteTrack} from "../../store/actions/track";
import {setConference} from "../../store/actions/conference";
import {conferenceConfig} from "../../constants";


const Conference = ({onUserLeft, onUserStatusChanged, conferenceJoined}) => {
    const connection = useSelector(state => state.connection);
    const localTracks = useSelector(state => state.localTrack);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!connection) {
            return;
        }
        const room = connection.initJitsiConference(conferenceConfig);
        room.join();

        const onConferenceJoined = () => {
            dispatch(setConference(room));
            conferenceJoined();
            console.log("localTracks", localTracks.length);
            localTracks.forEach(track=>room.addTrack(track).catch(()=>console.log("track is already added")));
        }

        const onTrackRemoved = (track) => {
            dispatch(removeRemoteTrack(track));
        }

        const onRemoteTrack = (track) => {
            if (!track || track.isLocal()) {
                return;
            }
            dispatch(addRemoteTrack(track));
        }

        room.on(SariskaMediaTransport.events.conference.CONFERENCE_JOINED, onConferenceJoined);
        room.on(SariskaMediaTransport.events.conference.TRACK_ADDED, onRemoteTrack);
        room.on(SariskaMediaTransport.events.conference.TRACK_REMOVED, onTrackRemoved);
        room.on(SariskaMediaTransport.events.conference.USER_LEFT, onUserLeft);
        room.on(SariskaMediaTransport.events.conference.USER_STATUS_CHANGED, onUserStatusChanged);
        return () => {
            room.off(SariskaMediaTransport.events.conference.CONFERENCE_JOINED, onConferenceJoined);
            room.off(SariskaMediaTransport.events.conference.TRACK_ADDED, onRemoteTrack);
            room.off(SariskaMediaTransport.events.conference.TRACK_REMOVED, onTrackRemoved);
            room.off(SariskaMediaTransport.events.conference.USER_LEFT, onUserLeft);
            room.off(SariskaMediaTransport.events.conference.USER_STATUS_CHANGED, onUserStatusChanged);
        }
    }, [connection]);

    return null;
}

export default Conference;
