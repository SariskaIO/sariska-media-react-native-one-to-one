import {ADD_CONFERENCE} from "../actions/types";

const initialState = null;

export const conference = (state = initialState, action) => {
    switch (action.type) {
        case ADD_CONFERENCE:
            state = action.payload;
            return state;
        default:
            return state;
    }
}

