import React from 'react';
import { createStackNavigator } from 'react-navigation';
import LoginScreen from '../screens/LoginScreen';
import AuthenticationScreen from '../screens/AuthenticationScreen';
import { NewOrderScreen, NewOrderHeaderStyle } from '../screens/NewOrderScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaveFormScreen from '../screens/LeaveFormScreen';
import { PaymentMethodScreen, } from '../screens/PaymentMethodScreen';
import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs';
//import { MapScreen, MapHeaderStyle } from '../screens/MapScreen';
import { TabIcon } from '../vectoricons/TabIcon';
// import OrderRestaurantScreen from '../screens/OrderRestaurantScreen';

const Tabs = createMaterialBottomTabNavigator({

  NewOrder:
  {
    screen: NewOrderScreen,
    navigationOptions: {
      tabBarLabel: 'Orders',
      tabBarIcon: ({ focused, tintColor }) => (
        <TabIcon
          iconDefault='ios-analytics-outline'
          iconFocused='ios-analytics'
          focused={focused}
          tintColor={tintColor}
          size={25}
        />
      ),
      tabBarColor: "#6518f4",
      activeTintColor: '#fff',
    }
  },
  History: {
    screen: HistoryScreen,
    navigationOptions: {
      tabBarLabel: 'History',
      tabBarIcon: ({ focused, tintColor }) => (
        <TabIcon
          iconDefault='ios-list-box-outline'
          iconFocused='ios-list-box'
          focused={focused}
          tintColor={tintColor}
          size={25}
        />
      ),
      tabBarColor: "#d02760",
      activeTintColor: '#fff',
    }
  },
  Profile: {
    screen: ProfileScreen,
    navigationOptions: {
      tabBarLabel: 'Profile',
      backBehavior: 'none',
      tabBarIcon: ({ focused, tintColor }) => (
        <TabIcon
          iconDefault='ios-contact-outline'
          iconFocused='ios-contact'
          focused={focused}
          tintColor={tintColor}
          size={25} size={25}
        />
      ),
      tabBarColor: "#cd1212",
      activeTintColor: '#fff',
    }
  },
}, {
    initialRouteName: 'NewOrder',
    tabBarPosition: 'bottom',
    swipeEnabled: 'true',
    animationEnabled: true,
    activeTintColor: '#fff',
    inactiveTintColor: '#e2e0e0',
    showIcon: 'true',
    barStyle: { backgroundColor: '#0000e5', height: 60, paddingBottom: 0, margin: 0 },
    labeled: true,
    // tabStyle: {margin: 0, padding: 0, height: 60},
    navigationOptions:
    {
    },

  }
);


export const RootStack = createStackNavigator(
  {
    Authentication:
    {
      screen: AuthenticationScreen,
      navigationOptions: {
        header: null,
      }
    },

    Login: {
      screen: LoginScreen,
      navigationOptions: {
        header: null,
      }
    },
    LeaveForm: {
      screen: LeaveFormScreen,
      navigationOptions: {
        header: null,
      }
    },
    Tabs: {
      screen: Tabs,
      navigationOptions: {
        headerLeft: null,
        headerTitle: NewOrderHeaderStyle,
        headerStyle: {
          backgroundColor: '#fff',
        },
      }
    },
    // OrderRestaurant: {
    //   screen: OrderRestaurantScreen,
    //   navigationOptions: {
    //     header: null
    //   }
    // },
    PaymentMethod: {
      screen: PaymentMethodScreen,
      navigationOptions: {
        header: null,
      }
    },
    // Maps: {
    //   screen: MapScreen,
    //   navigationOptions: {
    //     header: null
    //   }
    // }

  },
  {
    initialRouteName: 'Authentication',
  }
);

export default RootStack;
