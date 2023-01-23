import { PayloadAction } from "@reduxjs/toolkit"
import { doc, updateDoc, collection } from "firebase/firestore/lite"
import { setLocal } from "../../../api/asyncStorage"
import { updateItemAPI } from "../../../api/firebase/firebase"
import { db } from "../../../config/firebase"
import { USER } from "../../../services/constants"
import { IItem, IMessage, IUser } from "../../../services/types"
import { IStore } from "../../redusers/main/types"

export type MainActions = {
	setMessage: (state: IStore, payload: PayloadAction<IMessage | null>) => void
	setUser: (state: IStore, payload: PayloadAction<IUser | null>) => void
	setLoading: (state: IStore, payload: PayloadAction<boolean>) => void
	setPin: (state: IStore, payload: PayloadAction<string | null>) => void
	setKey: (state: IStore, payload: PayloadAction<string>) => void

	setData: (state: IStore, payload: PayloadAction<any>) => void

	setList: (state: IStore, payload: PayloadAction<IItem[]>) => void
	addItem: (state: IStore, payload: PayloadAction<IItem>) => void
	deleteItem: (state: IStore, payload: PayloadAction<number>) => void
	editItem: (state: IStore, payload: PayloadAction<IItem>) => void
}

export const reducers: MainActions = {
	setMessage: (state, { payload }) => {
		state.message = payload
	},
	setUser: (state, { payload }) => {
		if (payload) {
			setLocal(USER, payload)
		}
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
		state.items = state.items.filter(item => item.id !== payload)

		if (state.user) {
			updateItemAPI(state.user, state.items)
		}
	},
	editItem: (state, { payload }) => {
		state.items = state.items.map(item => {
			if (item.id === payload.id) {
				item.title = payload.title
				item.message = payload.message
			}
			return item
		})

		if (state.user) {
			updateItemAPI(state.user, state.items)
		}
	},
}
