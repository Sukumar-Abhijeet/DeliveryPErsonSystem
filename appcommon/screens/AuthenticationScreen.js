import React from 'react';
import {
  Dimensions, Platform, PermissionsAndroid, ImageBackground,
  StyleSheet, ScrollView, ListView, Text, TextInput, AppState, AsyncStorage, ActivityIndicator
} from 'react-native';
class AuthenticationScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      appState: 'inactive',
    }
  }

  async retrieveItem(key) {
    console.log("AuthenticationScreen retrieveItem() key: ", key);
    let item = null;
    try {
      const retrievedItem = await AsyncStorage.getItem(key);
      item = JSON.parse(retrievedItem);
    }
    catch (error) {
      console.log(error.message);
    }
    return item;
  }

  async removeItem(key) {
    console.log("AuthenticationScreen removeItem() key: ", key);
    try {
      await AsyncStorage.removeItem(key);
      return true;
    }
    catch (exception) {
      return false;
    }
  }

  checkLogin() {
    console.log("AuthenticationScreen checkLogin() :");
    this.retrieveItem('DeliveryData').then((user) => {
      if (user == null) {
        this.props.navigation.navigate('Login');
      }
      else {
        this.props.navigation.navigate('Tabs');
      }

    }).catch((error) => {
      console.log('Promise is rejected with error: ' + error);
    });
  }

  async accessMultiplePermissions() {
    console.log("Authentication Screen accessmultiplepermissions");
    if (Platform.OS === 'android') {
      console.log("Platform is ANDROID");
      try {
        let granted = {};
        var permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]
        granted = await PermissionsAndroid.requestMultiple(permissions);
        permissionArray = Object.values(granted);
        if (permissionArray[0] == "granted" && permissionArray[1] == "granted") {
          console.log("Working");
          this.checkLogin();
        }
        console.log("permissions object : ", granted);
      } catch (err) {
        console.warn(err)
      }
    }
    if (Platform.OS === 'ios') {
      console.log("Platform is IOS please add permission codes ");
    }
  }

  _handleAppStateChange = (nextAppState) => {
    //console.log("AuthenticationScreen _handleAppStateChange() :", nextAppState, this.state.appState);
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      //console.log("checkLogin()");
      //this.checkLogin();
      this.accessMultiplePermissions();
    }
    this.setState({ appState: nextAppState });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }
  componentDidMount() {
    this.removeItem("AppOrderObj");
    AppState.addEventListener('change', this._handleAppStateChange);
    //this.checkLogin();
  }

  render() {

    return (
      <ImageBackground source={require('../Icons/background.jpg')} style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}>
        <ActivityIndicator size="large" color="#FFF" style={{ height: Dimensions.get('window').height, justifyContent: 'center' }} />
      </ImageBackground>
    );
  }
}

const styles = StyleSheet.create({

});

export default AuthenticationScreen;