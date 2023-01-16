import { PayloadAction } from "@reduxjs/toolkit"
import { setLocal } from "../../../api/asyncStorage"
import { USER } from "../../../services/constants"
import { IItem, IUser } from "../../../services/types"
import { IStore } from "../../redusers/main/types"

export type MainActions = {
	setError: (state: IStore, payload: PayloadAction<string | null>) => void
	setUser: (state: IStore, payload: PayloadAction<IUser | null>) => void
	setLoading: (state: IStore, payload: PayloadAction<boolean>) => void
	setPin: (state: IStore, payload: PayloadAction<string | null>) => void

	setList: (state: IStore, payload: PayloadAction<IItem[]>) => void
	addItem: (state: IStore, payload: PayloadAction<IItem>) => void
	deleteItem: (state: IStore, payload: PayloadAction<string>) => void
}

export const reducers: MainActions = {
	setError: (state, { payload }) => {
		state.error = payload
	},
	setUser: (state, { payload }) => {
		setLocal(USER, payload)
		state.user = payload
	},
	setLoading: (state, { payload }) => {
		state.loading = payload
	},
	setPin: (state, { payload }) => {
		state.pin = payload
	},

	setList: (state, { payload }) => {
		state.items = payload
	},
	addItem: (state, { payload }) => {
		state.items.push(payload)
	},
	deleteItem: (state, { payload }) => {
		state.items = state.items.filter(item => item.id !== payload)
	},
}
