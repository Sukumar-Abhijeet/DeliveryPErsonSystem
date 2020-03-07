import React from 'react';
import {
    Dimensions, TouchableOpacity, View, Image,
    StyleSheet, ScrollView, ListView, Text, CheckBox, ActivityIndicator, ImageBackground, ToastAndroid, AsyncStorage,
} from 'react-native';
import Display from 'react-native-display';
import CodeInput from 'react-native-confirmation-code-input';
import * as OpenAnything from 'react-native-openanything';
import Modal from 'react-native-modal';
import Global from "../Urls/Global";
import Icon from 'react-native-vector-icons/FontAwesome';
//import { Camera, Permissions, } from 'expo';
import Camera from 'react-native-camera';

const BASEPATH = Global.BASE_PATH;

export class OrderRestaurantScreen extends React.Component {
    constructor(props) {
        super(props);
        const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
        this.state = {
            dataSource: ds.cloneWithRows(['r1']),
            orderId: this.props.navigation.getParam('orderId'),
            orderStatus: this.props.navigation.getParam('orderStatus'),
            dataObj: this.props.navigation.getParam('deliveryData'),
            vendors: [],
            loader: false,
            deliverystart: true,
            paymentstart: false,
            visibleModal: null,
            verifyOtp: false,
            uploadPhoto: false,
            wrongOtp: false,
            camera: false,
            hasCameraPermission: null,
            type: Camera.Constants.Type.back,
            photoClicked: false,
            photo: {},
            cameraLoader: false,
            pictureSize: '640x480',
            collected: false,
            networkRequest: false,
            currentRestaurant: {},
            allRestaurantData: {},
            billData: {
                Products: []
            },
            Paid: false,
            rejectionReasons: [
                {
                    "Reason": "Arrived late",
                    "Value": false,
                },
                {
                    "Reason": "Customer could not receive ",
                    "Value": false,
                },
                {
                    "Reason": "Customer did not answer call",
                    "Value": false,
                },
                {
                    "Reason": "Customer is unreachable",
                    "Value": false,
                },
                {
                    "Reason": "Customer rejected due to packaging issue",
                    "Value": false,
                },
                {
                    "Reason": "Could not locate the customer",
                    "Value": false,
                },
            ],
            cancelReason: '',
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
    inputOtp = (item) => {
        this.setState({ visibleModal: 7, currentRestaurant: item });
    }

    onFinishCheckingCode(otp) {
        console.log("OrderRestaurantScreen  onFinishCheckingCode() : ", otp);
        this.refs.codeInputRef.clear();
        this.setState({ loader: true, verifyOtp: true, wrongOtp: false });
        if (otp == this.state.currentRestaurant.VendorOTP)
            this.setState({ uploadPhoto: true, loader: false, wrongOtp: false })
        else {
            this.setState({ wrongOtp: true, loader: false, verifyOtp: false })
        }
    }

    onFinishUserOtpChecking(otp) {
        console.log("OrderRestaurantScreen  onFinishUserOtpChecking() : ", otp);
        this.refs.codeInputRef.clear();
        this.setState({ loader: true, verifyOtp: true, wrongOtp: false });
        if (otp == this.state.billData.CustomerOTP) {
            this.setState({ visibleModal: null, loader: false, verifyOtp: false })
            this.props.navigation.navigate("PaymentMethod", { billPay: this.state.billData, EmployeeId: this.state.dataObj.EmployeeId, orderId: this.state.orderId });
            console.log("Navigate To paymnet");
        }
        else {
            this.setState({ wrongOtp: true, loader: false, verifyOtp: false })
        }
    }



    // async camera() {
    //     console.log("OrderRestaurantScreen async Camera()");
    //     const { status: existingStatus } = await Permissions.getAsync(
    //         Permissions.CAMERA
    //     );
    //     this.setState({ hasCameraPermission: status === 'granted', cameraSwitch: false, photoClicked: false, loader: false, });
    // }

    snap() {
        //this.setState({ cameraLoader: true, camera: false, });
        console.log("Photo snap()");
        this.camera.capture().then((data) =>
            console.log(data),
            this.state.photo = data
        )
            .catch(err => console.error(err));
        this.setState({ cameraLoader: false, camera: false, photoClicked: true });
    }

    savePhoto = () => {
        console.log('savePhoto ()');
        this.setState({ camera: false, cameraLoader: false, photoClicked: false, loader: false, visibleModal: null, verifyOtp: false, uploadPhoto: false, loader: true, networkRequest: false });
        console.log("File", this.state.photo);
        let localUri = this.state.photo.uri;
        let filename = localUri.split('/').pop();

        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image`;

        let formData = new FormData();
        formData.append('del-per-id', this.state.dataObj.EmployeeId);
        formData.append('order-id', this.state.orderId);
        formData.append('rest-id', this.state.currentRestaurant.VendorId);
        formData.append('order-image', { uri: localUri, name: filename, type });
        console.log("COLLECT_ORDER_FROM_RESTAURANT formValue ", formData);
        fetch(BASEPATH + Global.COLLECT_ORDER_FROM_RESTAURANT, {
            method: "POST",
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            body: formData
        }).then((response) => response.json()).then((responseJson) => {
            console.log("COLLECT ORDER response", responseJson);
            if (responseJson.Success == "Y") {
                this.setState({ visibleModal: null }, () => {
                    this.fetchRestaurantDetails();
                });
            }
            else {
                ToastAndroid.show(responseJson.Message, ToastAndroid.SHORT);
            }
            // this.setState({ loader: false })
        }).catch((error) => {
            console.log('Promise is rejected with error: ' + error);
            ToastAndroid.show("Network error , please try again", ToastAndroid.SHORT);
            this.setState({ networkRequest: true, loader: false, })
        });
    }
    fetchBillingInfo() {
        console.log("OrderRestaurantScreen fetchBillingInfo():")
        const formValue = JSON.stringify({
            'del-per-id': this.state.dataObj.EmployeeId,
            'order-id': this.state.orderId,
        });
        console.log("OrderRestaurantScreen fetchBillingInfo() : ", formValue);
        fetch(BASEPATH + Global.GET_BILLING_ORDER_DETAILS, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: formValue
        }).then((response) => response.json()).then((responseJson) => {
            if (responseJson.Success == "Y") {
                console.log(responseJson.Data);
                this.setState({ billData: responseJson.Data, loader: false, })
                if (responseJson.Data.OrderOf == "bmfbusiness" && responseJson.Data.PaymentMethod == "CREDIT") {
                    this.setState({ Paid: true })
                }
                else {
                    this.setState({ Paid: false })
                }
            }
        }).catch((error) => {
            console.log('Promise is rejected with error: ' + error);
            ToastAndroid.show("Network error , please try again", ToastAndroid.SHORT);
            this.setState({ networkRequest: true, loader: false, })
        });
    }

    fetchRestaurantDetails() {
        console.log("OrderRestaurantScreen fetchRestaurantDetails():", this.state.orderId, this.state.dataObj.EmployeeId);
        this.setState({ networkRequest: false, loader: true });
        const formValue = JSON.stringify({
            'del-per-id': this.state.dataObj.EmployeeId,
            'order-id': this.state.orderId,
        });
        console.log("OrderRestaurantScreen fetchRestaurantDetails() : ", formValue);
        fetch(BASEPATH + Global.GET_ORDER_DETAILS, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: formValue
        }).then((response) => response.json()).then((responseJson) => {
            if (responseJson.Success == "Y") {
                console.log("GET_ORDER_DETAILS response", responseJson);
                this.setState({ loader: false, orderStatus: responseJson.Data.OrderStatus, vendors: responseJson.Data.Vendors, allRestaurantData: responseJson.Data })
                if (responseJson.Data.OrderStatus == "Out For Delivery") {
                    this.setState({ loader: true })
                    this.fetchBillingInfo();
                }
            }
        }).catch((error) => {
            console.log('Promise is rejected with error: ' + error);
            ToastAndroid.show("Network error , please try again", ToastAndroid.SHORT);
            this.setState({ networkRequest: true, loader: false, })
        });
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

    getAppDataObj() {
        console.log("OrderRestaurantScreen getAppDataobj()");
        this.retrieveItem('AppOrderObj').then((data) => {
            if (data != null) {
                this.setState({ appOrderObj: data })
                //this.setState({ ifnotLoggedIn: true });
            }
        }).catch((error) => {
            console.log('Promise is rejected with error: ' + error);
        });
    }

    __renderRestaurantOtpContent = () => (
        <View style={styles.otpContainer}>
            <Display enable={!this.state.camera && !this.state.photoClicked}>
                <View style={{ paddingTop: 20 }}>
                    <Text style={{ fontSize: 25, fontWeight: 'bold', color: '#cd2121' }}>{this.state.currentRestaurant.VendorName}</Text>
                </View>
                <View style={{ paddingTop: 50 }}>
                    <Display style={{ height: 90 }} enable={!this.state.verifyOtp}>
                        <CodeInput
                            ref="codeInputRef"
                            secureTextEntry={false}
                            codeLength={4}
                            activeColor='rgba(49, 180, 4, 1)'
                            inactiveColor='rgba(49, 180, 4, 1.3)'
                            autoFocus={false}
                            keyboardType="numeric"
                            ignoreCase={true}
                            inputPosition='center'
                            size={50}
                            onFulfill={(code) => this.onFinishCheckingCode(code)}
                            containerStyle={{ marginTop: 30 }}
                            codeInputStyle={{ borderWidth: 1.5 }}
                        />
                    </Display>
                    <Display enable={this.state.loader} style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#CD2121" />
                        <Text style={{ color: 'green', fontSize: 16 }}>Verifying ...</Text>
                    </Display>
                    <Display enable={!this.state.verifyOtp} style={{ marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#cec4c4', fontSize: 14 }}>Please Ask the Restaurant for Otp!</Text>
                    </Display>
                    <Display enable={this.state.wrongOtp} style={{ marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#cd2121', fontSize: 18 }}>Invalid Otp !</Text>
                    </Display>
                    <Display enable={this.state.uploadPhoto} style={{ padding: 10, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#605d5d', borderRadius: 50, width: 100, height: 100 }} onPress={() => this.setState({ camera: true })}>
                                <Image style={{ width: 60, height: 60, padding: 0 }} source={require('../Icons/camera.png')} resizeMode={'center'} />
                            </TouchableOpacity>
                            <Text style={{ color: '#cec4c4', fontSize: 14, marginTop: 15 }}>Upload Cooked Food Image</Text>
                        </View>
                    </Display>
                </View>
            </Display>
            <Display enable={this.state.camera} style={{ backgroundColor: 'red', flex: 1, width: '100%' }}>
                <Camera style={{ flex: 1 }} type={this.state.type} ref={ref => { this.camera = ref; }}
                    pictureSize={this.state.pictureSize}
                    autoFocus={Camera.constants.AutoFocus.on}
                    aspect={Camera.constants.Aspect.fill}
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            flexDirection: 'column',
                        }}>
                        <View style={styles.camerTop}>
                            <TouchableOpacity onPress={() => this.setState({ camera: false, })} >
                                <Icon name="times" size={20} color="#cd2121" style={{}} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.cameraBottom}>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => this.snap()}>
                                    <Icon name="camera" size={35} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Camera>
            </Display>
            <Display enable={this.state.cameraLoader} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#CD2121" />
                <Text style={{ color: 'green', fontSize: 16 }}>Just a moment ..</Text>
            </Display>
            <Display enable={this.state.photoClicked && !this.state.cameraLoader} style={{ flex: 1, padding: 5 }}>
                <ScrollView>
                    <ImageBackground source={{ uri: this.state.photo.uri }} style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height, padding: 10, }}>
                        <View style={{ height: 50, padding: 10, }}>
                            <TouchableOpacity style={{ width: 100 }} onPress={() => this.setState({ camera: true, photoClicked: false, cameraLoader: false })}>
                                <View style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 5, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
                                    <Icon name="times" size={22} color="#cd2121" />
                                    <Text style={{ color: '#cd2121', marginLeft: 3 }}>Retry</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ width: 100, marginTop: 8 }} onPress={this.savePhoto.bind(this)}>
                                <View style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 5, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
                                    <Icon name="check" size={22} color="green" />
                                    <Text style={{ color: 'green', marginLeft: 3 }}>Upload</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ImageBackground>
                </ScrollView>
            </Display>
        </View>
    )

    __renderUserOtpContent = () => (
        <View style={styles.otpContainer}>
            {/* <Display enable={this.state.userOtp}> */}
            <View style={{ paddingTop: 20 }}>
                <Text style={{ fontSize: 25, fontWeight: 'bold', color: '#cd2121' }}>{this.state.billData.CustomerName}</Text>
            </View>
            <View style={{ paddingTop: 50 }}>
                <Display style={{ height: 90 }} enable={!this.state.verifyOtp}>
                    <CodeInput
                        ref="codeInputRef"
                        secureTextEntry={false}
                        codeLength={4}
                        activeColor='rgba(49, 180, 4, 1)'
                        inactiveColor='rgba(49, 180, 4, 1.3)'
                        autoFocus={false}
                        keyboardType="numeric"
                        ignoreCase={true}
                        inputPosition='center'
                        size={50}
                        onFulfill={(code) => this.onFinishUserOtpChecking(code)}
                        containerStyle={{ marginTop: 30 }}
                        codeInputStyle={{ borderWidth: 1.5 }}
                    />
                </Display>
                <Display enable={this.state.loader} style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#CD2121" />
                    <Text style={{ color: 'green', fontSize: 16 }}>Verifying ...</Text>
                </Display>
                <Display enable={!this.state.verifyOtp} style={{ marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#cec4c4', fontSize: 14 }}>Please Ask the Customer for Otp!</Text>
                </Display>
                <Display enable={this.state.wrongOtp} style={{ marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#cd2121', fontSize: 18 }}>Invalid Otp !</Text>
                </Display>
            </View>
        </View>
    )

    changeRejectionReason(item) {
        let resArr = this.state.rejectionReasons;
        for (let i = 0; i < resArr.length; i++) {
            resArr[i].Value = (item.Reason == resArr[i].Reason)
        }
        this.setState({ rejectionReasons: resArr, cancelReason: item.Reason });
    }

    stopDistanceCal = () => {
        console.log('OrderRestaurantScreen stopDistanceCal()');
        console.log("OrderRestaurantScreen stopDistanceCal() ");
        console.log("Routes ", this.state.appOrderObj.ongoingObj.distanceRoute);
        console.log("Distance ", this.state.appOrderObj.ongoingObj.distance);
        this.rejectOrder(this.state.appOrderObj.ongoingObj.distanceRoute, this.state.appOrderObj.ongoingObj.distance);
    }

    rejectOrder(routeCoordinates, distance) {
        this.setState({ loader: true })
        console.log('Distance: ', distance);
        console.log('Route cordinated: ', routeCoordinates);
        if (this.state.cancelReason == '') {
            ToastAndroid.show("No reasons selected", ToastAndroid.LONG);
        }
        else {
            let tempDistance = distance;
            ToastAndroid.show("Distance Travelled : " + tempDistance, ToastAndroid.LONG);
            let stringformat = JSON.stringify(routeCoordinates);
            let lat = stringformat.replace(/latitude/g, "lat");
            let route = lat.replace(/longitude/g, "lng");
            const formValue = JSON.stringify({
                'del-per-id': this.state.dataObj.EmployeeId,
                'order-id': this.state.orderId,
                'order-distance-route': route,
                'order-distance': tempDistance,
                'order-cancel-reason': this.state.cancelReason
            })
            console.log("REJECT_ORDER formValue", formValue);

            fetch(BASEPATH + Global.REJECT_ORDER, {
                method: "POST",
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                body: formValue
            }).then((response) => response.json()).then((responseJson) => {
                console.log("COLLECT REJECT_ORDER response", responseJson);
                if (responseJson.Success == "Y") {
                    let appOrderObj = this.state.appOrderObj;
                    let idx = appOrderObj.orderQueue.indexOf(this.state.orderId);
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

                    this.setState({ visibleModal: null }, () => {
                        this.props.navigation.navigate('Tabs');
                    });
                }
                else {
                    ToastAndroid.show(responseJson.Message, ToastAndroid.SHORT);
                }
            }).catch((error) => {
                //console.log('Promise is rejected with error: ' + error);
                ToastAndroid.show("Network error , please try again", ToastAndroid.SHORT);
                // this.setState({ networkRequest: true, loader: false, })
            });

        }
        this.setState({ loader: false })

    }

    __renderRejectOrderContent = () => (
        <View style={[styles.otpContainer, { padding: 10, alignItems: 'flex-start' }]}>
            <Text style={{ color: '#cd2121', fontSize: 22, fontWeight: '600', alignSelf: 'center' }}>ORDER REJECTION</Text>

            <View style={{ flex: 1, marginTop: 10 }}>
                <Text style={{ color: '#ada8a8', fontSize: 15 }}>Select Rejection Reason : </Text>
                <ScrollView style={{ flex: 1, marginTop: 10 }} showsVerticalScrollIndicator={false}>
                    {this.state.rejectionReasons.map((item, index) => (
                        <View style={{ flexDirection: 'row' }} key={index}>
                            <CheckBox
                                value={item.Value}
                                onValueChange={() => this.changeRejectionReason(item)}
                            />
                            <Text style={styles.dayText}>{item.Reason}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            <TouchableOpacity onPress={() => this.stopDistanceCal()} style={{ backgroundColor: '#cd2121', padding: 8, width: '100%', bottom: 0, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                <Display enable={!this.state.loader}>
                    <Text style={{ fontSize: 14, fontWeight: '300', color: '#fff' }}>SUBMIT</Text>
                </Display>
                <Display enable={this.state.loader}>
                    <ActivityIndicator size="large" color="#CD2121" />
                </Display>
            </TouchableOpacity>
        </View>
    )

    async cameraPermission() {
        console.log("OrderRestaurantScreen cameraPermission:");
        const cameraStatus = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
        );
        if (cameraStatus !== 'granted') {
            await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    'title': 'BMFRunner App Camera Permission',
                    'message': 'BMFRunner App needs access to your camera ' +
                        'so you can take awesome pictures.'
                }
            )
        }
    }

    componentDidMount() {
        console.log("OrderRestaurantScreen componentDidMount()");
        this.fetchRestaurantDetails();
        this.getAppDataObj();

    }

    componentWillMount() {
        console.log("OrderRestaurantScreen componentWillMount()")
        this.cameraPermission();
    }

    render() {

        return (
            <View style={styles.MainContainer}>
                <View style={styles.header}>
                    <View style={{ flex: 1, alignItems: 'flex-start', flexDirection: 'row' }}>
                        <TouchableOpacity>
                            <Icon name="arrow-left" size={22} color="#000" />
                        </TouchableOpacity>
                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 20, marginLeft: 5 }}> #{this.state.orderId} </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <View style={{ backgroundColor: '#cd2121', borderRadius: 4, padding: 5 }}>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '300' }}>{this.state.orderStatus}</Text>
                        </View>
                    </View>
                </View>
                <Display enable={this.state.loader} style={{ height: Dimensions.get('window').height, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#CD2121" />
                </Display>
                <Display style={{ padding: 5, flex: 1 }} enable={!this.state.networkRequest}>
                    <Display enable={this.state.orderStatus == "Cooking"} style={{ flex: 1 }}>
                        <ScrollView>
                            {this.state.vendors.map((item, index) => (
                                <View style={styles.hotelCard} key={index}>
                                    <View style={{ height: 'auto', justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row', padding: 10, paddingVertical: 20, borderBottomColor: '#d8d0d0', borderBottomWidth: 1 }}>
                                        <View style={{ flex: 8, justifyContent: 'flex-start' }}>
                                            <Text style={{ color: '#000', marginRight: 6, fontSize: 18, fontWeight: 'bold' }}>{item.VendorName}</Text>
                                        </View>
                                        <TouchableOpacity style={{ flex: 2, justifyContent: 'flex-end', alignItems: 'flex-end', marginRight: 5 }} onPress={() => OpenAnything.Call(item.VendorPhone)}>
                                            <Image style={{ width: 17, height: 17, padding: 0 }} source={require('../Icons/calling.png')} />
                                        </TouchableOpacity>
                                    </View>
                                    {item.Products.map((itm, idx) => (
                                        <View style={{ flex: 1, padding: 15, paddingTop: 15, flexDirection: 'row', borderBottomColor: '#ebebeb', borderBottomWidth: 1, justifyContent: 'space-between' }} key={idx}>
                                            <View style={{ flex: 6, }}>
                                                <View style={{ flexDirection: 'row' }}>
                                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#969393' }}>{itm.ProductName}</Text>
                                                    <Text>{itm.Variant != "" ? " - " + itm.Variant : ""}</Text>
                                                </View>
                                                <Display enable={itm.Addons != ""} style={{ flexDirection: 'row' }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '400', color: '#969393', marginLeft: 4, fontStyle: 'italic' }}>with</Text>
                                                    <Text> {itm.Addons}</Text>
                                                </Display>
                                            </View>
                                            <View style={{ flex: 2, alignItems: 'flex-end' }}>
                                                <Text>X</Text>
                                            </View>
                                            <View style={{ flex: 2, alignItems: 'center' }}>
                                                <Text style={{ fontSize: 12, fontWeight: '400' }}>{itm.Qty}</Text>
                                            </View>
                                        </View>
                                    ))}
                                    <Display enable={item.RestOrderStatus == 'Cooking'} style={{ height: 50 }}>
                                        <TouchableOpacity style={{ flex: 1, backgroundColor: '#2dbe60', justifyContent: 'center', alignItems: 'center' }} onPress={this.inputOtp.bind(this, item)}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>GET OTP</Text>
                                        </TouchableOpacity>
                                    </Display>
                                    <Display enable={item.RestOrderStatus == 'OrderPicked'} style={{ height: 50 }}>
                                        <View style={{ flex: 1, backgroundColor: '#2dbe60', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                                            <Icon name="check" size={20} color="#fff" />
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, marginLeft: 5 }}>Collected </Text>
                                        </View>
                                    </Display>
                                </View>
                            ))}
                        </ScrollView>
                    </Display>
                    <Modal isVisible={this.state.visibleModal === 7} style={styles.bottomModal} onBackButtonPress={() => this.setState({ visibleModal: null })} onRequestClose={() => { this.setState({ visibleModal: null }) }}>
                        {this.__renderRestaurantOtpContent()}
                    </Modal>
                    <Display enable={this.state.orderStatus == "Out For Delivery"} style={{ flex: 1, }}>
                        <View style={styles.billCard}>
                            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row', padding: 10, paddingVertical: 20, borderBottomColor: '#d8d0d0', borderBottomWidth: 1 }}>
                                <View style={{ flex: 8, justifyContent: 'flex-start' }}>
                                    <Text style={{ color: '#a8a6a6', marginRight: 6, fontSize: 15, fontWeight: '400' }}>#BillingInfo.</Text>
                                    <Text style={{ color: '#000', marginRight: 6, fontSize: 18, fontWeight: 'bold' }}>{this.state.billData.CustomerName}</Text>
                                </View>
                                <View style={{ flex: 2, justifyContent: 'flex-end', alignItems: 'flex-end', marginRight: 5, flexDirection: 'row' }}>
                                    <TouchableOpacity style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', marginRight: 5 }} onPress={() => OpenAnything.Call(this.state.billData.CustomerPhone)}>
                                        <Image style={{ width: 17, height: 17, padding: 0 }} source={require('../Icons/calling.png')} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', marginRight: 5 }} onPress={() => OpenAnything.Map(this.state.billData.GeoLocation)}>
                                        <Image style={{ width: 17, height: 17, padding: 0 }} source={require('../Icons/navigation.png')} />
                                    </TouchableOpacity>
                                </View>

                            </View>
                            <View style={{ flex: 8, padding: 10 }}>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <Text style={{ color: '#ada8a8' }}>Order details. </Text>
                                    <View style={{ flex: 1, padding: 15, paddingTop: 15, paddingBottom: 0 }}>
                                        {this.state.billData.Products.map((itm, idx) => (
                                            <View style={{ flex: 1, flexDirection: 'row', }} key={idx}>
                                                <View style={{ flex: 6 }}>
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <Text style={{ fontSize: 14, fontWeight: '200', color: '#777575' }}>{itm.ProductName}</Text>
                                                        <Text>{itm.Variant != "" ? " - " + itm.Variant : ""}</Text>
                                                    </View>
                                                    <Display enable={itm.Addons != ""} style={{ flexDirection: 'row' }}>
                                                        <Text style={{ fontSize: 10, fontWeight: '400', color: '#969393', marginLeft: 4, fontStyle: 'italic' }}>with</Text>
                                                        <Text> {itm.Addons}</Text>
                                                    </Display>
                                                </View>
                                                <View style={{ flex: 2, alignItems: 'flex-start', }}>
                                                    <Text style={{ color: '#777575' }}>X {itm.Qty}</Text>
                                                </View>
                                                {/* <View style={{ flex: 2, alignItems: 'flex-end' }}>
                                                <Text style={{ fontSize: 12, fontWeight: '400', color: '#777575' }}>₹ 100.00 </Text>
                                            </View> */}
                                            </View>
                                        ))}
                                        <View style={{ flex: 1, marginTop: 25, borderTopColor: '#ebebeb', borderTopWidth: 1, paddingTop: 5 }}>
                                            {/* <View style={{ flexDirection: 'row', paddingBottom: 5, borderBottomColor: '#bdbdbd', borderBottomWidth: 0.2 }}>
                                                <View style={{ flex: 4 }}>
                                                    <Text style={styles.editText}>Item Total</Text>
                                                    <Text style={styles.editText}>Packaging Charge</Text>
                                                    <Text style={styles.editText}>GST</Text>
                                                </View>

                                                <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                                                    <Text style={styles.editText}>₹ 100.00</Text>
                                                    <Text style={styles.editText}>₹ 20.00</Text>
                                                    <Text style={styles.editText}>₹ 11.40</Text>
                                                </View>
                                            </View> */}

                                            <View style={{ flexDirection: 'row', marginTop: 5 }}>
                                                <View style={{ flex: 4 }}>
                                                    {/* <Text style={styles.editText}>Delivery Charges</Text>
                                                    <Display enable={true}>
                                                        <Text style={styles.editText}>Surplus Charges</Text>
                                                    </Display>
                                                    <Text style={{ color: '#2dbe60', fontSize: 16 }}>Discount</Text>
                                                    <Text style={styles.editText}>Wallet</Text> */}
                                                    <Text style={[styles.editText, { fontSize: 20, color: '#616161', fontWeight: 'bold' }]}>To Collect</Text>
                                                </View>
                                                <View style={{ flex: 2, justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 50 }}>
                                                    {/* <Text style={styles.editText}>₹ 5.00</Text>
                                                    <Display enable={true}>
                                                        <Text style={styles.editText}>₹ 30.00</Text>
                                                    </Display>
                                                    <Text style={{ color: '#2dbe60', fontSize: 15 }}>₹ 400.00</Text>
                                                    <Text style={styles.editText}>₹ 0.00</Text> */}
                                                    <Text style={[styles.editText, { fontSize: 17, color: '#616161', fontWeight: '600', }]}>₹ {this.state.billData.OrderAmount}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={{ color: '#ada8a8', }}>Payment Status </Text>
                                    <View style={{ flex: 1, padding: 15, paddingTop: 5, justifyContent: 'center', alignItems: 'center' }}>
                                        <Display enable={this.state.Paid} style={{ flex: 1 }}>
                                            <View style={{ backgroundColor: '#2dbe60', padding: 5 }}>
                                                <Text style={{ color: '#fff', fontSize: 15 }}>PAID</Text>
                                            </View>
                                        </Display>
                                        <Display enable={!this.state.Paid} style={{ flex: 1 }} >
                                            <View style={{ backgroundColor: (this.state.billData.PaymentStatus == 'Pending') ? '#cd2121' : '#2dbe60', padding: 5 }}>
                                                <Text style={{ color: '#fff', fontSize: 15 }}>{this.state.billData.PaymentStatus}</Text>
                                            </View>
                                        </Display>
                                    </View>
                                    <Text style={{ color: '#ada8a8', marginTop: 4 }}>Delivery Address </Text>
                                    <View style={{ flex: 1, padding: 15, paddingTop: 5, }}>
                                        <Text style={{ color: '#7a7777', fontSize: 15 }}>{this.state.billData.DeliveryAddress}</Text>
                                    </View>

                                </ScrollView>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <TouchableOpacity style={{ flex: 1, backgroundColor: '#2dbe60', width: '100%', justifyContent: 'center', alignItems: 'center' }} onPress={() => this.setState({ visibleModal: 9 })}>
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>ENTER OTP</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flex: 1, backgroundColor: '#cd2121', width: '100%', justifyContent: 'center', alignItems: 'center' }} onPress={() => this.setState({ visibleModal: 12 })}>
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>REJECT ORDER</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </Display>

                    <Modal isVisible={this.state.visibleModal === 9} style={styles.bottomModal} onBackButtonPress={() => this.setState({ visibleModal: null })} onRequestClose={() => { this.setState({ visibleModal: null }) }}>
                        {this.__renderUserOtpContent()}
                    </Modal>

                    <Modal isVisible={this.state.visibleModal === 12} style={styles.bottomModal} onBackButtonPress={() => this.setState({ visibleModal: null })} onRequestClose={() => { this.setState({ visibleModal: null }) }}>
                        {this.__renderRejectOrderContent()}
                    </Modal>

                </Display>
                <Display enable={this.state.networkRequest} style={styles.networkRequest}>
                    <Image source={require("../assets/networkerror.png")} resizeMode={"center"} style={{ width: 200, height: 200 }} />
                    <Text style={{ marginTop: 3, fontSize: 12, color: '#a39f9f' }}>It seems to be a network error!</Text>
                    <TouchableOpacity style={{ backgroundColor: '#000', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 4, marginTop: 5 }} onPress={() => this.fetchRestaurantDetails()}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '400', }}>Retry</Text>
                    </TouchableOpacity>
                </Display>
            </View>
        );
    }
}


const styles = StyleSheet.create({
    MainContainer:
    {
        flexDirection: 'column', flex: 1
    },
    header: {
        height: 50,
        backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2, padding: 10,
        shadowRadius: 2, elevation: 2, flexDirection: 'row'
    },
    hotelCard:
    {
        backgroundColor: '#fff', marginBottom: 5
        , borderRadius: 5, shadowColor: '#000', shadowOpacity: 0.2,
        shadowRadius: 2, elevation: 2,
    },
    billCard: {
        flex: 1,
        backgroundColor: '#fff'
        , borderRadius: 5, shadowColor: '#000', shadowOpacity: 0.2,
        shadowRadius: 2, elevation: 2,
    },
    otpContainer:
    {
        width: null,
        backgroundColor: '#fff',
        height: Dimensions.get('window').height / 2,
        flexDirection: 'column',
        padding: 0, alignItems: 'center',
    },
    bottomModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    camerTop:
    {
        flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', paddingHorizontal: 15,
    },
    cameraBottom:
    {
        flex: 9, justifyContent: 'center', alignItems: 'center', padding: 20, flexDirection: 'row'

    },
    editText:
    {
        color: '#585858',
        fontSize: 14
    },
    networkRequest: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dayText: {
        marginTop: 6
    },

});

export default OrderRestaurantScreen;