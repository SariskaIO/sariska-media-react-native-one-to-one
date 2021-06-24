import {ADD_CONFERENCE} from "./types";

export const setConference = (conference) => {
    return {
        type: ADD_CONFERENCE,
        payload: conference
    }
}
