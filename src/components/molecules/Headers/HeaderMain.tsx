import React, { FC } from 'react'
import { useNavigation } from '@react-navigation/native'
import { View, Text } from 'react-native'

interface IHeaderMain {
  
}

const HeaderMain: FC<IHeaderMain> = (props) => {

  const navigation = useNavigation()

  return (
    <View>
      <Text>Header</Text>
    </View>
  )
}

export default HeaderMain
