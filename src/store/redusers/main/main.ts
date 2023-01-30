import { createSlice } from "@reduxjs/toolkit"
import { reducers } from "../../actions/main/mainAC"
import { IStore } from "./types"

const initialState: IStore = {
	message: null,
	user: null,
	loading: false,
	keyGenModal: false,
	pin: null,
	key: "",
	items: [],
	language: "ru_RU",
}

const mainSlice = createSlice({
	name: "main",
	initialState,
	reducers: reducers,
	extraReducers: {},
})

export const mainReducer = (state = initialState, action) => {
	return mainSlice.reducer(state, action)
}

export const mainActions = mainSlice.actions
