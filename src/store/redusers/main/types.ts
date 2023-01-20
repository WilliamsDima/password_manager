import { IItem, IMessage, IUser } from "../../../services/types"

export interface IStore {
	message: IMessage | null
	user: IUser | null
	loading: boolean
	pin: string | null
	items: IItem[]
	key: string | null
}
