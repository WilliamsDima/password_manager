import React, { FC, memo } from "react"
import { StyleSheet, FlatList } from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import ListItem from "../../molecules/ListItem"

type TList = {}

const ListAccaunts: FC<TList> = memo(({}) => {
	const { items } = useAppSelector(store => store.main)

	console.log("items", items)

	return (
		<>
			<FlatList
				data={items}
				renderItem={({ item, index }) => <ListItem item={item} index={index} />}
				keyExtractor={item => item.message.toString()}
			/>
		</>
	)
})

export default ListAccaunts

const styles = StyleSheet.create({})
