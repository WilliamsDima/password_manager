import { Linking } from "react-native"

import { AppError } from "@/shared/lib/errors"

import type { IUrlOpener } from "./links"

/** `IUrlOpener` on React Native's `Linking`. The address is never logged. */
export class LinkingUrlOpener implements IUrlOpener {
	public readonly open = async (url: string): Promise<void> => {
		try {
			await Linking.openURL(url)
		} catch (error) {
			throw new AppError("unknown", "Cannot open the address", { cause: error })
		}
	}
}
