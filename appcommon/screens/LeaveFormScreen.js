import React from 'react';
import {
    Dimensions, TouchableOpacity, View, Image, Alert, ActivityIndicator, RefreshControl, CheckBox,
    StyleSheet, ScrollView, ListView, Text, TextInput, ToastAndroid
} from 'react-native';
import Display from 'react-native-display';
import DatePicker from 'react-native-datepicker'
import Global from "../Urls/Global";

const BASEPATH = Global.BASE_PATH;
class LeaveFormScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dataObj: this.props.navigation.getParam('userData'),
            checked: false,
            startdate: "",
            enddate: "",
            disabled: true,
            reason: '',
            loader: false,
            checkedValue: 'FULL',
            content: 'Fill Your Reason',
            networkRequest: false,
        }

    }
    toggleSwitch1 = (value) => {
        this.setState({ switch1Value: value })
    }


    applyApproval() {
        console.log("LeaveFormScreen applyApproval() :");
        const formvalue = JSON.stringify({
            'userId': this.state.dataObj.EmployeeId,
            'leave-reason': this.state.reason,
            'leave-start-date': this.state.startdate,
            'leave-end-date': this.state.enddate,
            'leave-type': this.state.checkedValue
        });
        console.log("formData : ", formvalue);
        this.setState({ loader: true, networkRequest: false })
        fetch(BASEPATH + Global.LEAVE_APPLY_URL,
            {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: formvalue
            })
            .then((response) => response.json())
            .then((responseJson) => {
                this.setState({ loader: false })
                ToastAndroid.show("Request Accepted.", ToastAndroid.SHORT)
                console.log(responseJson);
            }).catch((error) => {
                console.log('Promise is rejected with error: ' + error);
                this.setState({ networkRequest: true, loader: false, })
            });
    }


    dateCheck(value, cond) {
        console.log("dateCheck()", value, cond)
        if (cond == "start") {
            this.setState({ startdate: value })
            if (this.state.enddate == "") {
                this.setState({ content: 'Select End Date' })
            }
        }
        if (cond == "end") {
            this.setState({ enddate: value, });
        }
        if (this.state.reason == "") {
            this.setState({ content: 'Fill Your Reason' });
        }
        if (this.state.startdate != "" && this.state.enddate != "" && this.state.reason.length.toString() >= 50) {
            this.setState({ disabled: false, content: 'Apply Request' })
        }
    }

    getReason = (PassHolder) => {
        var Value = PassHolder.length.toString();
        if (Value >= 50) {
            // console.log("Change Now", this.state.startdate, this.state.enddate);
            if (this.state.startdate == "" || this.state.enddate == "") {
                this.setState({ content: 'Select  Date' });
            }
            if (this.state.startdate != "" && this.state.enddate != "") {
                // console.log("Activate");
                this.setState({ disabled: false, content: 'Apply Request' })
            }
            this.setState({ reason: PassHolder });
        }
        else {
            this.setState({ disabled: true, });
        }
    }

    render() {
        return (
            <View style={styles.mainContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>LEAVE APPLICATION FORM</Text>
                </View>
                <Display enable={!this.state.networkRequest} style={{ flex: 1 }}>
                    <ScrollView>
                        <View style={styles.innerContainer}>
                            <View style={styles.viewStyling}>
                                <Text style={styles.headColor}>Name </Text>
                                <Text>{this.state.dataObj.Name}</Text>
                            </View>
                            <View style={styles.viewStyling}>
                                <Text style={styles.headColor}>Designation </Text>
                                <Text>Delivery Executive</Text>
                            </View>
                            <View style={styles.viewStyling}>
                                <Text style={styles.headColor}>Reason </Text>
                                <TextInput
                                    onChangeText={PassHolder => this.getReason(PassHolder)}
                                    multiline={true}
                                    numberOfLines={8}
                                    placeholder='Minimum Of 30 words'
                                />
                            </View>
                            <View style={[styles.viewStyling, { paddingBottom: 5 }]}>
                                <Text style={styles.headColor}>Select Leave Duration </Text>
                                <View>
                                    <Text>From</Text>
                                    <DatePicker
                                        style={{ width: 200 }}
                                        date={this.state.startdate}
                                        mode="date"
                                        placeholder="select date"
                                        format="YYYY-MM-DD"
                                        // minDate="2016-05-01"
                                        // maxDate="2016-06-01"
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
                                        style={{ width: 200 }}
                                        date={this.state.enddate}
                                        mode="date"
                                        placeholder="select date"
                                        format="YYYY-MM-DD"
                                        // minDate="2016-05-01"
                                        // maxDate="2016-06-01"
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
                            <View style={styles.viewStyling}>
                                <Text style={styles.headColor}>Select Day Duration </Text>
                                <View style={styles.dayStyle}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <CheckBox
                                            value={this.state.checked}
                                            onValueChange={() => this.setState({ checked: !this.state.checked, checkedValue: "HALF" })}
                                        />
                                        <Text style={styles.dayText}>Half Day</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row' }}>
                                        <CheckBox
                                            value={!this.state.checked}
                                            onValueChange={() => this.setState({ checked: !this.state.checked, checkedValue: "FULL" })}
                                        />
                                        <Text style={styles.dayText}>Full Day</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                    <TouchableOpacity style={[styles.requestBtn, { opacity: (this.state.disabled ? .6 : 1) }]} disabled={this.state.disabled} onPress={() => this.applyApproval()}>
                        <Display enable={!this.state.loader}>
                            <Text style={styles.requestText}>{this.state.content}</Text>
                        </Display>
                        <Display enable={this.state.loader}>
                            <ActivityIndicator size={"small"} color={'#fff'} ></ActivityIndicator>
                        </Display>
                    </TouchableOpacity>
                </Display>
                <Display enable={this.state.networkRequest} style={styles.networkRequest}>
                    <Image source={require("../assets/networkerror.png")} resizeMode={"center"} style={{ width: 200, height: 200 }} />
                    <Text style={{ marginTop: 3, fontSize: 12, color: '#a39f9f' }}>It seems to be a network error!</Text>
                    <TouchableOpacity style={{ backgroundColor: '#000', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 4, marginTop: 5 }} onPress={() => this.applyApproval()}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '400', }}>Retry</Text>
                    </TouchableOpacity>
                </Display>
            </View>
        );
    }
};



const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#ebebeb'
    },
    header: {
        padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2,
        shadowRadius: 2, elevation: 2,
    },
    headerText: {
        fontSize: 18, fontWeight: 'bold', textDecorationLine: 'underline'
    },
    innerContainer: {
        marginTop: 15, backgroundColor: '#fff', padding: 10
    },
    requestBtn: {
        bottom: 0, padding: 20, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#cd2121',
        width: Dimensions.get('window').width
    },
    requestText: {
        color: '#fff', fontSize: 18, fontWeight: 'bold'
    },
    viewStyling: {
        borderBottomWidth: 1,
        borderBottomColor: '#ebebeb', marginTop: 10
    },
    headColor: {
        fontSize: 15, color: '#918f8f', fontWeight: '400', marginBottom: 5
    },
    dayStyle: {
        // flexDirection:'row'
    },
    dayText: {
        marginTop: 6
    },
    networkRequest: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default LeaveFormScreen;