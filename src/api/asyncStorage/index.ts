import AsyncStorage from "@react-native-async-storage/async-storage"
import EncryptedStorage from "react-native-encrypted-storage"

export async function getEncrypted(key: string): Promise<string | undefined> {
	try {
		const res = await EncryptedStorage.getItem(key)
		return res ? JSON.parse(res) : undefined
	} catch (e) {
		console.log("LOCAL Encrypted get ERROR", e)
	}
}

export async function setEncrypted(
	key: string,
	value: any
): Promise<void | undefined> {
	try {
		const serialized = JSON.stringify(value)
		return await EncryptedStorage.setItem(key, serialized)
	} catch (e) {
		console.log("LOCAL Encrypted set ERROR", e)
	}
}

export async function removeEncrypted(key: string): Promise<void | undefined> {
	try {
		return await EncryptedStorage.removeItem(key)
	} catch (error) {
		console.log("LOCAL Encrypted remove ERROR", error)
	}
}

export async function getLocal(key: string): Promise<string | undefined> {
	try {
		const res = await AsyncStorage.getItem(key)
		if (!res) {
			throw new Error(`There is no such key as ${key}`)
		}

		return res ? JSON.parse(res) : undefined
	} catch (e) {
		console.log("LOCAL CLIENT ERROR", e)
	}
}

export async function setLocal(
	key: string,
	value: any
): Promise<void | undefined> {
	try {
		const serialized = JSON.stringify(value)
		return await AsyncStorage.setItem(key, serialized)
	} catch (e) {
		console.log("LOCAL CLIENT ERROR", e)
	}
}

export async function removeLocal(key: string): Promise<void | undefined> {
	try {
		return await AsyncStorage.removeItem(key)
	} catch (e) {
		console.log("LOCAL CLIENT ERROR", e)
	}
}
