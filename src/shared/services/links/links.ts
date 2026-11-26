/** Opens an address in the system browser (docs/ARCHITECTURE.md §3: the only adapter for links). */
export type IUrlOpener = {
	/** Rejects when no app can open the address. */
	readonly open: (url: string) => Promise<void>
}
