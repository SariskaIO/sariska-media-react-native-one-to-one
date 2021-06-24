import {
    ADD_LOCAL_TRACK,
    UPDATE_LOCAL_TRACK,
    REMOVE_LOCAL_TRACK
} from "../actions/types";

const initialState = [];

export const localTrack = (state = initialState, action) => {
        switch (action.type) {
            case ADD_LOCAL_TRACK:
                state.push(action.payload);
                return state.slice();
            case UPDATE_LOCAL_TRACK:
                index = state.findIndex(item => item.id === action.payload.id);
                state[index] = action.payload;
                return state.slice();
            case REMOVE_LOCAL_TRACK:
                state = state.filter(item => item.id !== action.payload.id);
                return state.slice();
            default:
                return state;
        }
    }
;
