import React, { useEffect } from "react"
import MainTemplate from "../../components/templates/Main"
import Layout from "../Layout"
import YandexAds from "react-native-yandex-ads"

const Main = () => {
	useEffect(() => {
		try {
			YandexAds.showInterstitialAd("R-M-2162415-1", "Main")
		} catch (error) {
			console.log("YandexAds", error)
		}
	}, [])
	return (
		<Layout scroll={false}>
			<MainTemplate />
		</Layout>
	)
}

export default Main
