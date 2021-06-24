import {ADD_NOTIFICATION} from "../actions/types";

const initialState = null;

export const notification = (state = initialState, action) => {
    switch (action.type) {
        case ADD_NOTIFICATION:
            console.log("action.payload", action.payload);
            state = action.payload;
            return state;
        default:
            return state;
    }
}

