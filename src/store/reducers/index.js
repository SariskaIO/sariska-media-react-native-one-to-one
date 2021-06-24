import { combineReducers } from "redux";
import { conference } from "./conference";
import { connection } from "./connection";
import { remoteTrack } from "./remoteTrack";
import { localTrack } from "./localTrack";
import { notification } from "./notification";
import {HANGUP} from "../actions/types";

export const appReducer = combineReducers({
    conference,
    connection,
    remoteTrack,
    localTrack,
    notification
});

export const rootReducer = (state, action) => {
    if (action.type === HANGUP) {
        state = {};
    }
    return appReducer(state, action);
}
