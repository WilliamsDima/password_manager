import { createSlice } from "@reduxjs/toolkit"
import { reducers } from "../../actions/main/mainAC"
import { IStore } from "./types"

const initialState: IStore = {
	error: null,
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
