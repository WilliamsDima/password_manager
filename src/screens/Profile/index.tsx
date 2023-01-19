import React, { FC } from "react"
import ProfileTemplate from "../../components/templates/Profile"
import Layout from "../Layout"

type TProfile = {}

const Profile: FC<TProfile> = () => {
	return (
		<Layout scroll={true}>
			<ProfileTemplate />
		</Layout>
	)
}

export default Profile
