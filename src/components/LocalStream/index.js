import React, {useEffect} from 'react';
import Video from "../Video";
import {FlatList} from 'react-native';
import SariskaMediaTransport from "sariska-media-transport";
import {addLocalTrack} from "../../store/actions/track";
import {useSelector, useDispatch} from 'react-redux'

const LocalStream = (props) => {
    const {hasVideo}  = props;
    const localTracks = useSelector(state => state.localTrack);
    const dispatch = useDispatch();

    useEffect(() => {
        const setupLocalStream = async () => {
            if (hasVideo) {
                const videoTrack = await SariskaMediaTransport.createLocalTracks({devices: ["video"], resolution: "180"});
                const audioTrack = await SariskaMediaTransport.createLocalTracks({devices: ["audio"]});
                dispatch(addLocalTrack(audioTrack[0]));
                dispatch(addLocalTrack(videoTrack[0]));
            } else {
                const audioTrack = await SariskaMediaTransport.createLocalTracks({devices: ["audio"]});
                dispatch(addLocalTrack(audioTrack[0]));
            }
        }
        setupLocalStream();
    }, [hasVideo]);


    const renderItemComponent = ({index, item}) => {
        return item.type === "video" ? <Video track={item}/> : null;
    }

    return (
        <FlatList
            data={localTracks}
            renderItem={item => renderItemComponent(item)}
            keyExtractor={item => item.track.id}
        />
    );
}

export default LocalStream;
