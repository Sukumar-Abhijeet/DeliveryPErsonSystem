import React from 'react';
import {
  Dimensions, TouchableOpacity, View, Image, Alert, ActivityIndicator, RefreshControl,
  StyleSheet, ScrollView, ListView, Text, TextInput, AsyncStorage, ToastAndroid
} from 'react-native';
import Display from 'react-native-display';
import Global from "../Urls/Global";
import DatePicker from 'react-native-datepicker';

const BASEPATH = Global.BASE_PATH;

class HistoryScreen extends React.Component {
  constructor(props) {
    super(props);

    const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.state = {
      historySource: {
        Data: []
      },
      dataObj: {},
      orderCount: 0,
      loader: false,
      refreshing: false,
      noOrders: false,
      noDates: true,
      networkRequest: false,
      perDayDistance: 0,
      startdate: "",
      enddate: "",
      todayDate: '',
      joinDate: '',
      mnths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'Novemer', 'December']
    }

  }

  firstLoad(date) {
    console.log("HistoryScreen firstLoad () :", date)
    if (date != "") {
      this.setState({ refreshing: true, networkRequest: false, loader: true, noDates: true });
      const formValue = JSON.stringify({
        'del-per-id': this.state.dataObj.EmployeeId,
        'order-status': "",
        'order-from-date': date,
        'order-to-date': date
      });
      console.log("GET_DELIVERY_ORDER_HISTORY formValue :", formValue);
      fetch(BASEPATH + Global.GET_DELIVERY_ORDER_HISTORY,
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
          console.log("GET_DELIVERY_ORDER_HISTORY response : ", responseJson);
          if (responseJson.Success == 'Y') {
            this.setState({ loader: false, noOrders: false, noDates: false })
            this.setState({
              historySource: responseJson,
              orderCount: responseJson.OrderCount,
              perDayDistance: (responseJson.TotalDistance / 1000).toFixed(2)
            });
          }
          else if (responseJson.Success == 'DN') {
            this.setState({ loader: false, noOrders: true, noDates: false, orderCount: 0, perDayDistance: 0, })
            this.setState(
              {
                historySource: {
                  Data: []
                }
              }
            )
          }
          else {
          }
        }).catch((error) => {
          console.log('Promise is rejected with error: ' + error);
          this.setState({ networkRequest: true, loader: false, })
        });
      this.setState({ refreshing: false });
    }


  }

  _onRefresh() {
    console.log("HistoryScreen _onRefresh():");
    if (this.state.startdate == '' || this.state.enddate == '') {
      ToastAndroid.show("Please select the dates ", ToastAndroid.LONG);
    }
    else {
      this.setState({ refreshing: true, networkRequest: false, loader: true, noDates: true });
      const formValue = JSON.stringify({
        'del-per-id': this.state.dataObj.EmployeeId,
        'order-status': "",
        'order-from-date': this.state.startdate,
        'order-to-date': this.state.enddate
      });
      console.log("GET_DELIVERY_ORDER_HISTORY formValue :", formValue);
      fetch(BASEPATH + Global.GET_DELIVERY_ORDER_HISTORY,
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
          console.log("GET_DELIVERY_ORDER_HISTORY response : ", responseJson);
          if (responseJson.Success == 'Y') {
            this.setState({ loader: false, noOrders: false, noDates: false })
            this.setState({
              historySource: responseJson,
              orderCount: responseJson.OrderCount,
              perDayDistance: (responseJson.TotalDistance / 1000).toFixed(2)
            });
          }
          else if (responseJson.Success == 'DN') {
            this.setState({ loader: false, noOrders: true, noDates: false, orderCount: 0, perDayDistance: 0, })
            this.setState(
              {
                historySource: {
                  Data: []
                }
              }
            )
          }
          else {
          }
        }).catch((error) => {
          console.log('Promise is rejected with error: ' + error);
          this.setState({ networkRequest: true, loader: false, })
        });
      this.setState({ refreshing: false });
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
      this.setState({ dataObj: data }, () =>
        console.log("DataSet"),
      );
      console.log("Working Since : ", data.WorkingSince);

      let year = data.WorkingSince.substring(6, 11);
      let mnth = data.WorkingSince.substring(3, 6);
      let mnthArr = this.state.mnths
      for (i = 0; i < mnthArr.length; i++) {
        if (mnthArr[i] == mnth) {
          mnth = i + 1;
        }
      }
      let day = data.WorkingSince.substring(0, 2);
      let joinDate = year + "-" + mnth + "-" + day;
      this.setState({ joinDate: joinDate });
    }).catch((error) => {
      console.log('Promise is rejected with error: ' + error);
    });
  }

  dateCheck(value, cond) {
    console.log("dateCheck()", value, cond)
    if (cond == "start") {
      this.setState({ startdate: value })
    }
    else {
      this.setState({ enddate: value })
    }
    if (this.state.startdate != '' && this.state.enddate != '') {
      // console.log("fetchData");
      this._onRefresh();
    }
  }

  getTodayDate() {
    console.log("HistoryScreen getTodayDate() :");
    let date = new Date();
    let todaydate = date.getDate();
    let todaymonth = date.getMonth() + 1;
    if (todaymonth < 10) {
      todaydate = "0" + todaymonth;
    }
    if (todaydate < 10) {
      todaydate = "0" + todaydate;
    }
    let todayYear = date.getFullYear();
    let fetcheddate = todayYear + "-" + todaymonth + "-" + todaydate;
    this.setState({ todayDate: fetcheddate })
    this.firstLoad(fetcheddate);
    console.log("Today's Date : ", fetcheddate);
  }

  componentWillMount() {
    this.getDeliveryBoyData();
    this.getTodayDate();
  };


  render() {
    return (
      <View style={{ flex: 1, flexDirection: 'column', backgroundColor: '#EBEBEB' }}>
        <Display enable={!this.state.networkRequest} style={{ flex: 1, backgroundColor: '#EBEBEB' }} >
          <View style={styles.calenderContainer}>
            <Text style={styles.headColor}>Select History Duration </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text>From</Text>
                <DatePicker
                  style={{ width: 150 }}
                  date={this.state.startdate}
                  mode="date"
                  placeholder="select date"
                  format="YYYY-MM-DD"
                  minDate={this.state.joinDate}
                  maxDate={this.state.todayDate}
                  confirmBtnText="Confirm"
                  cancelBtnText="Cancel"
                  customStyles={{
                    dateIcon: {
                      position: 'absolute',
                      left: 0,
                      top: 4,
                      marginLeft: 0
                    },
                    dateInput: {
                      marginLeft: 36
                    }
                  }}
                  onDateChange={(startdate1) => { this.dateCheck(startdate1, "start") }}
                />
              </View>
              <View>
                <Text>To</Text>
                <DatePicker
                  style={{ width: 150 }}
                  date={this.state.enddate}
                  mode="date"
                  placeholder="select date"
                  format="YYYY-MM-DD"
                  minDate={this.state.joinDate}
                  maxDate={this.state.todayDate}
                  confirmBtnText="Confirm"
                  cancelBtnText="Cancel"
                  customStyles={{
                    dateIcon: {
                      position: 'absolute',
                      left: 0,
                      top: 4,
                      marginLeft: 0
                    },
                    dateInput: {
                      marginLeft: 36
                    }
                  }}
                  onDateChange={(enddate1) => { this.dateCheck(enddate1, "end") }}
                />
              </View>
            </View>
          </View>


          <Display enable={this.state.loader} style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#CD2121" />
          </Display>

          <Display style={styles.historyordercontainer} enable={!this.state.noDates}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this._onRefresh.bind(this)}
              />
            }
          >
            <View style={styles.historycontainer}>
              <View style={styles.historycontainerinnertop}>
                <View style={styles.historycontainerinnertopleft}>
                  <Text style={{ fontWeight: 'bold', fontSize: 35 }}>{this.state.orderCount}</Text>
                  <Text>Total Orders</Text>
                </View>
                <View style={styles.historycontainerinnertopright}>
                  <Text style={{ fontWeight: 'bold', fontSize: 30 }}> {this.state.perDayDistance} KM</Text>
                  <Text>Distance Covered</Text>
                </View>
              </View>
            </View>
            <ScrollView
            >
              {this.state.historySource.Data.map((item, index) => (
                <View style={styles.listcontainer} key={index}>
                  <View style={styles.listcontainerleft}>
                    <Image style={{ width: 60, height: 60, padding: 0, marginRight: 3 }} source={require('../Icons/logosmall3x.png')} />
                  </View>
                  <View style={styles.listcontainerright}>
                    <View style={styles.listcontainerrighttop}>
                      <View style={{ flex: 1, flexDirection: 'row' }}>
                        <Text style={{ fontSize: 15, color: '#4c4b4b' }}>#{item.OrderId} - </Text>
                        <Text style={{ fontSize: 10, color: '#5b5959', marginTop: 3 }}>{item.OrderDate.substring(0, 11)}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12, color: '#5b5959' }}>Distance : {(item.Distance == "0") ? "NA" : item.Distance + " KM"}</Text>
                      </View>
                    </View>
                    <View style={styles.listcontainerrightbottom}>
                      <Text style={{ fontSize: 18, color: '#262424' }}>{item.CustomerName}</Text>
                      <Text style={{ color: '#bcbaba', fontSize: 14 }}>{item.OrderAddress}</Text>
                      <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 4, alignItems: 'flex-start' }}>
                          <Text>Price : ₹ {item.PayableAmount} </Text>
                        </View>
                        <View style={{ flex: 6, alignItems: 'flex-end' }}>
                          <View style={{ backgroundColor: (item.OrderStatus == "ORDER DELIVERED") ? "#2dbe60" : "#cd2121", padding: 5 }}>
                            <Text style={{ color: '#bcbaba', fontSize: 14, marginRight: 3 }}>{item.OrderStatus}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Display enable={this.state.noOrders} style={{ flex: 1 }}>
              <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <Image style={{ width: 120, height: 120, padding: 0 }} source={require('../Icons/noOrder.png')} />
                <Text style={{ fontSize: 10, color: '#5b5959', marginTop: 5 }}>No Orders Delivered Till Now.. </Text>
              </View>
            </Display>
          </Display>


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
  }
}



const styles = StyleSheet.create({
  listcontainer: {
    width: Dimensions.get('window').width - 10, backgroundColor: '#fff', flexDirection: 'row', marginTop: 10, marginLeft: 5
    , borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2, padding: 10,
    shadowRadius: 2, elevation: 2,
  },
  listcontainerleft:
  {
    flex: 1, flexDirection: 'column', marginRight: 3, justifyContent: 'center', alignItems: 'center'
  },
  listcontainerright:
  {
    flex: 4, flexDirection: 'column'
  },
  listcontainerrighttop:
  {
    flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 2
  },
  listcontainerrighttopright:
  {
    flexDirection: 'row', flex: 1, justifyContent: 'flex-end',
  },
  listcontainerrightbottom:
  {
    flex: 3, flexDirection: 'column'
  },
  calenderContainer: {
    height: 100, backgroundColor: '#fff', flexDirection: 'column', margin: 5, padding: 5
  },
  historycontainer:
  {
    backgroundColor: '#EBEBEB', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: 100, margin: 5, borderRadius: 4
  },
  historyordercontainer:
  {
    flex: 3, backgroundColor: '#EBEBEB', height: 120, borderRadius: 4, marginTop: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  historycontainerinnertop:
  {
    flex: 3, flexDirection: 'row'
  },
  historycontainerinnerbottom:
  {
    flex: 1, flexDirection: 'row', height: 30, width: Dimensions.get('window').width - 30, backgroundColor: '#fff', marginBottom: 1, alignItems: 'center', justifyContent: 'center'
  },
  historycontainerinnertopleft:
  {
    flex: 1, flexDirection: 'column', backgroundColor: '#fff', margin: 5, alignItems: 'center', justifyContent: 'center'
  },
  historycontainerinnertopright:
  {
    flex: 1, flexDirection: 'column', backgroundColor: '#fff', margin: 5, alignItems: 'center', justifyContent: 'center'
  },

  networkRequest: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headColor: {
    fontSize: 15, color: '#918f8f', fontWeight: '400', marginBottom: 5
  },
});

export default HistoryScreen;