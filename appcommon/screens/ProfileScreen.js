import React from 'react';
import {
  Dimensions, TouchableOpacity, View, Image,
  StyleSheet, ScrollView, ListView, Text, TextInput, AsyncStorage, BackHandler, ToastAndroid
} from 'react-native';
class ProfileScreen extends React.Component {

  constructor(props) {
    //var dataObj=[];
    super(props);
    this.state = {
      todayDistance: 'NA',
      dataObj: {},
    }
    console.log(this.state.dataObj);
  }


  showDistance = () => {
    try {
      const value = AsyncStorage.getItem("DistanceTravelled");
      console.log(value);
      if (value != null) {
        var date = new Date().getDate();
        var month = new Date().getMonth() + 1;
        var year = new Date().getFullYear();

        var result = date + ":" + month + ":" + year;

        if (value.Date == result) {
          console.log(value.Date)
          // this.setState({todayDistance:distance})
        }
      }
    }
    catch (error) {
      console.log(error);
    }
  }


  async retrieveItem(key) {
    console.log("NewOrderScreenHeader retrieveItem() key: ", key);
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


  getDeliveryBoyData() {
    console.log("profileScreen getDeliveryBoyData()")
    this.retrieveItem('DeliveryData').then((data) => {
      this.setState({ dataObj: data });
      console.log(data);
    }).catch((error) => {
      console.log('Promise is rejected with error: ' + error);
    });
  }


  componentWillMount() {
    this.getDeliveryBoyData();
    //this.showDistance();
    this.props.navigation.addListener('didFocus', () => { this.showDistance() })
  }

  async removeItem(key) {
    console.log("ProfileScreen removeItem() key: ", key);
    try {
      console.log(await AsyncStorage.removeItem(key));
      this.props.navigation.navigate('Login');
      return true;
    }
    catch (exception) {
      return false;
    }
  }


  Logout = () => {
    this.removeItem("DeliveryData");
    AsyncStorage.clear();
  }


  render() {
    return (
      <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ flex: 4, backgroundColor: '#ebebeb', width: Dimensions.get('window').width, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 90, height: 90, borderRadius: 50, backgroundColor: '#fff', marginTop: -40, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('../Icons/smalllogo-white.png')} style={{ width: 100, height: 100 }} />
          </View>
          <Text style={{ color: '#3d3b3b', marginTop: 10 }}>{this.state.dataObj.Name} - {this.state.dataObj.CityName}</Text>
        </View>
        <View style={styles.floatingview}>
          {/* <View style={{ flex: 3, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10 }}>Total Orders.</Text>
            <Text style={{ color: '#7fdcf4', fontSize: 18 }}>{this.state.dataObj.TotalOrders}</Text>
          </View>
          <View style={{ flex: 3, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10 }}>Distance Covered</Text>
            <Text style={{ color: '#7fdcf4', fontSize: 17 }}>{(global.distance / 1000).toFixed(2)}</Text>
          </View> */}
          <View style={{ flex: 3, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10 }}>Working Since</Text>
            <Text style={{ color: '#7fdcf4', fontSize: 16 }}>{this.state.dataObj.WorkingSince}</Text>
          </View>
        </View>
        <View style={{ flex: 6, backgroundColor: '#fff', width: Dimensions.get('window').width, alignContent: 'center', alignItems: 'center', }}>
          <View style={{ width: 250, height: 220, flexDirection: 'column' }}>
            <View style={{ flex: 1, flexDirection: 'row', marginTop: 60, justifyContent: 'center', alignItems: 'center', }}>
              <View style={{ flex: 2 }}><Image style={{ width: 25, height: 25, padding: 0 }} source={require('../Icons/email.png')} /></View>
              <View style={{ flex: 7, alignItems: 'flex-start' }}><Text>{this.state.dataObj.Email}</Text></View>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
              <View style={{ flex: 2 }}><Image style={{ width: 25, height: 25, padding: 0 }} source={require('../Icons/smartphone.png')} /></View>
              <View style={{ flex: 7 }}><Text>{this.state.dataObj.Phone}</Text></View>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
              <View style={{ flex: 2 }}><Image style={{ width: 25, height: 25, padding: 0 }} source={require('../Icons/add-people.png')} /></View>
              <View style={{ flex: 7 }}><Text>Invite & Earn</Text></View>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
              <View style={{ flex: 2 }}><Image style={{ width: 25, height: 25, padding: 0 }} source={require('../Icons/help-operator.png')} /></View>
              <TouchableOpacity style={{ flex: 7 }} onPress={() => this.props.navigation.navigate('LeaveForm', { userData: this.state.dataObj })}><Text>Apply For Leave</Text></TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={this.Logout}>
            <View style={{ backgroundColor: '#0000e5', borderRadius: 5, marginTop: 15, width: 100, height: 40, padding: 10, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff' }}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  floatingview:
  {
    position: 'absolute',
    top: 150,
    // left: 20,
    // width: 320,
    width: Dimensions.get('window').width - 50,
    height: 100,
    transform: [{ 'translate': [0, 0, 1] }],
    backgroundColor: '#fff', padding: 10, flexDirection: 'row'
    , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
    shadowRadius: 2, elevation: 2
  }
});

export default ProfileScreen;