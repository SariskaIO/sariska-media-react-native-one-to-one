import {ADD_CONNECTION} from "./types";

export const setConnection = (connection) => {
    return {
        type: ADD_CONNECTION,
        payload: connection
    }
}
