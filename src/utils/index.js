import {CREATE_POLTERGEIST_CREATE_URL, CREATE_POLTERGEIST_UPDATE_URL, GENERATE_TOKEN_URL} from "../constants";
import uuid from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getToken = async (sessionId, user = {}) => {
    const body = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionId,
            apiKey: "24fd6f92d6d017492e3e98e334ebafc76dd350bb93a0729d38", // enter your API key
            user
        })
    };

    try {
        const response = await fetch(GENERATE_TOKEN_URL, body);
        if (response.ok) {
            const json = await response.json();
            return json.token;
        } else {
            console.log(response.status);
        }
    } catch (error) {
        console.log('error', error);
    }
};


const toQuerySting = (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => searchParams.append(key, params[key]));
    return searchParams.toString();
};


export const createPoltergeistUser = async (params) => {
    try {
        console.log("CREATE_POLTERGEIST_CREATE_URL + '?' + toQuerySting(params)", CREATE_POLTERGEIST_CREATE_URL + '?' + toQuerySting(params));
        const response = await fetch(CREATE_POLTERGEIST_CREATE_URL + '?' + toQuerySting(params));
        if (response.ok) {
            console.log('done');
            console.log(response.status);
        } else {
        }
    } catch (error) {
        console.log('error', error);
    }
}

export const updatePoltergeistUser = async (params) => {
    try {
        const queryParams  =  {...params, domain: "sariska.io"};
        console.log("CREATE_POLTERGEIST_UPDATE_URL + '?' + toQuerySting(params)", CREATE_POLTERGEIST_UPDATE_URL + '?' + toQuerySting(queryParams));
        const response = await fetch(CREATE_POLTERGEIST_UPDATE_URL + '?' + toQuerySting(queryParams));
        if (response.ok) {
            console.log('done');
        } else {
            console.log(response.status);
        }
    } catch (error) {
        console.log('error', error);
    }
}

export const setStringValue = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (e) {
        // save error
    }
    console.log('Done.')
}



export const getStringValue = async (key) => {
    try {
        return await AsyncStorage.getItem(key);
    } catch (e) {
        // save error
    }
    console.log('Done.')
}


export const setObjectValue = async (key, value) => {
    try {
        const jsonValue = JSON.stringify(value)
        await AsyncStorage.setItem(key, jsonValue)
    } catch (e) {
        // save error
    }
    console.log('Done.')
}


export const getObjectValue = async (key) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null
    } catch(e) {
        // read error
    }
    console.log('Done.')
}

export const getAllUsers = async ()=>{
    try {
        const response = await fetch("https://api.sariska.io/api/v1/misc/users");
                console.log("users777777");

        if (response.ok) {
            return await response.json();
        } else {
            console.log(response);
        }
    } catch (error) {
        console.log('error', error);
    }
}

export const registerDevice = async (params)=>{
    try {
        const response = await fetch("https://api.sariska.io/api/v1/misc/register" + '?' + toQuerySting(params));
        if (response.ok) {
            console.log('done');
        } else {
            console.log(response.status);
        }
    } catch (error) {
        console.log('error', error);
    }
}

export const call = async (params)=>{
    try {
        const response = await fetch("https://api.sariska.io/api/v1/misc/call" + '?' + toQuerySting(params));
        if (response.ok) {
            console.log('done');
        } else {
            console.log(response.status);
        }
    } catch (error) {
        console.log('error', error);
    }
}


export const stop = async (params)=>{
    try {
        const response = await fetch("https://api.sariska.io/api/v1/misc/stop" + '?' + toQuerySting(params));
        if (response.ok) {
            console.log('done');
        } else {
            console.log(response.status);
        }
    } catch (error) {
        console.log('error', error);
    }
}



export const getNewUuid = () => uuid.v4().toLowerCase();
export const getRandomNumber = () => String(Math.floor(Math.random() * 100000));
