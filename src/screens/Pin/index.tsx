import React from "react"
import MyModal from "../../components/organisms/Modal"
import PinTemplate from "../../components/templates/Pin"
import Layout from "../Layout"

const Pin = () => {
	return (
		<Layout scroll={false}>
			<MyModal visible={true} close={() => undefined}>
				<PinTemplate />
			</MyModal>
		</Layout>
	)
}

export default Pin
