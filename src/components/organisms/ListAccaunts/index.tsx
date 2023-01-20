import React, { FC, memo } from "react"
import { StyleSheet, FlatList, Image, View, Text } from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import COLORS from "../../../services/colors"
import { IItem } from "../../../services/types"
import Empty from "../../atoms/Empty/inxdex"
import ListItem from "../../molecules/ListItem"

type TList = {
	setFormItem: (value: IItem | boolean) => void
}

const ListAccaunts: FC<TList> = memo(({ setFormItem }) => {
	const { items } = useAppSelector(store => store.main)

	console.log("items", items)

	return (
		<>
			{items.length ? (
				<FlatList
					data={items}
					renderItem={({ item, index }) => (
						<ListItem item={item} index={index} setFormItem={setFormItem} />
					)}
					keyExtractor={item => item.message.toString()}
				/>
			) : (
				<Empty />
			)}
		</>
	)
})

export default ListAccaunts

const styles = StyleSheet.create({})
