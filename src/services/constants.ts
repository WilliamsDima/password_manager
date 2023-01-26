import { Dimensions, NativeModules, Platform } from "react-native"

const { StatusBarManager } = NativeModules

export const urlAppStore =
	"https://play.google.com/store/apps/details?id=com.eclipse.account_manager"

export const WIDTH = Dimensions.get("window").width
export const HEIGHT = Dimensions.get("window").height
export const SB_HEIGHT = StatusBarManager.HEIGHT
export const IS_IOS = Platform.OS === "ios"

export const USER_PIN = "USER_PIN"
export const START = "START"
export const USER = "USER"
export const LIST = "LIST"
export const KEY = "KEY"
