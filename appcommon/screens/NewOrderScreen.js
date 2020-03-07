import React, { Component } from 'react';
import {
  Dimensions, TouchableOpacity, View, Image, Platform, Alert,
  StyleSheet, ScrollView, ListView, Vibration, Text, BackHandler, Switch, ActivityIndicator, RefreshControl, ToastAndroid, AsyncStorage
} from 'react-native';
import Display from 'react-native-display';
import haversine from 'haversine';
import Global from "../Urls/Global";
const BASEPATH = Global.BASE_PATH;
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";

const PATTERN = [1000, 2000, 3000]


export class NewOrderScreen extends Component {
  _didFocusSubscription;
  _willBlurSubscription;

  constructor(props) {
    super(props);
    global.count = 0;
    global.routeCoordinates = [],
      this._didFocusSubscription = props.navigation.addListener('didFocus', payload =>
        BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
      );
    global.orderCount = 0;
    var ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.state = {
      notification: {},
      dataSource: ds.cloneWithRows(['']),
      ongoingOrderSource: [],
      dataObj: {},
      promptmessage: '',
      NumberofOrders: '',
      acceptneworders: false,
      noneworders: false,
      newOrder: [],
      loader: true,
      loader2: false,
      refreshing: false,
      countback: true,
      count: 0,
      networkRequest: false,
      ongoingordersstatus: false,
      noongoingorders: false,
      appOrderObj: {
        ongoingObj: {
          OrderId: "",
          distance: 0,
          distanceRoute: []
        },
        orderQueue: []
      },

      latitude: 20.3011504,
      longitude: 85.6803644,
      routeCoordinates: [],
      distanceTravelled: 0,
      prevLatLng: {

      },
    }
    global.ringing = false;
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

  async storeItem(key, item) {
    console.log("NewOrderScreen storeItem() key: ", key);
    let jsonItem = null;
    try {
      jsonItem = await AsyncStorage.setItem(key, JSON.stringify(item));
    }
    catch (error) {
      console.log(error.message);
    }
    return jsonItem;
  }

  acceptnewOrder(Oid) {
    console.log("NewOrderScreen acceptnewOrder():");
    if (global.duty == "YES") {
      if (global.gpsworking == true) {
        this.setState({ loader2: true });
        navigator.geolocation.getCurrentPosition((position) => {
          const formValue = JSON.stringify({
            'del-per-id': this.state.dataObj.EmployeeId,
            'order-id': Oid,
            'order-acceptance': "YES",
          });
          console.log("SET_DELIVERY_ORDER_ACCEPTANCE formValue ", formValue);
          fetch(BASEPATH + Global.SET_DELIVERY_ORDER_ACCEPTANCE,
            {
              method: "POST",
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: formValue,
            })
            .then((response) => response.json())
            .then((responseJson) => {
              if (responseJson.Success == 'Y') {
                let appOrderObj = this.state.appOrderObj;
                if (appOrderObj.ongoingObj.OrderId != "") {
                  appOrderObj.orderQueue.push(Oid);
                  this.setState({ appOrderObj: appOrderObj }, () => {
                    this.storeItem("AppOrderObj", appOrderObj);
                  });
                }
                else {
                  let ongoingObj = {
                    OrderId: Oid,
                    distance: 0,
                    distanceRoute: []
                  };
                  appOrderObj.ongoingObj = ongoingObj;
                  appOrderObj.orderQueue.push(Oid);
                  this.setState({ appOrderObj: appOrderObj }, () => { this.storeItem("AppOrderObj", appOrderObj); this.checkStartPoint(); });
                }
                // global.orderCount++;
                if (global.ringing) {
                  this.activateSoundAndVibrations("stop");
                }
                this._onRefresh(this);
              }
              else {
                this.setState({ loader2: false })
                ToastAndroid.show(responseJson.Message, ToastAndroid.SHORT, ToastAndroid.CENTER);
              }
            }).catch((error) => {
              console.log('Promise is rejected with error: ' + error);
              this.setState({ networkRequest: true, loader: false, loader2: false })
            });

        }, (error) => {
          console.log("Error for GPS  ", error.message);
          this.setState({ loader2: false }),
            ToastAndroid.show("Please turn your gps on", ToastAndroid.LONG);
          alert("Turn Your GPS ON");
        },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
        );
      } else {
        alert("Turn Your GPS ON");
      }
    } else {
      console.log("OnDuty Status ", this.state.dataObj.OnDuty);
      alert("Please turn on your duty ");
    }
  };

  // audiocreate = async () => {
  //   const soundObject = new Audio.Sound();
  //   try {
  //     console.log("Creating Audio Object");
  //     await soundObject.loadAsync(require('../audio/tone.mp3'));
  //     this.audioPlayer1 = soundObject;
  //     this.audioPlayer1.setIsLoopingAsync(true)
  //     this.audioPlayer1.setVolumeAsync(1);
  //     this.audioPlayer1.setPositionAsync(0);
  //     this.audioPlayer1.setRateAsync(1, true);
  //     global.ringing = true;
  //   } catch (error) {
  //     // An error occurred!
  //     console.warn(error)
  //   }
  // };

  activateSoundAndVibrations = (result) => {
    console.log('NewOrderScreen activateSoundAndVibrations :', result)
    if (result == 'allow') {
      this.playSound('start')
      Vibration.vibrate(PATTERN, true)

    }
    if (result == 'stop') {
      Vibration.cancel();
      this.playSound('stop')
    }
  };

  calcDistance = (newLatLng) => {
    console.log("calcDistance()");
    // let stringformat = JSON.stringify(global.routeCoordinates);
    // let lat = stringformat.replace(/latitude/g, "lat");
    // let lng = lat.replace(/longitude/g, "lng");
    // console.log("String", lng);
    //console.log("Stringify ", JSON.stringify(global.routeCoordinates).replace("latitude", "lat").replace("longitude", "lng"));
    const { prevLatLng } = this.state;
    console.log("PreviousLAtLng", prevLatLng);
    console.log("NewLatLng", newLatLng);
    return haversine(prevLatLng, newLatLng, { unit: 'meter' }) || 0;

  };

  checkPosition = (calledby) => {
    console.log("NewOrderScreen  : CheckPosition()");
    global.watchID = navigator.geolocation.watchPosition(
      position => {
        console.log("PositionChanging CalledBy,", calledby);
        const { coordinate, distanceTravelled } = this.state;
        //const routeCoordinates = this.state.routeCoordinates;
        const { latitude, longitude } = position.coords;
        let appOrderObj = this.state.appOrderObj;
        const newCoordinate =
        {
          latitude,
          longitude
        };
        console.log("New Coordinate", newCoordinate);
        // if (Platform.OS === "android") {
        //   if (this.marker) {
        //     this.marker._component.animateMarkerToCoordinate(
        //       newCoordinate,
        //       500
        //     );
        //   }
        // } else {
        //   coordinate.timing(newCoordinate).start();
        // }
        // global.routeCoordinates = routeCoordinates.concat([newCoordinate]);
        let minDist = this.calcDistance(newCoordinate);
        if (minDist > 5) {
          appOrderObj.ongoingObj.distance += minDist;
          appOrderObj.ongoingObj.distanceRoute.push(newCoordinate);
          this.setState({
            latitude,
            longitude,
            appOrderObj: appOrderObj,
            //routeCoordinates: routeCoordinates.concat([newCoordinate]),
            // distanceTravelled:
            //   distanceTravelled + this.calcDistance(newCoordinate),
            prevLatLng: newCoordinate
          }, () => {
            //global.distance = this.state.distanceTravelled; 
            this.storeItem("AppOrderObj", appOrderObj)
            ToastAndroid.show("Distance Travelled " + this.state.appOrderObj.ongoingObj.distance, ToastAndroid.LONG);
          });
        }
        //  console.log(this.calcDistance(newCoordinate),"meter")
        //console.log("Total Distance Travelled:", this.state.appOrderObj.ongoingObj.distance)
      },
      error => console.log(error),
      { enableHighAccuracy: true, timeInterval: 1000, distanceFilter: 1 }

    );
  };

  checkStartPoint = () => {
    console.log("NewOrderScreen checkStartPoint :");
    if (global.gpsworking == true) {
      console.log("NewORderScreen checkStartPoint()");
      navigator.geolocation.getCurrentPosition((position) => {
        var position = position.coords;
        console.log("Position: ", position);
        this.setState({
          prevLatLng: {
            latitude: position.latitude,
            longitude: position.longitude,
          },
        });
        this.checkPosition("willMound");
      },
        (error) => alert("Error: " + error.message),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    }
    else {
      Alert.alert("Please Turn Your GPS On");
      // IntentLauncherAndroid.startActivityAsync(
      //   IntentLauncherAndroid.ACTION_LOCATION_SOURCE_SETTINGS
      // );
    }
  };

  // _getLocationAsync = async () => {
  //   console.log("NewOrderScreen _getLocationAsync() :");
  //   // let gpsstatus = await Location.getProviderStatusAsync();
  //   // console.log("GPSStatus ", gpsstatus.locationServicesEnabled);
  //   global.gpsworking;
  //   // if (gpsstatus.locationServicesEnabled == false) {
  //   //   global.gpsworking = false;
  //   //   Alert.alert("Please Turn Your GPS On");
  //   //   // IntentLauncherAndroid.startActivityAsync(
  //   //   //   IntentLauncherAndroid.ACTION_LOCATION_SOURCE_SETTINGS
  //   //   // );
  //   // }
  //   // else {
  //   //   global.gpsworking = true;
  //   // }
  //   return global.gpsworking;
  // };

  getDeliveryBoyData() {
    console.log("NewOrderScreen getDeliveryBoyData()");
    this.retrieveItem('DeliveryData').then((data) => {
      this.setState({ dataObj: data });
    }).catch((error) => {
      console.log('Promise is rejected with error: ' + error);
    });
  };

  _handleNotification = (notification) => {
    this.setState({ notification: notification });
    this._onRefresh(this);
    // this.activateSoundAndVibrations('allow');
    console.log("Notification Recieved", notification);
  };

  onBackButtonPressAndroid = () => {
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

  _ongoingOrderRefresh() {
    console.log("NewOrderScreen ongoingOrderRefresh()");
    this.setState({ refreshing: true, networkRequest: false, loader: true });
    const formValue = JSON.stringify({
      'del-per-id': this.state.dataObj.EmployeeId,
    });
    console.log("GET_ONGOING_DELIVERY_ORDERS formValue :", formValue);
    fetch(BASEPATH + Global.GET_ONGOING_DELIVERY_ORDERS,
      {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: formValue
      })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log("GET_ONGOING_DELIVERY_ORDERS response", responseJson);
        if (responseJson.Success == 'Y') {
          this.setState({ ongoingordersstatus: true, noongoingorders: false })
          this.setState({ loader: false })
          this.setState({ ongoingOrderSource: responseJson.Data });
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
  };

  getAppOrderObj = () => {
    console.log("getAppOrderObj()");
    this.retrieveItem('AppOrderObj').then((data) => {
      if (data != null) {
        this.setState({ appOrderObj: data });
      }
    }).catch((error) => {
      console.log('Promise is rejected with error: ' + error);
    });
  }

  startDistanceTrack = () => {
    console.log("startDistanceTrack()");
    let appOrderObj = this.state.appOrderObj;
    if (this.state.ongoingOrderSource.length > 0) {
      let ongoing = false;
      for (let i = 0; i < this.state.ongoingOrderSource.length; i++) {
        let flag = false;
        for (let j = 0; j < appOrderObj.orderQueue.length; j++) {
          if (this.state.ongoingOrderSource[i].OrderId == appOrderObj.orderQueue[j]) {
            flag = true;
            break;
          }
        }
        if (flag) {
          ongoing = true;
          break;
        }
      }
      if (ongoing) {
        this.checkStartPoint();
      }
      else {
        if (appOrderObj.orderQueue.length > 0) {
          let idx = appOrderObj.orderQueue.indexOf(appOrderObj.ongoingObj.OrderId);
          appOrderObj.orderQueue.splice(idx, 1);
          appOrderObj.ongoingObj.OrderId = "";
          appOrderObj.ongoingObj.distance = 0;
          appOrderObj.ongoingObj.distanceRoute = [];
          if (appOrderObj.orderQueue.length > 0) {
            appOrderObj.ongoingObj.OrderId = appOrderObj.orderQueue[0];
            ToastAndroid.show("Next Order to be delivered: " + appOrderObj.ongoingObj.OrderId, ToastAndroid.LONG);
          }
          this.setState({ appOrderObj: appOrderObj }, () => {
            this.storeItem("AppOrderObj", appOrderObj);
            this.startDistanceTrack();
          });
        }
      }
    }
  }

  _onRefresh() {
    console.log("NewOrderScreen onRefresh()");
    //console.log("Gps Status :", global.gpsworking);
    if (global.gpsworking == false) {
      // this._getLocationAsync();
    }
    else {
      this.setState({ refreshing: true });
      const formValue = JSON.stringify({
        'del-per-id': this.state.dataObj.EmployeeId,
      });
      console.log("GET_DELIVERY_ORDER_NOTIFICATION formValue ", formValue)
      fetch(BASEPATH + Global.GET_DELIVERY_ORDER_NOTIFICATION,
        {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: formValue
        })
        .then((response) => response.json())
        .then((responseJson) => {
          console.log("GET_DELIVERY_ORDER_NOTIFICATION response:", responseJson);
          this.setState({ NumberofOrders: responseJson.OngoingOrders })
          if (responseJson.Success == 'Y') {
            this.activateSoundAndVibrations('allow');
            this.setState({ acceptneworders: true })
            if (!responseJson.Data.length) {
              console.log("No new Orders");
              this.setState({ noneworders: true })
            } else {
              this.setState({ noneworders: false })
            }
            this.setState({ loader: false })
            this.setState({ loader2: false })
            this.setState({ newOrder: responseJson.Data });
          }
          else {
            if (global.ringing) {
              this.activateSoundAndVibrations("stop");
            }
            this.setState({ loader2: false })
            this.setState({ loader: false })
            this.setState({ acceptneworders: false })
            this.setState({ noneworders: true })
          }
        }).catch((error) => {
          console.log('Promise is rejected with error: ' + error);
          this.setState({ networkRequest: true, loader: false, loader2: false })
        });
      this.setState({ refreshing: false });
      this._ongoingOrderRefresh();
    }
  };

  playSound = async (value) => {
    console.log("Working", value)
    if (value == 'start') {
      this.audioPlayer1.playAsync();
      global.ringing = true;
    }
    if (value == 'stop') {
      this.audioPlayer1.stopAsync();
      global.ringing = false;
    }

  };

  // registerForPushNotificationsAsync = async () => {
  //   console.log("NewOrderScreen registerForPushNotificationsAsync()");
  //   const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  //   let finalStatus = status;
  //   if (status !== 'granted') {
  //     const { status } = await Permissions.askAsync(Permissions.REMOTE_NOTIFICATIONS);
  //     finalStatus = status;
  //   }
  //   if (finalStatus !== 'granted') {
  //     return;
  //   }

  // };

  showOrderDetails = (data) => {
    console.log("NewOrderScreen showORderDetails()");
    this.props.navigation.navigate('OrderRestaurant', { orderStatus: data.OrderStatus, orderId: data.OrderId, deliveryData: this.state.dataObj });
  };

  componentDidMount() {
    console.log("New Order Screen : DidMount()");
    // this._getLocationAsync();
    // this.registerForPushNotificationsAsync();
    // this._notificationSubscription = Notifications.addListener(this._handleNotification);
  };

  componentWillMount() {
    console.log("NewORderScreen : ComponentWillMount()");
    // this.audiocreate();
    this.getDeliveryBoyData();
    this.props.navigation.addListener('didFocus', () => { this.getAppOrderObj(); this._onRefresh(); })
    this._willBlurSubscription = this.props.navigation.addListener('willBlur', payload =>
      BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
    );
  };

  render() {
    return (
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <Display enable={!this.state.networkRequest} style={{ flex: 8, flexDirection: 'column' }}>
          <Display enable={this.state.loader} style={{ height: Dimensions.get('window').height, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#CD2121" />
          </Display>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this._onRefresh.bind(this)}
              />
            } >

            <Display
              enable={this.state.acceptneworders}
              enterDuration={500}
              exitDuration={250}
              exit="fadeOutDown"
              enter="fadeInUp"
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <View style={{ width: '100%', padding: 10 }}>
                <Text style={{ fontSize: 22, fontWeight: '600', color: '#7f7c7c' }}>New Orders :</Text>
              </View>
              {this.state.newOrder.map((item, index) => (
                <View key={index} style={{
                  width: Dimensions.get('window').width - 20, marginTop: 5, backgroundColor: '#fff', flexDirection: 'column'
                  , marginLeft: 2, height: 200, borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
                  shadowRadius: 2, elevation: 2, padding: 15
                }}>
                  <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                    <View style={{ flex: 2, justifyContent: 'center' }}>
                      <Image style={{ width: 30, height: 30, padding: 0, marginRight: 3 }} source={require('../Icons/info.png')} />
                    </View>
                    <View style={{ flex: 5, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20, color: '#cd2121', fontWeight: 'bold' }}>New Order</Text>
                    </View>
                    <View style={{ flex: 4, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20, color: '#cd2121', fontWeight: 'bold' }}>#{item.OrderId}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 6, flexDirection: 'row', padding: 10 }}>

                    <View style={{ flex: 5, flexDirection: 'column' }}>
                      <Text style={{ fontSize: 16, color: '#7e7f82' }}>Delivery Address</Text>
                      <Text style={{ fontSize: 12, color: '#bcbaba' }}>{item.DeliveryAddress}</Text>
                    </View>
                    <View style={{ flex: 4, flexDirection: 'column' }}>
                      <Text style={{ fontSize: 16, color: '#7e7f82' }}>Resturants</Text>
                      {item.RestaurantNames.map((item, index) => (
                        <Text key={index} style={{ fontSize: 12, color: '#bcbaba' }}>{item}</Text>
                      ))}
                    </View>
                  </View>
                  {/* item.OrderId */}
                  <TouchableOpacity onPress={this.acceptnewOrder.bind(this, item.OrderId)}>
                    <View style={{ backgroundColor: '#cd2121', height: 40, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}>
                      <Display enable={this.state.loader2} style={{ marginTop: 30, height: Dimensions.get('window').height, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#fff" />
                      </Display>
                      <Text style={{ fontSize: 18, color: '#fff', fontWeight: '500', width: 60 }}>Accept</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </Display>
            <Display
              enable={this.state.noneworders && !this.state.ongoingordersstatus}
              enterDuration={500}
              exitDuration={250}
              exit="fadeOutDown"
              enter="fadeInUp"
            >
              <View style={{ width: '100%', padding: 10 }}>
                <Text style={{ fontSize: 22, fontWeight: '600', color: '#7f7c7c' }}>New Orders :</Text>
              </View>

              <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, marginTop: 100 }}>
                <Image style={{ width: 120, height: 120, padding: 0 }} source={require('../Icons/no-orders-accept.png')} />
                <Text style={{ fontSize: 10, color: '#5b5959', marginTop: 5 }}>No Active Orders - Pull To Refresh </Text>
              </View>
              {/* <View style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Text style={{ fontSize: 15, color: '#5b5959', marginTop: 15 }}> NUMBER OF ONGOING ORDERS :{this.state.NumberofOrders}</Text>
              </View> */}
            </Display>

            {/* ONGOING - ORDERS */}

            <Display
              enable={this.state.ongoingordersstatus}
              enterDuration={500}
              exitDuration={250}
              exit="fadeOutLeft"
              enter="fadeInLeft"
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <View style={{ width: '100%', padding: 10 }}>
                <Text style={{ fontSize: 22, fontWeight: '600', color: '#7f7c7c' }}>Ongoing Orders :</Text>
              </View>
              {this.state.ongoingOrderSource.map((data, index) => (
                <TouchableOpacity
                  onPress={this.showOrderDetails.bind(this, data)}
                  key={index} style={{
                    width: Dimensions.get('window').width - 20, marginTop: 10, backgroundColor: '#fff', flexDirection: 'row'
                    , marginLeft: 2, borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
                    shadowRadius: 2, elevation: 2, padding: 15
                  }}>
                  <View style={{ flex: 3, flexDirection: 'column' }}>
                    <View style={{ backgroundColor: '#2dbe60', padding: 5, borderTopRightRadius: 20, borderBottomRightRadius: 20, width: '90%', }}>
                      <Text style={{ fontSize: 16, color: '#fff' }}>{data.OrderStatus}</Text>
                    </View>
                    <Text style={{ fontSize: 16, color: '#bcbaba' }}>Delivery Address</Text>
                    <Text style={{ fontSize: 12, color: '#7e7f82' }}>{data.DeliveryAddress}</Text>
                  </View>
                  <View style={{ flex: 3, flexDirection: 'column' }}>
                    <View style={{ flex: 3, alignItems: 'flex-end' }}>
                      <Text style={{ color: '#666', fontSize: 14, marginRight: 3 }}>#{data.OrderId}</Text>
                    </View>
                    <View >
                      <View style={{ backgroundColor: '#cd2121', alignItems: 'center', justifyContent: 'center', height: 30 }}>
                        <Text style={{ color: '#fff', fontSize: 14, marginRight: 3 }}>TIME LEFT:{data.TimeLeft}Mins</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </Display>
            {/* <Display
              enable={this.state.noongoingorders}
              enterDuration={500}
              exitDuration={250}
              exit="fadeOutLeft"
              enter="fadeInLeft"
            >
              <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, marginTop: 100 }}>
                <Image style={{ width: 120, height: 120, padding: 0 }} source={require('../Icons/no-orders-accept.png')} />
                <Text style={{ fontSize: 10, color: '#5b5959', marginTop: 5 }}>All Caught Up No Ongoing  Orders - Pull To Refresh </Text>
              </View>
            </Display> */}

          </ScrollView>
        </Display>
        <Display enable={this.state.networkRequest} style={styles.networkRequest}>
          <Image source={require("../assets/networkerror.png")} resizeMode={"center"} style={{ width: 200, height: 200 }} />
          <Text style={{ marginTop: 3, fontSize: 12, color: '#a39f9f' }}>It seems to be a network error!</Text>
          <TouchableOpacity style={{ backgroundColor: '#000', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 4, marginTop: 5 }} onPress={() => this._onRefresh()}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '400', }}>Retry</Text>
          </TouchableOpacity>
        </Display>
      </View>
    );
  };
}

export class NewOrderHeaderStyle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: true,
      employeeData: {},
      onDutyLatLng: {},
    }
  }

  changeDutyStatus = (value) => {
    console.log("NewOrderScreen changeDutyStatus() : ", value);
    //this._getLocationAsync();
    if (global.gpsworking == true) {
      let onDuty = '';
      if (value == true) {
        onDuty = "NO",
          this.setState({ status: false });
        this.getLiveLocation("OFFDUTY", onDuty);

      } else {
        onDuty = "YES",
          this.setState({ status: true });
        this.getLiveLocation("ONDUTY", onDuty);
      }
    } else {
      ToastAndroid.show("Please turn your gps on and try again");
    }
  };

  componentWillMount() {
    console.log("NewOrderScreen : componentWillMound()");
    this.getDutyInfo();
  };

  detectLocationChange() {
    console.log("NewOrderScreen detectLocationChange() :");
    global.backgroundLocation = navigator.geolocation.watchPosition(
      position => {
        console.log("NewOrderScreen detectLocationChange():");
        const { latitude, longitude } = position.coords;
        const newCoordinate =
        {
          latitude,
          longitude
        };
        console.log("New Changed Coordinates", newCoordinate);
        this.sendNewFetchedLocation(newCoordinate);
      },
      (error) => {
        console.log("Error for GPS  ", error.message);
        ToastAndroid.show("Please turn your gps on", ToastAndroid.LONG);
        LocationServicesDialogBox.checkLocationServicesIsEnabled({
          message: "<h2 style='color: #0af13e'>Use Location ?</h2>This app wants to change your device settings:<br/><br/>Use GPS, Wi-Fi, and cell network for location<br/><br/><a href='#'>Learn more</a>",
          ok: "YES",
          cancel: "NO",
          enableHighAccuracy: true, // true => GPS AND NETWORK PROVIDER, false => GPS OR NETWORK PROVIDER
          showDialog: true, // false => Opens the Location access page directly
          openLocationServices: true, // false => Directly catch method is called if location services are turned off
          preventOutSideTouch: false, // true => To prevent the location services window from closing when it is clicked outside
          preventBackClick: true, // true => To prevent the location services popup from closing when it is clicked back button
          providerListener: false // true ==> Trigger locationProviderStatusChange listener when the location state changes
        }).then(function (success) {
          console.log(success); // success => {alreadyEnabled: false, enabled: true, status: "enabled"}
        }).catch((error) => {
          console.log(error.message); // error.message => "disabled"
        })
        setInterval(() => this.detectLocationChange, 500);
      },
      { enableHighAccuracy: true, timeout: 1000, maximumAge: 0, distanceFilter: 10 },
    );
  };

  getLiveLocation = (status, dutyStatus) => {
    console.log("NewORderScreen getLiveLocation() : ", status, dutyStatus);
    navigator.geolocation.getCurrentPosition((position) => {
      var position = position.coords;
      this.setState({
        onDutyLatLng: {
          latitude: position.latitude,
          longitude: position.longitude,
        }
      }, () => {
        const formValue = JSON.stringify({
          'delivery-person-id': this.state.employeeData.EmployeeId,
          'duty-status': dutyStatus,
          'location': this.state.onDutyLatLng.latitude + "," + this.state.onDutyLatLng.longitude,
        });
        console.log("formValue : ", formValue);
        fetch(BASEPATH + Global.CHAGE_DELIVERY_PERSON_DUTY_STATUS,
          {
            method: "POST",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: formValue
          })
          .then((response) => response.json())
          .then((responseJson) => {
            //console.log(responseJson);
            if (responseJson.Success == 'Y') {
              if (dutyStatus == 'YES') {
                this.detectLocationChange();
              }
              if (dutyStatus == 'NO') {
                //navigator.geolocation.stopObserving();
                navigator.geolocation.clearWatch(global.backgroundLocation);
                this.setState({ onDutyLatLng: {} })
                console.log("BackgroundLocationDetection status STOP");
              }
              this.state.employeeData.OnDuty = dutyStatus;
              global.duty = dutyStatus;
              this.storeItem('DeliveryData', this.state.employeeData);
            }
            else {
              console.log("Duty To change : ", dutyStatus);
              if (dutyStatus == "NO") {
                this.setState({ status: true });
              } else {
                this.setState({ status: false });
              }
              ToastAndroid.show("Network error , please try again", ToastAndroid.SHORT);
            }
          }).catch((error) => {
            console.log('Promise is rejected with error: ' + error);
            ToastAndroid.show("Network error , please try again", ToastAndroid.SHORT);

            if (dutyStatus == "NO") {
              this.setState({ status: true });
            } else {
              this.setState({ status: false });
            }

            this.setState({ networkRequest: true, loader: false, loader2: false })
          });
      });
    },
      (error) => {
        // alert("Error: " + error.message);
        console.log("Error for GPS  ", error.message);
        ToastAndroid.show("Please turn your gps on", ToastAndroid.LONG);
        if (dutyStatus == "NO") {
          this.setState({ status: true });
        } else {
          this.setState({ status: false });
        }
        alert("Turn Your GPS ON");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },

    );
  };

  // _getLocationAsync = async () => {

  //   console.log("NewOrderScreenHeader _getLocationAsync() :");
  //   let gpsstatus = await Location.getProviderStatusAsync();
  //   console.log("GPSStatus ", gpsstatus.locationServicesEnabled);
  //   if (gpsstatus.locationServicesEnabled == false) {
  //     global.gpsworking = false;
  //     Alert.alert("Please Turn Your GPS On");
  //     // const gps = IntentLauncherAndroid.startActivityAsync(
  //     //   IntentLauncherAndroid.ACTION_LOCATION_SOURCE_SETTINGS
  //     // );
  //     console.log("GPS Setting Status", gps);
  //     // { setInterval(() => this._getLocationAsync, 100) }
  //   }
  //   else {
  //     global.gpsworking = true;
  //   }
  //   console.log("GPS Working", gpsworking);
  //   return global.gpsworking;
  // };

  getDutyInfo() {
    console.log("NewOrderScreen getDutyInfo() : ");
    this.retrieveItem('DeliveryData').then((data) => {
      this.setState({ employeeData: data })
      global.duty = data.OnDuty;
      if (data.OnDuty == 'NO') {
        this.setState({ status: false })
      } else {
        this.setState({ status: true, })
        this.detectLocationChange();
      }
    }).catch((error) => {
      console.log('Promise is rejected with error: ' + error);
    });
  };

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
  };

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
  };

  sendNewFetchedLocation(newCoordinate) {
    console.log("NewOrderScreen sendNewFetchedLocation() : ", newCoordinate);
    const formValue = JSON.stringify({
      'delivery-person-id': this.state.employeeData.EmployeeId,
      'location': newCoordinate.latitude + "," + newCoordinate.longitude,
    });
    console.log("UpdatedLocation ", formValue);
    fetch(BASEPATH + Global.UPDATE_DELIVERY_PERSON_LIVE_LOCATION,
      {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: formValue
      })
  };

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', backgroundColor: '#0000e5', height: '100%' }}>
        <Text style={{ color: '#fff', marginRight: 6, fontSize: 18 }}>On Duty</Text>
        <Switch
          trackColor={{ false: '#000', true: '#fff' }}
          thumbColor={'#cd2121'}
          onValueChange={this.changeDutyStatus.bind(this, this.state.status)}
          value={this.state.status} />
      </View>
    );
  }
}

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