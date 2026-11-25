export interface IUser {
	dateCreate: number
	displayName: string
	id: string
	email: string
}

export interface IItemContent {
	description: string
	login: string
	password
}

export interface IMessage {
	title: string
	message: string
	callback?: () => void
	cansel?: () => void
}

export interface IItem {
	id: number
	title: string
	message: string
}
