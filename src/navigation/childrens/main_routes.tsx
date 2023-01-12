import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { RoutesNames } from '../routes-names'

import Main from '../../screens/Main'
import { screenOptions } from '../routes-config'
import Header from '../../components/organisms/Header'

const MainStack = createStackNavigator()

const MainRoutes = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        ...screenOptions,
        headerTitle: (props) => <Header {...props} />,
      }}
    >
      <MainStack.Screen name={RoutesNames.Main.HomeStack} component={Main} />
    </MainStack.Navigator>
  )
}

export default MainRoutes
