import React from 'react';
import {
  Dimensions, TouchableOpacity, View, Image,
  StyleSheet, ScrollView, ListView, ActivityIndicator, Text, AsyncStorage, Modal, ToastAndroid
} from 'react-native';
import Display from 'react-native-display';
import Global from "../Urls/Global";
const BASEPATH = Global.BASE_PATH;

export class PaymentMethodScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      paytmVisible: false,
      cashVisible: false,
      upiVisible: false,
      orderId: this.props.navigation.getParam('orderId'),
      EmployeeId: this.props.navigation.getParam('EmployeeId'),
      billData: this.props.navigation.getParam('billPay'),
      PayableAmount: "",
      loader: true,
      networkRequest: false,
      Paid: false,
      appOrderObj: {
        ongoingObj: {
          OrderId: "",
          distance: 0,
          distanceRoute: []
        },
        orderQueue: []
      },
    };
  }
  setpaytmVisible(visible) {
    this.setState({ paytmVisible: visible });
  }
  setcashVisible(visible) {
    this.setState({ cashVisible: visible });
  }
  setupiVisible(visible) {
    this.setState({ upiVisible: visible });
  }

  async storeItem(key, item) {
    try {
      console.log("StoreItem()");
      var jsonOfItem = await AsyncStorage.setItem(key, JSON.stringify(item));
      // console.log(jsonOfItem);
      return jsonOfItem;
    } catch (error) {
      console.log(error.message);
    }
  }


  async retrieveItem(key) {
    console.log("HomeScreen retrieveItem() key: ", key);
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

  stopDistanceCal = () => {
    console.log("PaymentMethodScreen stopDistanceCal() ");
    console.log("Routes ", this.state.appOrderObj.ongoingObj.distanceRoute);
    console.log("Distance ", this.state.appOrderObj.ongoingObj.distance);
    this.sendOrderDeliveryData(this.state.appOrderObj.ongoingObj.distanceRoute, this.state.appOrderObj.ongoingObj.distance);
  }

  sendOrderDeliveryData(routeCoordinates, distance) {
    console.log('Distance: ', distance);
    console.log('Route cordinated: ', routeCoordinates);
    let tempDistance = distance;
    ToastAndroid.show("Distance Travelled : " + tempDistance, ToastAndroid.LONG);
    let stringformat = JSON.stringify(routeCoordinates);
    let lat = stringformat.replace(/latitude/g, "lat");
    let route = lat.replace(/longitude/g, "lng");
    const formValueDOA = JSON.stringify({
      'del-per-id': this.state.EmployeeId,
      'order-id': this.state.orderId,
      'order-action': "DELIVERED",
      'order-distance-route': route,
      'order-distance': tempDistance,
    })
    console.log("DELIVERY_ORDER_ACTION formValue", formValueDOA);
    fetch(BASEPATH + Global.DELIVERY_ORDER_ACTION,
      {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: formValueDOA
      })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log("DELIVERY_ORDER_ACTION Response : ", responseJson)
        if (responseJson.Success == 'Y') {
          let appOrderObj = this.state.appOrderObj;
          let idx = appOrderObj.orderQueue.indexOf(this.state.billData.OrderId);
          appOrderObj.orderQueue.splice(idx, 1);
          appOrderObj.ongoingObj.OrderId = "";
          appOrderObj.ongoingObj.distance = 0;
          appOrderObj.ongoingObj.distanceRoute = [];
          if (appOrderObj.orderQueue.length > 0) {
            appOrderObj.ongoingObj.OrderId = appOrderObj.orderQueue[0];
            ToastAndroid.show("Next Order to be delivered: " + appOrderObj.ongoingObj.OrderId, ToastAndroid.LONG);
          }
          else {
            navigator.geolocation.stopObserving();
            navigator.geolocation.clearWatch(global.watchID);
          }
          this.storeItem("AppOrderObj", appOrderObj);
          this.props.navigation.navigate('Tabs');
        }
      });
    //if (this.state.billData.OrderId == this.state.appOrderObj.ongoingObj.OrderId)
    // this.props.navigation.navigate('Tabs');
  }

  deliveryComplete = (fetchmode) => {
    console.log("paymentMethodScreen deliveryComplete() ");

    this.setState({ loader: true })
    const formValue = JSON.stringify({
      'del-per-id': this.state.EmployeeId,
      'order-id': this.state.orderId,
      'order-pay-mode': fetchmode,
    });
    console.log("SET_PAYMENT_MODE formValue", formValue)
    if (this.state.billData.OrderId != this.state.appOrderObj.ongoingObj.OrderId) {
      console.log("You are delivering  order assigned to you later");
    }
    fetch(BASEPATH + Global.SET_PAYMENT_MODE,
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
        if (responseJson.Success == 'Y') {
          this.stopDistanceCal();
          ToastAndroid.show(responseJson.Message, ToastAndroid.LONG, ToastAndroid.CENTER);
        }
        else if (responseJson.Success == 'N') {
          ToastAndroid.show(responseJson.Message, ToastAndroid.LONG, ToastAndroid.CENTER);
        }
        else {
          ToastAndroid.show(responseJson.Message, ToastAndroid.LONG, ToastAndroid.CENTER);
        }
      })
  }

  getNetPayableAmount() {
    console.log("PaymentMethodScreen getNetPayableAmount() ");
    // console.log("PaymentMethodScreen getNetPayableAmount() :", this.state.billData);
    if (this.state.billData.OrderOf == "bmfbusiness" && this.state.billData.PaymentMethod == "CREDIT") {
      this.setState({ Paid: true, loader: false }, () => console.log("Paid status ", this.state.Paid));
    }
    else {
      this.setState({ Paid: true, loader: false }, () => console.log("Paid status ", this.state.Paid));
    }
  }
  getAppDataObj() {
    this.retrieveItem('AppOrderObj').then((data) => {
      if (data != null) {
        this.setState({ appOrderObj: data })
        //this.setState({ ifnotLoggedIn: true });
      }
    }).catch((error) => {
      console.log('Promise is rejected with error: ' + error);
    });
  }

  componentWillMount() {
    this.getAppDataObj();
  };
  componentDidMount() {

    this.getNetPayableAmount();
  }

  render() {
    return (
      <View style={{ flex: 1, flexDirection: 'column', }}>
        <View style={styles.header}>
          <View style={{ flex: 8, justifyContent: 'flex-start' }}>
            <Text style={{ color: '#000', marginRight: 6, fontSize: 18, fontWeight: 'bold' }}>#{this.state.billData.OrderId}</Text>
          </View>
          <View style={{ flex: 2, justifyContent: 'flex-end' }}>
            <Image style={{ width: 25, height: 25, padding: 0 }} source={require('../Icons/payment.png')} />
          </View>
        </View>
        <Display enable={!this.state.networkRequest} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.paytmVisible}
            onSwipe={() => this.setState({ isVisible: false })}
            swipeDirection="left"
            onRequestClose={() => {
              this.setpaytmVisible(!this.state.paytmVisible);
            }}>
            <View style={{ flex: 1, backgroundColor: '#ebebeb', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <Display enable={this.state.loader} style={{ height: Dimensions.get('window').height, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#CD2121" />
              </Display>
              <View style={{ marginTop: 35, flex: 3 }}>
                <Image style={{ width: 200, height: 100, padding: 0, }} source={require('../Icons/paytm-logo.png')} />

              </View>
              <Text>Scan the Below QR Code To Pay.</Text>
              <View style={{
                width: Dimensions.get('window').width - 20, padding: 10, marginTop: 5, flex: 4, height: 250, width: 250, backgroundColor: '#fff', flexDirection: 'row'
                , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2, justifyContent: 'center',
                shadowRadius: 2, elevation: 2, alignItems: 'center'
              }}>
                <Image style={{ width: 220, height: 220, padding: 0, }} source={require('../Icons/qrcode.jpeg')} />
              </View>

              <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ebebeb', justifyContent: 'center', padding: 0, borderRadius: 5, width: 500 }}>
                <TouchableOpacity onPress={this.deliveryComplete.bind(this, "PAYTM")}>
                  <View style={{ height: 45, backgroundColor: '#cd2121', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', borderRadius: 5, width: 250 }}>
                    <Text style={{ color: '#fff', fontSize: 20, }}>₹</Text>
                    <Text style={{ color: '#fff', fontSize: 20, }}> {this.state.billData.OrderAmount}</Text>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>  COLLECTED</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>


          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.upiVisible}
            onSwipe={() => this.setState({ isVisible: false })}
            swipeDirection="left"
            onRequestClose={() => {
              this.setupiVisible(!this.state.upiVisible);
            }}>
            <View style={{ flex: 1, backgroundColor: '#ebebeb', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <Display enable={this.state.loader} style={{ height: Dimensions.get('window').height, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#CD2121" />
              </Display>
              <View style={{ marginTop: 35, flex: 3 }}>
                <Image style={{ width: 200, height: 100, padding: 0, }} source={require('../Icons/UPI-Logo.png')} />
              </View>
              <Text>Scan the Below QR Code To Pay.</Text>
              <View style={{
                width: Dimensions.get('window').width - 20, padding: 10, marginTop: 5, flex: 4, height: 250, width: 250, backgroundColor: '#fff', flexDirection: 'row'
                , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2, justifyContent: 'center',
                shadowRadius: 2, elevation: 2, alignItems: 'center'
              }}>
                <Image style={{ width: 220, height: 220, padding: 0, }} source={require('../Icons/upiqrcode.jpg')} />
              </View>
              <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ebebeb', justifyContent: 'center', padding: 0, borderRadius: 5, width: 500 }}>
                <TouchableOpacity onPress={this.deliveryComplete.bind(this, "UPI")}>
                  <View style={{ height: 45, backgroundColor: '#cd2121', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', borderRadius: 5, width: 250 }}>
                    <Text style={{ color: '#fff', fontSize: 20, }}>₹</Text>
                    <Text style={{ color: '#fff', fontSize: 20, }}> {this.state.billData.OrderAmount}</Text>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>  COLLECTED</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.cashVisible}
            onSwipe={() => this.setState({ isVisible: false })}
            swipeDirection="left"
            onRequestClose={() => {
              this.setcashVisible(!this.state.cashVisible);
            }}>
            <View style={{ flex: 1, backgroundColor: '#ebebeb', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <Display enable={this.state.loader} style={{ height: Dimensions.get('window').height, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#CD2121" />
              </Display>
              <View style={{ marginTop: 35, flex: 3 }}>
                {/* <Image style={{ width: 250, height: 250 ,padding:0 ,marginRight:10}} source={require('../Icons/indian-rupia.png')}/> */}
                <Text style={{ color: '#cd2121', fontSize: 35 }}>CASH PAYMENT</Text>
              </View>
              <Text>COLLECT CASH.</Text>
              <View style={{
                width: Dimensions.get('window').width - 20, padding: 10, marginTop: 5, flex: 4, height: 250, width: 250, backgroundColor: '#fff', flexDirection: 'row'
                , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2, justifyContent: 'center',
                shadowRadius: 2, elevation: 2, alignItems: 'center'
              }}>
                <Image style={{ width: 220, height: 220, padding: 0, }} source={require('../Icons/indian-rupia.png')} />
              </View>
              <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ebebeb', justifyContent: 'center', padding: 0, borderRadius: 5, width: 500 }}>
                <TouchableOpacity onPress={this.deliveryComplete.bind(this, "CASH")}>
                  <View style={{ height: 45, backgroundColor: '#cd2121', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', borderRadius: 5, width: 250 }}>
                    <Text style={{ color: '#fff', fontSize: 20, }}>₹</Text>
                    <Text style={{ color: '#fff', fontSize: 20, }}> {this.state.billData.OrderAmount}</Text>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>  COLLECTED</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>


          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <View style={{ justifyContent: 'center', alignItems: 'center' }} >
              <Display enable={this.state.loader} style={{ height: Dimensions.get('window').height, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#CD2121" />
              </Display>
              <View style={{
                width: Dimensions.get('window').width - 20, marginTop: 5, height: 150, backgroundColor: '#fff', flexDirection: 'row'
                , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
                shadowRadius: 2, elevation: 2,
              }}>
                <View style={{ flex: 4, flexDirection: "column", justifyContent: 'center', alignItems: 'center', margin: 10 }} >
                  <Text style={{ fontSize: 20 }}>Total</Text>
                  <Text style={{ fontSize: 20 }}>Payable</Text>
                  <Text style={{ fontSize: 20 }}>Amount</Text>
                </View>
                <View style={{ flex: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: 'blue', justifyContent: 'center', padding: 0, borderRadius: 5 }}>
                  <Text style={{ color: '#fff', fontSize: 40, }}>₹</Text>
                  <Text style={{ color: '#fff', fontSize: 25, }}> {this.state.billData.OrderAmount}</Text>
                </View>
              </View>


              <Display style={{ flexDirection: 'row', padding: 0, borderRadius: 5, }} enable={this.state.Paid}>
                <TouchableOpacity style={{ height: 45, backgroundColor: '#cd2121', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', borderRadius: 5, width: 250, marginTop: 50 }} onPress={this.deliveryComplete.bind(this, "CREDIT")}>
                  <Text style={{ color: '#fff', fontSize: 20, }}>₹</Text>
                  <Text style={{ color: '#fff', fontSize: 20, }}> {this.state.billData.OrderAmount}</Text>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>  COLLECTED</Text>
                </TouchableOpacity>
              </Display>


              <Display enable={!this.state.Paid}>
                <Text style={{ fontSize: 15, color: '#5b5959', marginTop: 10 }}>PAYMENT MODE</Text>
                <TouchableOpacity onPress={() => { this.setcashVisible(true); }}>
                  <View style={{
                    width: Dimensions.get('window').width - 20, marginTop: 5, backgroundColor: '#fff', padding: 15, flexDirection: 'row'
                    , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
                    shadowRadius: 2, elevation: 2,
                  }}>
                    <Image style={{ width: 25, height: 25, padding: 0, marginRight: 10 }} source={require('../Icons/indian-rupia.png')} />
                    <Text>CASH</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { this.setpaytmVisible(true); }}>
                  <View style={{
                    width: Dimensions.get('window').width - 20, marginTop: 10, backgroundColor: '#fff', padding: 15, flexDirection: 'row'
                    , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
                    shadowRadius: 2, elevation: 2,
                  }}>
                    <View style={{ flex: 3, flexDirection: 'row' }}>
                      <Image style={{ width: 25, height: 25, padding: 0, marginRight: 10 }} source={require('../Icons/paytm.png')} />
                      <Text>PAYTM</Text>
                    </View>
                    <View style={{ flex: 7, alignItems: 'flex-end' }}>
                      <Text style={{ color: '#bcbaba', fontSize: 14 }}>Click To Generate QR-Code</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { this.setupiVisible(true); }}>
                  <View style={{
                    width: Dimensions.get('window').width - 20, marginTop: 10, backgroundColor: '#fff', padding: 15, flexDirection: 'row'
                    , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
                    shadowRadius: 2, elevation: 2,
                  }}>
                    <View style={{ flex: 3, flexDirection: 'row' }}>
                      <Image style={{ width: 25, height: 25, padding: 0, marginRight: 10 }} source={require('../Icons/logosmall3x.png')} />
                      <Text>UPI</Text>
                    </View>
                    <View style={{ flex: 7, alignItems: 'flex-end' }}>
                      <Text style={{ color: '#bcbaba', fontSize: 14 }}>Click To Generate QR-Code</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', marginTop: 60, alignItems: 'center', backgroundColor: '#ebebeb', justifyContent: 'center', borderRadius: 5 }}>
                  <View style={{ backgroundColor: '#3cb256', borderRadius: 5, height: 40, width: 260, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', width: 150 }}>Select The Payment Mode</Text>
                  </View>
                </View>

              </Display>


            </View>
          </ScrollView>
        </Display>



        <Display enable={this.state.networkRequest} style={styles.networkRequest}>
          <Image source={require("../assets/networkerror.png")} resizeMode={"center"} style={{ width: 200, height: 200 }} />
          <Text style={{ marginTop: 3, fontSize: 12, color: '#a39f9f' }}>It seems to be a network error!</Text>
          <TouchableOpacity style={{ backgroundColor: '#000', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 4, marginTop: 5 }} onPress={() => this.componentWillMount()}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '400', }}>Retry</Text>
          </TouchableOpacity>
        </Display>
      </View>
    );
  }
}


export class PaymentMethodsHeaderStyle extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row' }}>
        <View style={{ flex: 8, justifyContent: 'flex-start' }}>
          <Text style={{ color: '#000', marginRight: 6, fontSize: 18, fontWeight: 'bold' }}>#{global.OrderId}</Text>
        </View>
        <View style={{ flex: 2, justifyContent: 'flex-end' }}>
          <Image style={{ width: 25, height: 25, padding: 0 }} source={require('../Icons/payment.png')} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  networkRequest: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    height: 50,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2, padding: 10,
    shadowRadius: 2, elevation: 2, flexDirection: 'row',
    justifyContent: 'flex-start', alignItems: 'center'
  },
});

export default PaymentMethodScreen;