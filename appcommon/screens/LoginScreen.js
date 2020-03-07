import React from 'react';
import {
  Button, Dimensions, TouchableOpacity, View, Image, AsyncStorage, ScrollView, Keyboard,
  StyleSheet, Text, TextInput, ActivityIndicator, ToastAndroid, BackHandler
} from 'react-native';
import Display from 'react-native-display';
import Icon from 'react-native-vector-icons/FontAwesome';
import Global from "../Urls/Global";
import firebase from 'react-native-firebase';


const BASEPATH = Global.BASE_PATH;


export default class LoginScreenPage extends React.Component {
  _didFocusSubscription;
  _willBlurSubscription;
  constructor(props) {
    super(props);
    this._didFocusSubscription = props.navigation.addListener('didFocus', payload =>
      BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPressAndroid));
    this.state = {
      number: '', password: '', phone: '', promptmessage: '', dataToPass: '', name: '',
      promptstatus: false,
      loader: false,
      countback: true,
      networkRequest: false,
      change: 0,
    }
  }

  async retrieveItem(key) {
    console.log("LoginScreen retrieveItem() key: ", key);
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

  async storeItem(key, item) {
    console.log("LoginScreen storeItem() key: ", key);
    let jsonItem = null;
    try {
      jsonItem = await AsyncStorage.setItem(key, JSON.stringify(item));
    }
    catch (error) {
      console.log(error.message);
    }
    return jsonItem;
  }

  async removeItem(key) {
    console.log("LoginScreen removeItem() key: ", key);
    try {
      await AsyncStorage.removeItem(key);
      return true;
    }
    catch (exception) {
      return false;
    }
  }

  onBackButtonPressAndroid = () => {
    console.log("LoginScreen onBackButtonPressAndroid() :");
    if (this.state.countback) {
      ToastAndroid.show("Press again to close the app.", ToastAndroid.SHORT);
      this.setState({ countback: false });
      return true;
    }
    else {
      ToastAndroid.show("Closing the app.", ToastAndroid.SHORT);
      this.setState({ countback: true });
      BackHandler.exitApp();
      //return false;
    }
  };

  // registerForPushNotifications = async () => {
  //   console.log("LoginScreen registerForPushNotifications() :");
  //   const { status: existingStatus } = await Permissions.getAsync(
  //     Permissions.NOTIFICATIONS
  //   );
  //   let finalStatus = existingStatus;
  //   if (existingStatus !== 'granted') {
  //     const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
  //     finalStatus = status;
  //   }
  //   if (finalStatus !== 'granted') {
  //     return;
  //   }
  //   global.token = await Notifications.getExpoPushTokenAsync();
  //   //console.log("Fetched Token " + global.token);
  // }

  async checkPermission() {
    console.log("LoginScreen checkPermission()");
    const enabled = await firebase.messaging().hasPermission();
    console.log("Firebase messaging Permission : ", enabled);
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  async requestPermission() {
    console.log("LoginScreen requestPermission() - Firebase messaging");
    try {
      await firebase.messaging().requestPermission();
      // User has authorised
      this.getToken();
    } catch (error) {
      // User has rejected permissions
      console.log('permission rejected');
    }
  }

  async getToken() {
    // let fcmToken = await AsyncStorage.getItem('fcmToken', value);
    // if (!fcmToken) {
    fcmToken = await firebase.messaging().getToken();
    if (fcmToken) {
      console.log("Token generated : ", fcmToken);
      global.token = fcmToken;
      // user has a device token
      //await AsyncStorage.setItem('fcmToken', fcmToken);
    }
    // }
  }

  componentWillMount() {
    console.log("LoginScreen componentWillMount()");
    this._willBlurSubscription = this.props.navigation.addListener('willBlur', payload =>
      BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPressAndroid));
    // this.registerForPushNotifications();
  }
  componentDidMount() {
    this.checkPermission();
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }
  _keyboardDidShow = (event) => {
    console.log("LoginScreen _keyboardDidSchow() :");
    const keyboardHeight = event.endCoordinates.height;
    // this.ScrollView.scrollToEnd({ animated: true });
    console.log("KeyboardHeight : ", keyboardHeight)
    this.setState({ change: keyboardHeight })
  }
  _keyboardDidHide = () => {
    console.log("LoginScreen _keyboardDidHide() :");
    this.setState({ change: 0 })
  }

  login = () => {
    console.log("LoginScreen : login()");
    this.setState({ loader: true, promptmessage: '', promptstatus: false });
    if (this.state.number == '' || this.state.password == '') {
      this.setState({
        promptstatus: true,
        promptmessage: "Please fill all the fields",
      }),
        this.setState({ loader: false });
    }
    else {
      console.log("Checking Validation");
      let formValue = JSON.stringify({
        'username': this.state.number,
        'password': this.state.password,
        'token': global.token,
      });
      console.log(" CHECK_DELIVERY_LOGIN FormValue : ", formValue);
      fetch(BASEPATH + Global.CHECK_DELIVERY_LOGIN,
        {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: formValue
        }).then((response) => response.json()).then((responseData) => {
          console.log("LoginResponse : ", responseData);
          if (responseData.Success == 'Y') {
            this.storeItem('DeliveryData', responseData.DeliveryPerson);
            this.setState({ loader: false })
            this.props.navigation.navigate('Tabs');
          }
          else if (responseData.Success == 'N') {
            this.setState({ loader: false })
            this.setState({
              promptstatus: true,
              promptmessage: responseData.Message,
            })
          }
          else {
            this.setState({ loader: false })
            this.setState({
              promptstatus: true,
              promptmessage: 'Something went wrong, try again.',
            })
          }
        }).catch((error) => {
          console.log('Promise is rejected with error: ' + error);
          this.setState({ networkRequest: true, loader: false })
        });
    }
  };

  changeRequest = () => {
    this.setState({ networkRequest: false })
  }


  render() {
    return (
      <ScrollView contentContainerStyle={[styles.layer1, { marginTop: -this.state.change }]}
        ref={ref => this.ScrollView = ref}
        keyboardShouldPersistTaps={'always'}
      >
        <Display enable={!this.state.networkRequest} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 80, flex: 5 }}>
            <Image source={require('../Icons/smalllogo-white.png')} style={styles.logo} />
            <Text style={styles.bmftext}>BringMyFood RUNNER</Text>
            <Display
              enable={this.state.promptstatus}
              enterDuration={500}
              exitDuration={250}
              exit="fadeOutLeft"
              enter="fadeInLeft"
            >
              <Text style={styles.promptmessage}>
                {this.state.promptmessage}
              </Text>
            </Display>
          </View>
          <View style={styles.loginCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderBottomColor: '#0000e5', borderBottomWidth: 1, paddingBottom: 5 }}>
              <Icon name="user" size={16} color="#0000e5" />
              <TextInput placeholder=" Enter Phone Number " style={styles.phn_num}
                returnKeyType="next"
                keyboardType="numeric"
                onSubmitEditing={() => { this.passwordInput.focus(); }}
                blurOnSubmit={false}
                maxLength={10}
                //autoFocus={true}
                onChangeText={(number) => this.setState({ number })}
                underlineColorAndroid='transparent'
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderBottomColor: '#0000e5', borderBottomWidth: 1, marginTop: 30, paddingBottom: 5 }}>
              <Icon name="key" size={16} color="#0000e5" />
              <TextInput placeholder="Password" style={styles.pass}
                ref={(input) => { this.passwordInput = input; }}
                returnKeyType="go"
                secureTextEntry={true}
                onChangeText={(password) => this.setState({ password })}
                underlineColorAndroid='transparent'
                onSubmitEditing={() => { this.login(); }}
              />
            </View>
          </View>

          <View style={{ flex: 2, flexDirection: 'row', marginTop: 10 }}>
            <View style={{ flexDirection: 'row', flex: 1, paddingLeft: 15, alignItems: 'center', justifyContent: 'flex-start', }}>
              <View style={{ borderWidth: 1, borderRadius: 10, width: 20, height: 20, borderColor: '#0000e5', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#0000e5', borderRadius: 7, width: 15, height: 15, }}></View>
              </View>
              <Text style={{ marginLeft: 6, color: '#5c5c5c', fontWeight: '600', width: 100, fontSize: 17 }}>Remember me</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center', }}>
              <TouchableOpacity disabled={this.state.loader} onPress={() => { this.login() }} style={{ padding: 20, backgroundColor: '#0000e5', borderTopLeftRadius: 50, borderBottomLeftRadius: 50, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Display enable={this.state.loader} style={{ height: 'auto', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color="#fff" />
                </Display>
                <Display enable={!this.state.loader} style={{ height: 'auto', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '500', marginLeft: 15, fontSize: 20 }}>LOGIN</Text>
                </Display>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#bcb8b8' }}>Made in </Text>
            <Icon name={'heart'} color={'#cd2121'} size={12} />
            <Text style={{ fontSize: 12, color: '#bcb8b8' }}> with Food!..</Text>
          </View>
        </Display>
        <Display enable={this.state.networkRequest} style={styles.networkRequest}>
          <Image source={require("../assets/networkerror.png")} resizeMode={"center"} style={{ width: 200, height: 200 }} />
          <Text style={{ marginTop: 3, fontSize: 12, color: '#a39f9f' }}>It seems to be a network error!</Text>
          <TouchableOpacity style={{ backgroundColor: '#000', width: '100%', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 4, marginTop: 5 }} onPress={() => this.changeRequest()}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '400', }}>Retry</Text>
          </TouchableOpacity>
        </Display>

      </ScrollView >
    );
  }
}

const styles = StyleSheet.create({

  layer1:
  {
    flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  layer1_1:
  {
    flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60
  },
  logo:
  {
    width: 100, height: 100,
  },
  bmftext:
  {
    color: '#0000e5', padding: 10, fontSize: 22, fontWeight: '500'
  },
  layer1_2:
  {
    flex: 2, justifyContent: 'center', alignItems: 'center'
  },

  phn_num:
  {
    height: 20, width: 250, marginLeft: 10, letterSpacing: 2
  },
  pass:
  {
    height: 20, width: 250, marginLeft: 10, letterSpacing: 2
  },

  bmftextcpy:
  {
    color: 'red', marginTop: 20, fontSize: 8
  },
  promptmessage: {
    color: '#fff',
    backgroundColor: '#000',
    padding: 5,
    borderRadius: 4,
    marginTop: 2
    ,
  },
  loginCard: {
    backgroundColor: '#fff', marginTop: 10
    , borderRadius: 5, shadowColor: '#000', shadowOpacity: .58, height: 150,
    shadowRadius: 16, elevation: 24, padding: 10,
    shadowOffset: {
      height: 12,
      width: 12
    },
    justifyContent: 'center', alignItems: 'center',
    width: Dimensions.get('window').width - 30
  },
  networkRequest: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});