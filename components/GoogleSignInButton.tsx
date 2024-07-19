import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function (tokenSetter: Dispatch<SetStateAction<string>>) {
  GoogleSignin.configure({
    webClientId:
      "270439132368-g16ppoktu4bblqo5tjn9kqv1nm1f2mpa.apps.googleusercontent.com",
  });

  return (
    <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={async () => {
        console.log("hi");
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          const tokens = await GoogleSignin.getTokens();
          console.log("tokens: ", tokens);
          await AsyncStorage.setItem("googleToken", tokens.accessToken);
          // tokenSetter(userInfo.idToken);
          // } else {
          //   throw new Error("no ID token present!");
          // }
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
