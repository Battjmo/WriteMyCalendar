import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function () {
  GoogleSignin.configure({
    webClientId: process.env.GOOGLE_IOS_CLIENT_ID,
  });

  return (
    <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={async () => {
        try {
          await GoogleSignin.hasPlayServices();
          const user = await GoogleSignin.addScopes({
            scopes: ["https://www.googleapis.com/auth/calendar.events"],
          });
          const singin = await GoogleSignin.signIn();
          const tokens = await GoogleSignin.getTokens();
          console.log("🚀 ~ onPress={ ~ tokens:", tokens);
          await AsyncStorage.setItem("userEmail", singin?.user?.email);
          await AsyncStorage.setItem("googleToken", tokens.accessToken);
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
