import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getAuthMethod(): Promise<"google" | "apple" | null> {
  try {
    const authMethod = await AsyncStorage.getItem("authMethod");
    console.log("🚀 ~ getAuthMethod ~ authMethod:", authMethod);
    console.log("da fuq: ", authMethod === "apple");
    switch (authMethod) {
      case "apple":
        const appleToken = await AsyncStorage.getItem("appleToken");
        console.log("🚀 ~ getAuthMethod ~ appleToken:", appleToken);
        if (appleToken) {
          console.log("apple");
          return "apple";
        }
        break;
      case "google":
        const googleToken = await AsyncStorage.getItem("googleToken");
        if (googleToken) {
          console.log("google");
          return "google";
        }
      default:
        console.log("no auth method found");
        break;
    }

    return null;
  } catch (error) {
    console.error("Error getting auth method:", error);
    return null;
  }
}
