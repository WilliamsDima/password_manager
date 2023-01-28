import React, { useEffect } from "react"
import MainTemplate from "../../components/templates/Main"
import Layout from "../Layout"
import YandexAds from "react-native-yandex-ads"
import { useAppSelector } from "../../hooks/hooks"
import { useActions } from "../../hooks/useActions"
import { useAuth } from "../../hooks/useAuth"
import { getDataUser } from "../../api/firebase/firebase"

const Main = () => {
	const { pin } = useAppSelector(store => store.main)
	const { setData, setLoading } = useActions()
	const { user } = useAuth()
	const getData = async () => {
		setLoading(true)

		if (user) {
			const data = await getDataUser(user)
			data && setData(data)
			// console.log("getDataUser", data)
		}
		setLoading(false)
	}
	useEffect(() => {
		getData()
		try {
			YandexAds.showInterstitialAd("R-M-2162415-1", "Main")
		} catch (error) {
			console.log("YandexAds", error)
		}
	}, [pin, user])
	return (
		<Layout scroll={false}>
			<MainTemplate />
		</Layout>
	)
}

export default Main
