import React, { useState } from "react"
import MyModal from "../../components/organisms/Modal"
import PinTemplate from "../../components/templates/Pin"
import Layout from "../Layout"

const Pin = () => {
	const [visible, setVisible] = useState(true)
	return (
		<Layout scroll={false}>
			<MyModal visible={visible} close={() => undefined}>
				<PinTemplate setVisible={setVisible} />
			</MyModal>
		</Layout>
	)
}

export default Pin
