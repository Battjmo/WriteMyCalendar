import { StyleSheet, Text, TouchableOpacity, View, Button } from "react-native";
import { useEffect, useState } from "react";
import {
  CameraCapturedPicture,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import LoadingScreen from "@/components/LoadingScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useModeContext } from "@/components/context/modeContext";

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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
    const photoURL = photo.base64;

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
          body: JSON.stringify({ photo: photoURL, mode: state.mode }),
        }
      );
      return await eventData.json();
    } catch (error) {
      console.log("inserted event error: ", error);
      return error;
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
      const result = await insertedEvent.json();
      console.log("🚀 ~ addEventsToCalendar ~ result:", result);
    }
    return "all done";
  };

  const addTextToGoogleDocs = async (
    title = "test title",
    body = "I am a note"
  ) => {
    console.log("🚀 ~ HomeScreen ~ body:", body);
    console.log("🚀 ~ HomeScreen ~ title:", title);
    const token = await AsyncStorage.getItem("googleToken");
    const email = await AsyncStorage.getItem("userEmail");
    if (!token || !email) {
      console.log("token or email not found");
      return;
    }

    try {
      // Step 1: Upload the file with no title
      const fileUploadResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=media",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain",
          },
          body: body,
        }
      );

      const fileData = await fileUploadResponse.json();
      const fileId = fileData.id;

      if (!fileId) {
        throw new Error("File ID not returned");
      }

      console.log("File uploaded successfully with ID:", fileId);

      // Step 2: Update the file's metadata (e.g., set the title)
      const metadata = {
        name: title,
      };

      const metadataUpdateResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(metadata),
        }
      );

      const metadataResult = await metadataUpdateResponse.json();
      console.log("File metadata updated:", metadataResult);
      return metadataResult;
    } catch (error) {
      console.error("Error creating or updating file:", error);
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

  function setCameraReady() {
    setIsCameraReady(true);
  }

  async function takeTheDamnPicture() {
    try {
      if (!isCameraReady) {
        console.log("Camera is not ready yet");
        return;
      }
      setIsProcessing(true);
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
            // result = await addEventsToCalendar(parsedEvent);
            break;
          case "text":
            const title = parsedEvent.name || parsedEvent.title || "Untitled";
            const body = parsedEvent.body || "No content";
            result = await addTextToGoogleDocs(title, body);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error("Error processing photo:", error);
    } finally {
      setIsProcessing(false);
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
      {isProcessing && <LoadingScreen />}
      <GoogleSignInButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    position: "relative",
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
