import { StyleSheet, Text, TouchableOpacity, View, Button } from "react-native";
import { useEffect, useState } from "react";
import {
  CameraCapturedPicture,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useModeContext } from "@/components/context/modeContext";

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  //@ts-ignore
  const { state } = useModeContext();

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
          body: JSON.stringify({ photo: photo.base64, mode: state.mode }),
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

  const addTextToGoogleDocs = async (parsedEvent: any) => {
    const token = await AsyncStorage.getItem("googleToken");
    const email = await AsyncStorage.getItem("userEmail");
    if (!token || !email) {
      console.log("token or email not found");
      return;
    }

    const doc = parsedEvent.body || parsedEvent;

    const title = doc.name || doc.title || "Untitled";
    console.log("🚀 ~ addTextToGoogleDocs ~ title:", title);
    const body = doc.content || "No content";
    console.log("🚀 ~ addTextToGoogleDocs ~ body:", body);

    const metadata = {
      name: `${title}.txt`,
      mimeType: "text/plain",
    };

    const fileData = new Blob([body], { type: "text/plain" });

    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    formData.append("file", fileData);
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: new Headers({ Authorization: `Bearer ${token}` }),
        body: formData,
      }
    );
    console.log("inserted document: ", await response.json());
    return response;
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

    console.log("parsedEvent: ", parsedEvent);
    let result;

    if (parsedEvent) {
      switch (state.mode) {
        case "calendar":
          result = await addEventsToCalendar(parsedEvent);
          console.log("🚀 ~ takeTheDamnPicture ~ result:", result);
          break;
        case "text":
          result = await addTextToGoogleDocs(parsedEvent);
          console.log("🚀 ~ takeTheDamnPicture ~ result:", result);
          break;
        default:
          break;
      }
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onCameraReady={setCameraReady}
        ref={(ref) => (camera = ref)}
        facing={"back"}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takeTheDamnPicture}>
            <Text style={styles.text}>Take Photo</Text>
            <Text style={styles.text}>{state.mode}</Text>
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
