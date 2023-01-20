export interface IUser {
	displayName: string
	id: string
	email: string
}

export interface IItemContent {
	id: string
	description: string
	login: string
	password
}

export interface IMessage {
	title: string
	message: string
}

export interface IItem {
	title: string
	message: string
	oldMessage?: string
}
