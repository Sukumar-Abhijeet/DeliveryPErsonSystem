import React from 'react';
import {
  Dimensions, TouchableOpacity, View, Image,
  StyleSheet, ScrollView, ListView, Text, TextInput, FlatList, ActivityIndicator
} from 'react-native';
import Display from 'react-native-display';
import Global from "../Urls/Global";

const BASEPATH = Global.BASE_PATH;
//  import SliderButton from 'react-native-slider-button';

export class OrderListDetailHistoryScreen extends React.Component {
  constructor(props) {
    super(props);

    global.HistoryOrderId = this.props.navigation.getParam('orderId')
    const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.state = {
      dataSource: ds.cloneWithRows([]),
      orderId: this.props.navigation.getParam('orderId'),
      orderStatus: this.props.navigation.getParam('orderStatus'),
      dataObj: this.props.navigation.getParam('employeeId'),
      loader: true,

    };
  }

  componentWillMount() {
    //console.log(this.state.orderCount);
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
        if (responseJson.Success == 'Y') {
          this.setState({ loader: false })

          console.log(responseJson.Data);



          this.setState({ dataSource: this.state.dataSource.cloneWithRows(responseJson.Data) })
        }
        else if (responseJson.Success == 'N') {

        }
        else {

        }
      })

  };
  render() {



    return (
      <View style={styles.MainContainer}>
        <Display enable={this.state.loader} style={{ height: Dimensions.get('window').height - 100, justifyContent: 'center' }}>
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
                  <View>
                    <Text style={{ fontSize: 15, color: '#5b5959', marginLeft: 5, marginTop: 15 }}> DELIVERY ADDRESS</Text>
                    {/* <TouchableOpacity onPress={() => this.props.navigation.navigate('Maps')}> */}
                    <TouchableOpacity>
                      <View style={{
                        flex: 1, width: Dimensions.get('window').width - 20, marginTop: 5, backgroundColor: '#fff', flexDirection: 'row'
                        , margin: 'auto', height: 80, borderRadius: 5,
                      }}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <Image style={{ width: 20, height: 20, padding: 0, opacity: .3 }} source={require('../Icons/house-outline.png')} />
                        </View>
                        <View style={{
                          flex: 8
                          , flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start'
                        }}>
                          <Text style={{ fontSize: 18, color: '#262424' }}>{data.CustomerName}</Text>
                          <Text style={{ color: '#bcbaba', fontSize: 14 }}>{data.DeliveryAddress}</Text>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <Image style={{ width: 15, height: 15, padding: 0, opacity: .6 }} source={require('../Icons/right-arrow-black.png')} />
                        </View>
                      </View>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 15, color: '#5b5959', marginLeft: 5, marginTop: 15 }}> ORDER DETAILS</Text>
                    <FlatList data={data.OrderProducts}
                      renderItem={({ item }) =>

                        <View style={{
                          width: Dimensions.get('window').width - 20, marginTop: 5, backgroundColor: '#fff', padding: 10, flexDirection: 'column'
                          , marginLeft: 10, borderRadius: 5, shadowColor: '#000'
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
                  </View>

                  <Text style={{ fontSize: 15, color: '#5b5959', marginLeft: 5, marginTop: 190 }}> SPECIAL INSTRUCTIONS !!</Text>
                  <View style={{
                    width: Dimensions.get('window').width - 20, marginTop: 3, marginBottom: 6, backgroundColor: '#fff', flexDirection: 'row'
                    , marginLeft: 10, height: 70, borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
                    shadowRadius: 2, elevation: 2, justifyContent: 'center', alignItems: 'center', padding: 4
                  }}>
                    <Text style={{ fontSize: 12, color: '#bcbaba' }}>{data.SpecialInstructions}</Text>
                  </View>
                </View>
              }
            />
          </ScrollView>


        </View>




        {/* <Display enable='1'>
                  <Display enable={(this.state.OrderStatus=='ORDER CANCELLED'?1:0)}> */}
        <View style={styles.orderListFooter}>
          <Text style={{ fontSize: 20, color: '#fff' }}>{this.state.orderStatus}</Text>
        </View>
        {/* </Display>
            </Display>     
            <Display enable='1'>
                  <Display enable={(this.state.OrderStatus=='ORDER DELIVERED'?1:0)}>
                  <View style={styles.orderListFooter}>
                    <Text>{this.state.orderStatus}</Text>
                  </View>
                  </Display>
            </Display>  */}



      </View>

    );
  }
}

export class OrderListHistoryHeaderStyle extends React.Component {

  render() {

    return (
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row' }}>
        <View style={{ flex: 8, justifyContent: 'flex-start' }}>
          <Text style={{ color: '#000', marginRight: 6, fontSize: 18, fontWeight: 'bold' }}>#{global.HistoryOrderId}</Text>
        </View>
        <View style={{ flex: 2, justifyContent: 'flex-end' }}>
          {/* <Image style={{ width: 25, height: 25 ,padding:0 }} source={require('../Icons/calling.png')}/> */}
        </View>
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
    flex: 9, flexDirection: 'column', backgroundColor: '#fefefe',
  },
  orderListFooter:
  {
    flex: 1, flexDirection: 'row', backgroundColor: '#3cb256', alignItems: 'center', justifyContent: 'center'
  },
  orderListFooter2:
  {
    flex: 1, flexDirection: 'row', backgroundColor: '#cd2121',
  },
});

export default OrderListDetailHistoryScreen;