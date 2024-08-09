import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function () {
  GoogleSignin.configure({
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const checkGoogleStatus = async () => {
      const user = await GoogleSignin.signInSilently();
      if (user.idToken) {
        const tokens = await GoogleSignin.getTokens();
        console.log("🚀 ~ onPress={ ~ tokens:", tokens);
        await AsyncStorage.setItem("userEmail", user?.user?.email);
        await AsyncStorage.setItem("googleToken", tokens.accessToken);
        setSignedIn(true);
      }
    };

    checkGoogleStatus();

    return () => {};
  }, []);

  return (
    !signedIn && (
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={async () => {
          try {
            const user = await GoogleSignin.signInSilently();
            if (user.idToken) {
              const tokens = await GoogleSignin.getTokens();
              console.log("🚀 ~ onPress={ ~ tokens:", tokens);
              await AsyncStorage.setItem("userEmail", user?.user?.email);
              await AsyncStorage.setItem("googleToken", tokens.accessToken);
            } else {
              await GoogleSignin.hasPlayServices();
              const singin = await GoogleSignin.signIn();
              console.log("🚀 ~ onPress={ ~ singin:", singin);
            }
            // console.log("🚀 ~ user:", user);

            // const user = await GoogleSignin.addScopes({
            //   scopes: ["https://www.googleapis.com/auth/calendar.events"],
            // });
            // console.log("🚀 ~ user:", user)
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
    )
  );
}
