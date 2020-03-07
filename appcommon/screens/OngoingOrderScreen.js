import React, { Component } from 'react';
import {
  Dimensions, TouchableOpacity, View, Image,
  StyleSheet, ScrollView, ListView, Text, Alert, Switch, FlatList, ActivityIndicator, RefreshControl,
  AsyncStorage
} from 'react-native';
import Display from 'react-native-display';
import Global from "../Urls/Global";

const BASEPATH = Global.BASE_PATH;

export class OngoingOrderScreen extends Component {
  constructor(props) {
    super(props);
    global.tempDistance = 0;
    var ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.state = {
      dataSource: ds.cloneWithRows(['']),
      dataObj: {},
      promptmessage: '',
      ongoingordersstatus: false,
      noongoingorders: false,
      loader: true,
      refreshing: false,
      networkRequest: false,
    }

  }

  // stopDistanceCal = () => {
  //   global.routeCoordinates = [];
  //   global.count--;
  //   console.log("Distance for order :", global.count);
  //   global.tempDistance = global.distance - global.tempDistance;
  //   console.log("Distance = ", global.tempDistance);
  //   global.tempDistance = global.distance;
  //   if (global.count == 0) {
  //     console.log('stop at distance = ', global.distance);
  //     navigator.geolocation.stopObserving();
  //     navigator.geolocation.clearWatch(global.watchID);
  //     global.resetdistance = 0;
  //     global.tempDistance = 0;
  //   }

  // }


  _onRefresh() {
    this.setState({ refreshing: true, networkRequest: false, loader: true });
    fetch(BASEPATH + Global.GET_ONGOING_DELIVERY_ORDERS,
      {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'del-per-id': this.state.dataObj.EmployeeId,
        })
      })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log("on ongoing orders page");
        console.log(responseJson);
        if (responseJson.Success == 'Y') {
          //this.setState({loader:false})
          this.setState({ ongoingordersstatus: true, noongoingorders: false })
          this.setState({ loader: false })
          this.setState({ dataSource: this.state.dataSource.cloneWithRows(responseJson.Data) });
          //  console.log(responseJson);

        }
        else if (responseJson.Success == 'DN') {
          this.setState({ ongoingordersstatus: false, noongoingorders: true })
          this.setState({ loader: false });
        }
        else {
        }
      }).catch((error) => {
        console.log('Promise is rejected with error: ' + error);
        this.setState({ networkRequest: true, loader: false })
      });
    this.setState({ refreshing: false });
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
    this.props.navigation.addListener('didFocus', () => { this._onRefresh() })
  };
  render() {
    return (

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Display enable={this.state.loader} style={{ height: Dimensions.get('window').height - 100, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#CD2121" />
        </Display>


        <Display style={{ flex: 1 }} enable={!this.state.networkRequest}>
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this._onRefresh.bind(this)}
              />
            } >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, color: '#5b5959', marginTop: 15 }}>ONGOING ORDERS </Text>
            </View>

            <Display
              enable={this.state.ongoingordersstatus}
              enterDuration={500}
              exitDuration={250}
              exit="fadeOutLeft"
              enter="fadeInLeft"
            >
              <ListView
                style={{ flex: 1, flexDirection: 'row' }}
                dataSource={this.state.dataSource} renderRow={(data) =>
                  <View style={{
                    width: Dimensions.get('window').width - 20, marginTop: 10, backgroundColor: '#fff', flexDirection: 'row'
                    , marginLeft: 2, borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
                    shadowRadius: 2, elevation: 2, padding: 15
                  }}>
                    <View style={{ flex: 3, flexDirection: 'column' }}>
                      <Text style={{ fontSize: 16, color: '#bcbaba' }}>#{data.OrderId}</Text>
                      <Text style={{ fontSize: 16, color: '#bcbaba' }}>Delivery Address</Text>
                      <Text style={{ fontSize: 12, color: '#7e7f82' }}>{data.DeliveryAddress}</Text>
                    </View>
                    <View style={{ flex: 3, flexDirection: 'column' }}>
                      <View style={{ flex: 3 }}>
                        <Text style={{ color: '#bcbaba', fontSize: 14, marginRight: 3 }}>TIME LEFT:{data.TimeLeft}</Text>
                      </View>
                      <TouchableOpacity onPress={() => this.props.navigation.navigate('OrderList', { orderStatus: data.OrderStatus, orderId: data.OrderId, employeeId: this.state.dataObj })}>
                        <View style={{ backgroundColor: '#cd2121', alignItems: 'center', justifyContent: 'center', height: 30 }}>
                          <Text style={{ color: '#fff', fontSize: 14, marginRight: 3 }}>{data.OrderStatus}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                }
              />
            </Display>
            <Display
              enable={this.state.noongoingorders}
              enterDuration={500}
              exitDuration={250}
              exit="fadeOutLeft"
              enter="fadeInLeft"
            >
              <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, marginTop: 160 }}>
                <Image style={{ width: 120, height: 120, padding: 0 }} source={require('../Icons/no-orders-accept.png')} />
                <Text style={{ fontSize: 10, color: '#5b5959', marginTop: 5 }}>All Caught Up No Ongoing  Orders - Pull To Refresh </Text>
              </View>
            </Display>
          </ScrollView>
        </Display>
        <Display enable={this.state.networkRequest} style={styles.networkRequest}>
          <Image source={require("../assets/networkerror.png")} resizeMode={"center"} style={{ width: 200, height: 200 }} />
          <Text style={{ marginTop: 3, fontSize: 12, color: '#a39f9f' }}>It seems to be a network error!</Text>
          <TouchableOpacity style={{ backgroundColor: '#000', width: '100%', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 4, marginTop: 5 }} onPress={() => this._onRefresh()}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '400', }}>Retry</Text>
          </TouchableOpacity>
        </Display>
      </View>
    );
  }
}
export class OngoingOrderHeaderStyle extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
        <Text style={{ color: '#fff', marginRight: 6, fontSize: 18 }}>Status</Text>
        <Switch />
      </View>
    );
  }
}

export default OngoingOrderScreen;
const styles = StyleSheet.create({
  listcontainer: {
    width: Dimensions.get('window').width - 10, backgroundColor: '#fff', flexDirection: 'row', marginTop: 10, marginLeft: 5
    , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2, padding: 10,
    shadowRadius: 2, elevation: 2,
  },
  promptmessage: {
    color: '#fff',
    backgroundColor: '#000',
    padding: 5,
    borderRadius: 4,
    marginTop: 2
    ,
  },
  networkRequest: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});