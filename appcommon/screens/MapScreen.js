import React from 'react';
import { Dimensions,TouchableOpacity ,View ,Image,Alert,
 StyleSheet,ScrollView ,ListView, Text,TextInput,Modal } from 'react-native';
 import MapView from 'react-native-maps';
 import MapViewDirections from 'react-native-maps-directions';
 import { showLocation } from 'react-native-map-link'
 const GOOGLE_MAPS_APIKEY = 'AIzaSyD5g2tAVuhgDtpUG456y8XPetZLxwy0vlA';

export class MapScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      findAddress: this.props.navigation.getParam('deliveryAddress'),  
      houseno: '',
      landmark: '',
      text: 'ENTER HOUSE/FLAT NO',
      locationstatus: true,
      save: '',
      address: 'Fetching',
      pincode: '',
      addressType: '',
      disabled: true,
      loader: false,
      error: '',
      mapRegion: {
        latitude: 20.3011504,
        longitude: 85.6803644,
        latitudeDelta: 0.012,
        longitudeDelta: 0.023,
      },
     markerRegion: {
        latitude: 20.3011504,
        longitude: 85.6803644,
        latitudeDelta: 0.012,
        longitudeDelta: 0.023,
      },
      lastLat: 0,
      lastLong: 0
    }

  }
  checkRecentLocation(){
    console.log("MapScreen checkRecentLocation() data: ", this.state.findAddress);
    fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + this.state.findAddress + '').then((response) => response.json()).then((responseJson) => {
      if (responseJson.status == "OK") 
      {
        let ac = responseJson.results[0];
        let position = ac.geometry.location;
        console.log("Postion: ", position);
        global.navigatelat =  position.lat;
        global.navigatelng = position.lng;
        this.setState({
          markerRegion: {
            latitude: position.lat,
            longitude: position.lng,
            latitudeDelta: 0.0092,
            longitudeDelta: 0.0042
          }
        }
        , () => {
            this.fetchAddress();
          }
      )
      }
    });
  }
  componentWillMount()
   {
     this.checkRecentLocation();
    // UIManager.setLayoutAnimationEnabledExperimental(true);
    console.log("LocationScreen componentWillMount()");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        var position = position.coords;
        console.log("POsition: ", position);
        global.sourcelat = position.latitude
        global.sourcelng = position.longitude
        this.setState({
          mapRegion: {
           
            latitude: position.latitude,
            longitude: position.longitude,
            latitudeDelta: 0.0092,
            longitudeDelta: 0.0042
          }
        }
        // , () => {
        //   this.fetchAddress();
        // }
      );
      },
      (error) => alert(error.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );


  }
   
      fetchAddress() {
        console.log("MapScreen fetchAddress() MapRegion: ", this.state.markerRegion);
        fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + this.state.markerRegion.latitude + ',' + this.state.markerRegion.longitude /*+ '&key=AIzaSyCtzTZ0vG5f6DnfWkkGs5qsOA33BBbn74c'*/)
          .then((response) => response.json())
          .then((responseJson) => {
            if (responseJson.status == "OK") {
              let address_components = responseJson.results[0];
              let address = address_components.formatted_address;
              let addrComp = address_components.address_components.reverse();
              let pincode = "";
              for (let i = 0; i < addrComp.length; i++) {
                let item = addrComp[i];
                let itemType = item.types;
                for (let j = 0; j < itemType.length; j++) 
                {
                  if (itemType[j] == "postal_code") {
                    pincode = item.long_name;
                    break;
                  }
                }
                if (pincode != "") 
                {
                  break;
                }
              }
              console.log('ADDRESS GEOCODE is BACK!! => ' + address);
              console.log("Pincode: ", pincode);
              this.setState({ address: address });
              this.setState({ addressType: "AUTOMATIC", pincode: pincode });
            }
            else { Alert.alert(responseJson.status) }
          })
      }
      openMap()
      { 
        console.log("Working")
          showLocation({
            latitude: global.navigatelat,
            longitude: global.navigatelng,
            sourceLatitude: global.sourcelat,  // optionally specify starting location for directions
            sourceLongitude:global.sourcelng,  // not optional if sourceLatitude is specified
            title: '',  // optional
            googleForceLatLon: true,  // optionally force GoogleMaps to use the latlon for the query instead of the title
            googlePlaceId: '',  // optionally specify the google-place-id
            dialogTitle: 'Navigate To Delivery Address', // optional (default: 'Open in Maps')
            //dialogMessage: 'This is the amazing dialog Message', // optional (default: 'What app would you like to use?')
            cancelText: 'Cancel ?', // optional (default: 'Cancel')
            appsWhiteList: ['google-maps'] // optionally you can set which apps to show (default: will show all supported apps installed on device)
            // app: 'uber'  // optionally specify specific app to use
           })
        }
       
      
   render() {
    return ( 
      <View style={styles.mainContainer}>
       <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' , flexDirection:'row' }}>
        <View style={{flex:8,justifyContent:'flex-start'}}>
        <Text style={{color:'#000',marginRight:6, fontSize:18,fontWeight:'bold'}}>Location on map</Text>
        </View>
        <TouchableOpacity style={{flex:2,justifyContent:'flex-end', alignContent:'flex-end'}} onPress={this.openMap}>
             <Image style={{ width: 25, height: 25 ,padding:0 }} source={require('../Icons/navigation.png')}/>
        </TouchableOpacity>
      </View>
        <MapView style={styles.mapContainer}
          region={this.state.mapRegion}
          showsUserLocation={true}
          followUserLocation={true}
        // annotations={markers}
        // onRegionChange={this.onRegionChange.bind(this)}
        // onPress={this.onMapPress.bind(this)}
        >
          <MapView.Marker
            image={require('../Icons/marker.png')}
            coordinate={this.state.markerRegion}
            draggable={false}
            // onDragEnd={
            //   (position) => {
            //     console.log("Working")
            //     var position = position.nativeEvent.coordinate;
            //     this.setState({
            //       mapRegion: {
            //         latitude: position.latitude,
            //         longitude: position.longitude,
            //         latitudeDelta: 0.0092,
            //         longitudeDelta: 0.0042
            //       }
            //     }, () => {
            //       this.fetchAddress();
            //     });
            //   }
            // }
          //  onDragEnd={(e) => this.setState({ mapRegion: e.nativeEvent.coordinate},()=>this.fetchAddress)}
          // onDragEnd={(e) => console.log(e.nativeEvent.coordinate.latitude)}
          >
          </MapView.Marker>
          <MapViewDirections
            origin={this.state.mapRegion}
            destination={this.state.markerRegion}
            apikey={GOOGLE_MAPS_APIKEY}
            mode = "driving"
            // waypoints ={3}
            strokeWidth={6}
             strokeColor="#cd2121"
             onReady={(result) => {
              this.mapView.fitToCoordinates(result.coordinates, 
              {
                edgePadding: {
                  right: (width / 20),
                  bottom: (height / 20),
                  left: (width / 20),
                  top: (height / 20),
                }
              });
            }}
            onError={(errorMessage) => {
              // console.log('GOT AN ERROR');
            }}
          />
        </MapView>
        <View style={{ flex: 2,padding:10 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Showing Delivery Address</Text>
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 10, color: '#9b9ba2' }}>LOCATION</Text>
              <TextInput
                style={{ marginTop: 0, paddingBottom: 10 }}
                // title="NAME"
                value={this.state.address}
                multiline={true}
                editable={false}
                placeholderTextColor="#fff"
                underlineColorAndroid='#a09d9d'
                onChangeText={(location) => this.setState({ location })}
                ref={component => this._phoneInput = component}
              />
            </View>
          </View>
        </View>
    );
  }
}



// export class MapHeaderStyle extends React.Component {
//   render(){
  
//     return (
     
//     );
//   }
// }
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: null,
    height: null,
    backgroundColor: '#fff'
  },
  mapContainer:
  {
    flex: 7,
    width: Dimensions.get('window').width,
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailsContainer:
  {
    flex: 3,
    padding: 15
  },
  detailsContainer2:
  {
    flex: 8,
    padding: 15,
    paddingBottom: 0

  },
  lowerContainer:
  {

    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff'
  },
});

export default MapScreen;