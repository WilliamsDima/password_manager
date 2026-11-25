import React, { FC, memo, useEffect } from "react"
import { StyleSheet, FlatList } from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import { IItem } from "../../../services/types"
import Empty from "../../atoms/Empty/inxdex"
import ListItem from "../../molecules/ListItem"

type TList = {
	setFormItem: (value: IItem | boolean) => void
}

const ListAccaunts: FC<TList> = memo(({ setFormItem }) => {
	const { items } = useAppSelector(store => store.main)

	useEffect(() => {
		// console.log("items", items)
	}, [items])

	return (
		<>
			{items.length ? (
				<FlatList
					data={items}
					renderItem={({ item, index }) => (
						<ListItem item={item} index={index} setFormItem={setFormItem} />
					)}
					keyExtractor={item => item.id.toString()}
				/>
			) : (
				<Empty />
			)}
		</>
	)
})

export default ListAccaunts

const styles = StyleSheet.create({})
