import React from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AppleSignInButton() {
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Handle successful sign in
      if (credential) {
        // Store the user identifier
        await AsyncStorage.setItem("appleUserId", credential.user);

        // If we have the user's email, store it
        if (credential.email) {
          await AsyncStorage.setItem("userEmail", credential.email);
        }

        // You might want to store other relevant information here
        console.log("Apple sign-in successful", credential);
      }
    } catch (e: any) {
      if (e.code === "ERR_CANCELED") {
        // Handle user cancelling the sign-in flow
        console.log("User canceled Apple Sign-in");
      } else {
        // Handle other errors
        console.error("Error during Apple Sign-in:", e);
      }
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={5}
      style={{ width: 200, height: 44 }}
      onPress={handleAppleSignIn}
    />
  );
}
