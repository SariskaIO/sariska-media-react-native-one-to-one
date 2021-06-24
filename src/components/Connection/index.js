import React, {useEffect} from 'react';
import SariskaMediaTransport from "sariska-media-transport";
import {connectionConfig, initSDKConfig} from "../../constants";
import NetInfo from "@react-native-community/netinfo";
import {setConnection} from "../../store/actions/connection";
import {useDispatch} from "react-redux";

SariskaMediaTransport.init(initSDKConfig);
SariskaMediaTransport.setLogLevel(SariskaMediaTransport.logLevels.ERROR); //TRACE ,DEBUG, INFO, LOG, WARN, ERROR


const Connection = (props) => {
    const {token} = props;
    const dispatch = useDispatch();

    useEffect(() => {
        if (!token) {
            return;
        }
        let connection;
        const onConnectionSuccess = () => {
            dispatch(setConnection(connection));
        }

        const onConnectionFailed = async (error) => {
            console.log("connection failed", error);
        }

        const onConnectionDisconnected = (error) => {
            if (!connection) {
                return;
            }
            connection.removeEventListener(
                SariskaMediaTransport.events.connection.CONNECTION_ESTABLISHED,
                onConnectionSuccess);
            connection.removeEventListener(
                SariskaMediaTransport.events.connection.CONNECTION_FAILED,
                onConnectionFailed);
            connection.removeEventListener(
                SariskaMediaTransport.events.connection.CONNECTION_DISCONNECTED,
                onConnectionDisconnected)
        }
        connection = new SariskaMediaTransport.JitsiConnection(token, connectionConfig);
        connection.addEventListener(SariskaMediaTransport.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
        connection.addEventListener(SariskaMediaTransport.events.connection.CONNECTION_FAILED, onConnectionFailed);
        connection.addEventListener(SariskaMediaTransport.events.connection.CONNECTION_DISCONNECTED, onConnectionDisconnected);
        connection.connect();

        const unsubscribe = NetInfo.addEventListener(state => {
            console.log("Is connected?", state.isConnected);
            SariskaMediaTransport.setNetworkInfo({isOnline: state.isConnected});
        });
        return ()=>{
            unsubscribe();
        }
    }, [token]);

    return null;
}

export default Connection;
