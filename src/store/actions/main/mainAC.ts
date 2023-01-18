import { PayloadAction } from "@reduxjs/toolkit"
import { doc, updateDoc, collection } from "firebase/firestore/lite"
import { setLocal } from "../../../api/asyncStorage"
import { updateItemAPI } from "../../../api/firebase/firebase"
import { db } from "../../../config/firebase"
import { USER } from "../../../services/constants"
import { IItem, IUser } from "../../../services/types"
import { IStore } from "../../redusers/main/types"

export type MainActions = {
	setError: (state: IStore, payload: PayloadAction<string | null>) => void
	setUser: (state: IStore, payload: PayloadAction<IUser | null>) => void
	setLoading: (state: IStore, payload: PayloadAction<boolean>) => void
	setPin: (state: IStore, payload: PayloadAction<string | null>) => void
	setKey: (state: IStore, payload: PayloadAction<string>) => void

	setData: (state: IStore, payload: PayloadAction<any>) => void

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
	setKey: (state, { payload }) => {
		state.key = payload
	},

	setData: (state, { payload }) => {
		const user: IUser = {
			displayName: payload.displayName,
			email: payload.email,
			id: payload.id,
		}
		state.user = user
		state.items = payload.items
	},

	setList: (state, { payload }) => {
		state.items = payload
	},
	addItem: (state, { payload }) => {
		state.items.unshift(payload)

		if (state.user) {
			updateItemAPI(state.user, state.items)
		}
	},
	deleteItem: (state, { payload }) => {
		state.items = state.items.filter(item => item.message !== payload)

		if (state.user) {
			updateItemAPI(state.user, state.items)
		}
	},
}
