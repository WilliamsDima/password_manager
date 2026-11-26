/** Routes of the root stack; a route exists only while its session status holds. */
export type RootStackParamList = {
	SignIn: undefined
	Vault: undefined
	Settings: undefined
	EntryDetails: { entryId: string }
	/** Without `entryId` a new entry is created. */
	EntryEdit: { entryId?: string }
}
