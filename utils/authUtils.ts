import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getAuthMethod(): Promise<"google" | "apple" | null> {
  try {
    const authMethod = await AsyncStorage.getItem("authMethod");
    switch (authMethod) {
      case "apple":
        const appleToken = await AsyncStorage.getItem("appleToken");
        if (appleToken) {
          return "apple";
        }
        break;
      case "google":
        const googleToken = await AsyncStorage.getItem("googleToken");
        if (googleToken) {
          return "google";
        }
        break;
      default:
        break;
    }
    return null;
  } catch (error: unknown) {
    console.error("Error getting auth method:", error);
    return null;
  }
}
