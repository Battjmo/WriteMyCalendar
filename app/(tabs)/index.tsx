import {
  // Image,
  StyleSheet,
  // Platform,
  Text,
  TouchableOpacity,
  View,
  Button,
} from "react-native";
import { useEffect, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import GoogleSignInButton from "@/components/GoogleSignInButton";
// import { HelloWave } from "@/components/HelloWave";
// import ParallaxScrollView from "@/components/ParallaxScrollView";
// import { ThemedText } from "@/components/ThemedText";

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const [facing, setFacing] = useState("back" as any);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    let ignore = false;
    console.log("supabase anon key: ");

    const fetchToken = async () => {
      try {
        const token = await AsyncStorage.getItem("googleToken");
        if (token !== null && !ignore && googleToken !== token) {
          setGoogleToken(token);
          // const supabaseinit = createClient(
          //   process.env.EXPO_PUBLIC_SUPABASE_URL,
          //   process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
          // );
          // setSupabase(supabaseinit);
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

    if (photo && photo.base64) {
      const token = await AsyncStorage.getItem("googleToken");

      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      );
      //   );
      // }
      if (supabase) {
        const { data, error } = await supabase.functions.invoke(
          "processImage",
          {
            body: {
              photo: photo.base64,
            },
          }
        );
        console.log("data: ", data);
        console.log("error: ", error);
        const eventToSubmit = JSON.parse(data)[0];
        console.log("🚀 ~ takeTheDamnPicture ~ eventToSubmit:", eventToSubmit);

        // try {
        //   const insertedEvent = await fetch(
        //     "https://www.googleapis.com/calendar/v3/calendars/bacheeze@gmail.com/events",
        //     {
        //       method: "POST",
        //       headers: {
        //         type: "application/json; charset=UTF-8",
        //         Authorization: `Bearer ${token}`,
        //       },
        //       body: JSON.stringify(eventData),
        //     }
        //   );
        //   console.log("inserted event: ", insertedEvent);
        // } catch (error) {
        //   console.log("inserted event error: ", error);
        // }
      } else {
        console.log("no supabase or token or eventData");
      }
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
      <GoogleSignInButton tokenSetter={setGoogleToken} />
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
