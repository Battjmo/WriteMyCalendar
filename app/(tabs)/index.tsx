import { StyleSheet, Text, TouchableOpacity, View, Button } from "react-native";
import { useEffect, useState } from "react";
import {
  CameraCapturedPicture,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [googleToken, setGoogleToken] = useState("");

  useEffect(() => {
    let ignore = false;
    // get the google token from async storage
    const fetchToken = async () => {
      try {
        const token = await AsyncStorage.getItem("googleToken");
        if (token !== null && !ignore && googleToken !== token) {
          setGoogleToken(token);
        }
      } catch (e) {
        console.log("couldn't fetch token: ", e);
      }
    };
    fetchToken();
    return () => {
      ignore = true;
    };
  }, []);

  // send the image to Supabase and thence OpenAI
  const processImage = async (photo: CameraCapturedPicture) => {
    const supabaseToken = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    // call edge function with fetch since it doesn't work from an iphone over LAN
    try {
      const eventData = await fetch(
        "https://blyytczjahuqsmlfkdpc.supabase.co/functions/v1/processImage",
        {
          method: "POST",
          headers: {
            type: "application/json; charset=UTF-8",
            Authorization: `Bearer ${supabaseToken}`,
          },
          body: JSON.stringify({ photo: photo.base64 }),
        }
      );
      console.log("eventData: ", eventData);
      return await eventData.json();
    } catch (error) {
      console.log("inserted event error: ", error);
    }
  };

  const addEventsToCalendar = async (parsedEvent: any) => {
    const token = await AsyncStorage.getItem("googleToken");
    const email = await AsyncStorage.getItem("userEmail");
    if (!token || !email) {
      console.log("token or email not found");
      return;
    }
    for (const event of parsedEvent) {
      const eventToInsert = JSON.stringify(event);
      const insertedEvent = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${email}/events`,
        {
          method: "POST",
          headers: {
            type: "application/json; charset=UTF-8",
            Authorization: `Bearer ${token}`,
          },
          body: eventToInsert,
        }
      );
      console.log("inserted event: ", await insertedEvent.json());
    }
  };

  let camera: CameraView | null = null;

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    console.log("toggling");
    setFacing((current: any) => (current === "back" ? "front" : "back"));
  }

  function setCameraReady() {
    setIsCameraReady(true);
  }

  async function takeTheDamnPicture() {
    if (!isCameraReady) {
      console.log("Camera is not ready yet");
      return;
    }
    let parsedEvent;
    const photo = await camera?.takePictureAsync({ base64: true });

    if (photo && photo.base64) {
      parsedEvent = await processImage(photo);
    }

    if (parsedEvent) {
      await addEventsToCalendar(parsedEvent);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onCameraReady={setCameraReady}
        ref={(ref) => (camera = ref)}
        facing={facing}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={takeTheDamnPicture}>
            <Text style={styles.text}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      <GoogleSignInButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});
