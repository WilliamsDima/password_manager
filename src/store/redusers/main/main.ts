import { createSlice } from "@reduxjs/toolkit"
import { reducers } from "../../actions/main/mainAC"
import { IStore } from "./types"

const DATA = [
	{
		id: "bd7acbea-c1b1-46c2-aed5-3ad53abb28ba",
		title: "1 Item",
	},
	{
		id: "3ac68afc-c605-48d3-a4f8-fbd91aa97f63",
		title: "2 Item",
	},
	{
		id: "58694a0f-3da1-471f-bd96-145571e29d72",
		title: "3 Item",
	},
	{
		id: "bd7acbea-c1b1-246c2-aed5-3ad53abb28ba",
		title: "4 Item",
	},
	{
		id: "3ac68afc-c605-48d35-a4f8-f2bd91aa97f63",
		title: "5 Item",
	},
	{
		id: "58694a0f-33da1-4471f-bd96-145571e29d72",
		title: "6 Item",
	},
	{
		id: "bd7acbea-c1b1-46c2-aed5-33ad53abb28ba",
		title: "7 Item",
	},
	{
		id: "3ac68afc1-c605-48d3-a4f8-fbd791aa97f63",
		title: "8 Item",
	},
	{
		id: "58694a30f-32da1-471f-bd96-145571e29d72",
		title: "9 Item",
	},
	{
		id: "bd7acbea-c14b1-46c2-aed5-3ad53abb28ba",
		title: "10 Item",
	},
	{
		id: "3ac68afc-c2605-48d3-a4f8-fbd91aa97f63",
		title: "11 Item",
	},
	{
		id: "586194a0f-3da1-471f-bd96-145571e29d72",
		title: "12 Item",
	},
]

const initialState: IStore = {
	message: null,
	user: null,
	loading: false,
	pin: null,
	key: "",
	items: [],
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
