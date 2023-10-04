import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View, Button,Text } from 'react-native';
import { useEffect, useState } from 'react';
import { openDatabase, createTables, getMapInfo} from '../data/mapDB';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

const url = 'localhost:88'; // Replace with your API base URL
 const callApi = async (endpoint, method = 'GET', data = null) => {
  try {
    const url = `${url}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      // Add any other headers you need here
    };

    const options = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const jsonResponse = await response.json();
    return jsonResponse; // Return the entire JSON response
  } catch (error) {
    throw error;
  }
};




export default function Map() {
  // const [data, setData] = useState(undefined);

  // const getAPIdata = async() =>{
  //   const url = "localhost:88/databaseUsuarios";
  //   let result = await fetch(url);
  //   result = result.json();
  //   setData(result)
  // }
  // useEffect(() => {
  //   getAPIdata();
  // },[])

  const fetchData = async () => {
    try {
      const response = await callApi('/databaseUsuarios', 'GET');
      console.log(response); // This will log the entire JSON response
      // Access specific data within the response as needed
      const responseData = response.data; // Replace 'data' with the actual key in your JSON response
      console.log(responseData);
    } catch (error) {
      console.error(error);
      // Handle errors here
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  
  const [mapRegion, setMapRegion] = useState({
    latitude: -31.31320035959943,
    longitude: -64.22334981122708,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [markers, setMarkers] = useState([]); // Initialize with imported data
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
  
      if (status !== 'granted') {
        setErrorMsg('El acceso a la ubicación fue denegado');
        return;
      }
  
      const location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
      const initialRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
  
      setMapRegion(initialRegion);
      setCurrentLocation(location.coords);
  
      const db = openDatabase();
      createTables(db);
  
      try {
        const data = await getMapInfo(db);

        console.log("Marker Data:", data);

        setMarkers(data);
      } catch (error) {
        console.error('Error fetching data from the database:', error);
      }
    })();
  }, []);


  const generateRouteUrl = () => {
    if (markers.length < 2) {
      // At least two markers are required to generate a route URL
      alert('Add at least two markers to generate a route.');
      return;
    }

    const routeCoordinates = markers.map((marker) => `${marker.latitude},${marker.longitude}`);

    if (currentLocation) {
      // Include the current location as the starting point
      const currentLocationString = `${currentLocation.latitude},${currentLocation.longitude}`;
      routeCoordinates.unshift(currentLocationString);
    }

    const routeUrl = `https://www.google.com/maps/dir/${routeCoordinates.join('/')}`;

    // Open the generated route URL in the device's web browser
    Linking.openURL(routeUrl);
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={mapRegion}>
      {currentLocation && (
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Current Location"
          image={require('../assets/TruckIcon.png')} // Replace with your custom icon
          style={{
            width: 40, // Adjust the width and height as needed
            height: 40,
      }}
    />
  )}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            image={
              marker.isCurrentLocation
                ? require('../assets/TruckIcon.png')
                : require('../assets/DefaultMarker.png')
            }
            style={{
              width: marker.width || 5,
              height: marker.height || 5,
            }}
          />
        ))}
      </MapView>
      
      <Button title="Trazar ruta" onPress={generateRouteUrl} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 8,
    padding: 8,
  },
});