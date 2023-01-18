import { IItem, IUser } from "../../../services/types"

export interface IStore {
	error: string | null
	user: IUser | null
	loading: boolean
	pin: string | null
	items: IItem[]
	key: string | null
}
