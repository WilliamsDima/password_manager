import React, { FC, memo } from "react"
import { StyleSheet, FlatList } from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import ListItem from "../../molecules/ListItem"

type TList = {}

const ListAccaunts: FC<TList> = memo(({}) => {
	const { items } = useAppSelector(store => store.main)
	return (
		<FlatList
			data={items}
			renderItem={({ item }) => <ListItem item={item} />}
			keyExtractor={item => item.id.toString()}
		/>
	)
})

export default ListAccaunts

const styles = StyleSheet.create({})
