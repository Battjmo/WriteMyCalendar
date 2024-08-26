import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function () {
  useEffect(() => {
    const checkGoogleStatus = async () => {
      GoogleSignin.configure({
        scopes: [
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/drive",
        ],
      });
      const user = await GoogleSignin.signInSilently();
      if (user.idToken) {
        const tokens = await GoogleSignin.getTokens();
        await AsyncStorage.setItem("userEmail", user?.user?.email);
        await AsyncStorage.setItem("googleToken", tokens.accessToken);
        await AsyncStorage.setItem("authMethod", "google");
      }
    };

    checkGoogleStatus();

    return () => {};
  }, []);

  return (
    <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={async () => {
        try {
          await GoogleSignin.hasPlayServices();
          const singin = await GoogleSignin.signIn();
          console.log("🚀 ~ onPress={ ~ singin:", singin);
          const tokens = await GoogleSignin.getTokens();
          console.log("🚀 ~ onPress={ ~ tokens:", tokens);
          await AsyncStorage.setItem("googleToken", tokens.accessToken);
          await AsyncStorage.setItem("authMethod", "google");
        } catch (error: any) {
          if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            // user cancelled the login flow
          } else if (error.code === statusCodes.IN_PROGRESS) {
            // operation (e.g. sign in) is in progress already
          } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            // play services not available or outdated
          } else {
            // some other error happened
          }
        }
      }}
    />
  );
}
