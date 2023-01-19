import React, { FC } from "react"
import StartTemplate from "../../components/templates/Start"
import Layout from "../Layout"

type TStart = {}

const Start: FC<TStart> = () => {
	return (
		<Layout scroll={true}>
			<StartTemplate />
		</Layout>
	)
}

export default Start
