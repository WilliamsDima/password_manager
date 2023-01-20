import CryptoJS from "crypto-js"
import { IMessage } from "../services/types"

export const DecryptData = (
	messsage: any,
	key: string,
	setMessage?: (value: IMessage) => void
) => {
	try {
		const res = CryptoJS.AES.decrypt(messsage, key).toString(CryptoJS.enc.Utf8)
		return JSON.parse(res.toString(CryptoJS.enc.Utf8))
	} catch (error) {
		console.log("error DecryptData", error)
		setMessage &&
			setMessage({
				title: "Ошибка",
				message:
					"Неизвестная ошибка с ключом доступа, обратитесь в тех поддержку",
			})
	}
}

export const EncryptData = (
	messsage: any,
	key: string,
	setMessage?: (value: IMessage) => void
) => {
	try {
		return CryptoJS.AES.encrypt(JSON.stringify(messsage), key).toString()
	} catch (error) {
		setMessage &&
			setMessage({
				title: "Ошибка",
				message:
					"Неизвестная ошибка с ключом доступа, обратитесь в тех поддержку",
			})
		console.log("error EcryptData", error)
	}
}
