// ModeContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useReducer, useEffect } from "react";

const ModeContext = createContext("calendar");

const initialState = {
  mode: "calendar",
};

interface Props {
  children: React.ReactNode;
}

const modeReducer = (state: any, action: any) => {
  switch (action.type) {
    case "CHANGE_MODE":
      return {
        ...state,
        mode: action.payload,
      };
    default:
      return state;
  }
};

export const ModeProvider = ({ children }: Props) => {
  useEffect(() => {
    async function getSavedMode() {
      const savedMode = await AsyncStorage.getItem("mode");
      if (savedMode) {
        dispatch({ type: "CHANGE_MODE", payload: savedMode });
      }
    }
    getSavedMode();
  }, []);
  const [state, dispatch] = useReducer(modeReducer, initialState);

  return (
    // @ts-ignore
    <ModeContext.Provider value={{ state, dispatch }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useModeContext = () => useContext(ModeContext);
