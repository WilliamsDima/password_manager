// Must stay first: registers the Unistyles themes before any StyleSheet.create runs.
import "@/shared/theme/unistyles"

import { registerRootComponent } from "expo"

import { App } from "@/app"

registerRootComponent(App)
