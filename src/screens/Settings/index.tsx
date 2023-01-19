import React, { FC } from "react"
import SettingsTemplate from "../../components/templates/Settings"
import Layout from "../Layout"

type TSettings = {}

const Settings: FC<TSettings> = () => {
	return (
		<Layout scroll={true}>
			<SettingsTemplate />
		</Layout>
	)
}

export default Settings
