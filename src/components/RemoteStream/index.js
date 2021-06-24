import React from 'react';
import {FlatList} from 'react-native';
import Video from "../Video";
import {useSelector} from "react-redux";

const RemoteStream = () => {
    const remoteTracks = useSelector(state=>state.remoteTrack);

    const renderItemComponent = ({index, item}) => {
        return item.type ==="video" ? <Video track={item}/> : null;
    }

    return (
        <FlatList
            data={remoteTracks}
            renderItem={item => renderItemComponent(item)}
            keyExtractor={item => item.track.id}
        />
    );
}

export default RemoteStream;
