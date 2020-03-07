import React from 'react';
import {
  Dimensions, TouchableOpacity, View, Image,
  StyleSheet, ScrollView, ListView, Alert, Text, TextInput, FlatList, ActivityIndicator
} from 'react-native';
import Display from 'react-native-display';
//  import SliderButton from 'react-native-slider-button';
import { RNSlidingButton, SlideDirection } from 'rn-sliding-button';
import * as OpenAnything from 'react-native-openanything';
import Global from "../Urls/Global";

const BASEPATH = Global.BASE_PATH;

export class OrderListDetailScreen extends React.Component {
  constructor(props) {
    super(props);
    global.OrderId = this.props.navigation.getParam('orderId')

    const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.state = {
      dataSource: ds.cloneWithRows(['r1']),
      orderId: this.props.navigation.getParam('orderId'),
      OrderStatus: this.props.navigation.getParam('orderStatus'),
      dataObj: this.props.navigation.getParam('employeeId'),
      loader: true,
      deliverystart: true,
      paymentstart: false
    };
  }

  onSlideRight = () => {

    Alert.alert(
      'Please Verify',
      'Are You Ready For Delivery ? ',
      [
        {
          text: 'Go Back ?', onPress: () => {
            this.props.navigation.navigate('OrderList');
          }
        },
        {
          text: 'Cancel', onPress: () => {
            //   this.setState({promptstatus:true,promptmessage:'Oops! You cancelled the process. Click Ok to procced.'})
          }
        },
        {
          text: 'OK', onPress: () => {
            this.setState({ loader: true });
            this.setState({ deliverystart: false });
            fetch(BASEPATH + Global.DELIVERY_ORDER_ACTION,
              {
                method: "POST",
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  'del-per-id': this.state.dataObj.EmployeeId,
                  'order-id': this.state.orderId,
                  'order-action': "OUT"
                })
              })
              .then((response) => response.json())
              .then((responseJson) => {
                if (responseJson.Success == 'Y') {
                  this.setState({ loader: false })
                  console.log(responseJson);
                  this.setState({ paymentstart: true });
                }
                else {
                  this.setState({ loader: false })
                  console.log(responseJson);
                }

              })
          }
        }
      ],
    )
  };

  startPay = () => {
    this.props.navigation.navigate("PaymentMethod", { orderId: this.state.orderId, EmployeeId: this.state.dataObj.EmployeeId });
  };


  getOrderDetails() {
    fetch(BASEPATH + Global.GET_ORDER_DETAILS,
      {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'del-per-id': this.state.dataObj.EmployeeId,
          'order-id': this.state.orderId,
        })
      })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson)

        console.log(this.state.OrderStatus)
        if (this.state.OrderStatus == "OUT FOR DELIVERY") {
          this.setState({ deliverystart: false })
          this.setState({ paymentstart: true })
        }
        if (responseJson.Success == 'Y') {
          this.setState({ loader: false })
          console.log(responseJson.Data);
          for (i = 0; i <= responseJson.Data.length; i++) {
            console.log(i)
            console.log(responseJson.Data[i]);
          }
          this.setState({ dataSource: this.state.dataSource.cloneWithRows(responseJson.Data) })
        }
        else if (responseJson.Success == 'DN') {
          console.log(responseJson);
        }
        else {

        }
      }).catch((error) => {
        console.log('Promise is rejected with error: ' + error);
        this.setState({ networkRequest: true, loader: false, loader2: false })
      });
  }

  componentWillMount() {
    //console.log(this.state.orderCount);
    // this.getOrderDetails();
  };
  render() {

    return (
      <View style={styles.MainContainer}>
        <Display enable={this.state.loader} style={{ height: Dimensions.get('window').height, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#CD2121" />
        </Display>

        <View style={styles.orderListContainer}>
          <ScrollView>
            <ListView
              enableEmptySections={true}
              style={{ flex: 1, flexDirection: 'row' }}
              dataSource={this.state.dataSource}
              renderRow={(data) =>

                <View>
                  <Text style={{ fontSize: 15, color: '#5b5959', marginTop: 15 }}> DELIVERY ADDRESS</Text>
                  {/* <TouchableOpacity onPress={() => this.props.navigation.navigate('Maps',{deliveryAddress:data.DeliveryAddress})}>             */}
                  <TouchableOpacity>
                    <View style={{
                      width: Dimensions.get('window').width - 20, marginTop: 5, backgroundColor: '#fff', flexDirection: 'row'
                      , marginLeft: 'auto', height: 80, borderRadius: 5, borderColor: '#dedede'
                    }}>
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Image style={{ width: 20, height: 20, padding: 0, opacity: .3 }} source={require('../Icons/house-outline.png')} />
                      </View>
                      <View style={{
                        flex: 8
                        , flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start'
                      }}>
                        <Text style={{ fontSize: 18, color: '#262424' }}>{data.CustomerName}</Text>
                        <Display enable={false}>
                          <Text> {global.customerNumber = data.CustomerPhone}</Text>
                        </Display>
                        <Text style={{ color: '#bcbaba', fontSize: 14 }}>{data.DeliveryAddress}</Text>
                      </View>
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Image style={{ width: 15, height: 15, padding: 0, opacity: .6 }} source={require('../Icons/right-arrow-black.png')} />
                      </View>
                    </View>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 15, color: '#5b5959', marginTop: 15 }}> ORDER DETAILS</Text>
                  <FlatList data={data.OrderProducts}
                    renderItem={({ item }) =>

                      <View style={{
                        width: Dimensions.get('window').width - 20, marginTop: 5, backgroundColor: '#fff', padding: 10, flexDirection: 'column'
                        , marginLeft: 'auto', borderRadius: 5
                      }}>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-start' }}>
                          <Text style={{ fontSize: 16, color: '#262424', }}>{item.RestaurantName}</Text>
                        </View>
                        <View style={{ flex: 3, flexDirection: 'row' }}>
                          <View style={{ flex: 3, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                            <Text style={{ fontSize: 14, color: '#575859', marginLeft: 5 }}>{item.ProductName}</Text>
                          </View>
                          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14 }}>X</Text>
                          </View>
                          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                            <Text style={{ fontSize: 14, color: '#575859' }}>{item.Qty}</Text>
                          </View>
                        </View>
                      </View>
                    }
                  />
                  <Display
                    enable={data.SpecialInstructions != ''}
                  >
                    <Text style={{ fontSize: 15, color: '#5b5959', marginLeft: 5, marginTop: 190 }}> SPECIAL INSTRUCTIONS !!</Text>
                    <View style={{
                      width: Dimensions.get('window').width - 20, marginTop: 3, marginBottom: 6, backgroundColor: '#fff', flexDirection: 'row'
                      , marginLeft: 10, height: 70, borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
                      shadowRadius: 2, elevation: 2, justifyContent: 'center', alignItems: 'center', padding: 4
                    }}>
                      <Text style={{ fontSize: 12, color: '#bcbaba' }}>{data.SpecialInstructions}</Text>
                    </View>
                  </Display>
                </View>

              }
            />
          </ScrollView>


        </View>

        <View style={styles.orderListFooter}>
          <Display
            enable={this.state.deliverystart}
          >
            <RNSlidingButton
              style={{
                width: Dimensions.get('window').width,
                padding: 10,
                // height:Dimensions.get('window').height
                backgroundColor: '#cd2121',
              }}
              height={60}

              onSlidingSuccess={this.onSlideRight}
              slideDirection={SlideDirection.RIGHT}>

              <View style={{ flexDirection: 'row', backgroundColor: '#fff', width: 150, borderRadius: 20, padding: 3, justifyContent: 'center', alignContent: 'center' }}>
                <Image style={{ width: 30, height: 30, paddingLeft: 10 }} source={require('../Icons/dvbike.png')} />
                <Text numberOfLines={1} style={styles.titleText}>
                  Slide To Start
            </Text>
              </View>
            </RNSlidingButton>
          </Display>

          <Display
            enable={this.state.paymentstart}
          >
            <TouchableOpacity onPress={this.startPay}>
              <View style={{ height: 60, width: Dimensions.get('window').width, backgroundColor: 'blue', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 25, fontWeight: '400' }}> ARRIVED </Text>
              </View>
            </TouchableOpacity>

          </Display>

        </View>
      </View>

    );
  }
}

export class OrderListHeaderStyle extends React.Component {

  render() {

    return (
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row' }}>
        <View style={{ flex: 8, justifyContent: 'flex-start' }}>
          <Text style={{ color: '#000', marginRight: 6, fontSize: 18, fontWeight: 'bold' }}>#{global.OrderId}</Text>
        </View>
        <TouchableOpacity style={{ flex: 2, justifyContent: 'flex-end', alignItems: 'flex-end', marginRight: 5 }} onPress={() => OpenAnything.Call(global.customerNumber)}>
          <Image style={{ width: 20, height: 20, padding: 0 }} source={require('../Icons/calling.png')} />
        </TouchableOpacity>
      </View>
    );
  }
}



const styles = StyleSheet.create({
  MainContainer:
  {
    flexDirection: 'column', flex: 1
  },
  orderListContainer:
  {
    flex: 9, flexDirection: 'column', backgroundColor: '#f7f7f7', justifyContent: 'center', alignItems: 'center'
  },
  orderListFooter:
  {
    flex: 1, flexDirection: 'row', backgroundColor: '#cd2121',
  },
  titleText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#cd2121',
    marginLeft: 10,
    marginTop: 7


  }
});

export default OrderListDetailScreen;