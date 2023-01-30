import CryptoJS from "crypto-js"

export const DecryptData = (
	messsage: any,
	key: string,
	errorCallback?: () => void
) => {
	try {
		const res = CryptoJS.AES.decrypt(messsage, key).toString(CryptoJS.enc.Utf8)
		return JSON.parse(res.toString(CryptoJS.enc.Utf8))
	} catch (error) {
		console.log("error DecryptData", error)
		errorCallback && errorCallback()
	}
}

export const EncryptData = (
	messsage: any,
	key: string,
	errorCallback?: () => void
) => {
	try {
		return CryptoJS.AES.encrypt(JSON.stringify(messsage), key).toString()
	} catch (error) {
		errorCallback && errorCallback()
		console.log("error EcryptData", error)
	}
}

const dateConverter = i => {
	if (i < 10) {
		return "0" + i
	}
	return i
}

export const getDateDisplay = (d: Date | number | string) => {
	const date = new Date(d)
	const display =
		dateConverter(date.getDate()) +
		"." +
		dateConverter(date.getMonth() + 1) +
		"." +
		date.getFullYear()

	return display
}
