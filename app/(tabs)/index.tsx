import {
  // Image,
  StyleSheet,
  // Platform,
  Text,
  TouchableOpacity,
  View,
  Button,
} from "react-native";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
// import { HelloWave } from "@/components/HelloWave";
// import ParallaxScrollView from "@/components/ParallaxScrollView";
// import { ThemedText } from "@/components/ThemedText";
//

export default function HomeScreen() {
  const [facing, setFacing] = useState("back" as any);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  let openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  });

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
    const photo = await camera?.takePictureAsync({ base64: true });
    console.log(photo?.uri);
    if (openai && photo && photo.base64) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "I have attached a notecard with my schedule for today on it. The date is in the top right corner. The schedule is left-aligned. Each line contains a start and end time, separated by a hyper, then a colon, then the task assigned to that time. Lines with mistakes are scribbled out. Please create the JSON object or objects that would be required to populate a Google Calendar, for the date provided, with this schedule.",
              },
              {
                type: "image_url",
                image_url: { url: "data:image/jpeg;base64," + photo.base64 },
              },
            ],
          },
        ],
      });
      console.log(response?.choices[0]?.message?.content);
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

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: "absolute",
//   },
// });
