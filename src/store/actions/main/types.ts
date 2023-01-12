import { PayloadAction } from "@reduxjs/toolkit"
import { IStore } from "../../redusers/main/types"

export type MainActions = {
	setError: (state: IStore, payload: PayloadAction<string | null>) => void
}

export const mainActions: MainActions = {
	setError: (state, { payload }) => {
		state.error = payload
	},
}
