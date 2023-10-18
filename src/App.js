import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  Text,
  TextInput,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter
} from "react-native";
import axios from "axios";

const App = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const [startTracker, setStartTracker] = useState(false);
  const [deviceID, setDeviceID] = useState("");

  const [commander, setCommander] = useState("");
  const [party, setParty] = useState([]);
  const [destination, setDestination] = useState("");
  const startTracking = () => {
    NativeModules.ForegroundService.startService("Location tracking started");
  };

  const stopTracking = () => {
    NativeModules.ForegroundService.stopService();
  };
  const toggleTracking = () => {
    if (commander !== "" && party !== "" && destination !== "") {
      if (isTracking) {
        stopTracking();
      } else {
        startTracking();
      }
      setIsTracking(!isTracking);
    } else {
      alert("חובה למלא את כל השדות לפני הפעלת העוקב");
    }
  };

  function getButtonStyle() {
    return isTracking ? styles.trackingButton : styles.defaultButton;
  }

  useEffect(() => {
    const locationListener = DeviceEventEmitter.addListener(
      "locationUpdate",
      async (location) => {
        setLocation({
          latitude: location.latitude,
          longitude: location.longitude
        });

        // Process
        const payload = {
          coordinates: {
            lat: location.latitude,
            lng: location.longitude
          },
          contact: commander,
          passengers: party.split(",").map((item) => item.trim()),
          destination: destination
        };

        if (commander !== "" && party !== [])
          // Send
          try {
            if (startTracker === false) {
              const response = await axios.post(
                "https://miluim-server.onrender.com/locations",
                payload
              );
              setDeviceID(response.data.id);
              setStartTracker(true);
            } else {
              await axios.put(
                `https://miluim-server.onrender.com/locations/${deviceID}`,
                { locationObj: location }
              );
            }
          } catch (error) {
            console.error("Error sending data:", error);
          }
      }
    );

    return () => {
      locationListener.remove();
    };
  }, [commander, party, destination, startTracker, deviceID]);

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <Text style={{ fontWeight: "bold", fontSize: 50, textAlign: "center" }}>
          Geo-Miluim
        </Text>
        <Text style={{ fontWeight: "bold", fontSize: 30, textAlign: "center" }}>
          לדווח מהשטח, מכל מקום
        </Text>
      </View>
      <TextInput
        style={{ ...styles.input, textAlign: "right", direction: "ltr" }}
        placeholder="מפקד הכוח"
        value={commander}
        onChangeText={setCommander}
      />
      <TextInput
        style={{ ...styles.input, textAlign: "right", direction: "ltr" }}
        placeholder="חברי הכוח. אם לבד,לרשום אני"
        value={party}
        onChangeText={setParty}
      />
      <TextInput
        style={{ ...styles.input, textAlign: "right", direction: "ltr" }}
        placeholder="משימה"
        value={destination}
        onChangeText={setDestination}
      />
      <Button
        title={isTracking ? "חזרתי בשלום" : "שתף מיקום לחמל"}
        onPress={toggleTracking}
        disabled={!isButtonEnabled}
        style={getButtonStyle()}
      />
      {location && (
        <View style={{ marginTop: 20 }}>
          <Text>במעקב אחרי המיקום שלך, נא ליצור קשר עם החמל לאימות</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // This ensures that the container takes the entire screen space
    alignItems: "center", // This will center items horizontally
    justifyContent: "center", // This will center items vertically
    paddingHorizontal: 20
  },
  input: {
    width: "100%",
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4
  },
  defaultButton: {
    backgroundColor: "blue"
  },
  trackingButton: {
    backgroundColor: "red"
  },
  title: {
    fontSize: 48
  }
});

export default App;
