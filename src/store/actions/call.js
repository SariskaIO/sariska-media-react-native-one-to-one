import {HANGUP, ADD_NOTIFICATION} from "./types";

export const clear = () => {
    return {
        type: HANGUP
    }
}

export const addNotification = (data)=>{
    return {
        payload: data,
        type: ADD_NOTIFICATION
    }
}
