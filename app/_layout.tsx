import { enableFreeze } from "react-native-screens";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";

enableFreeze(true);

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen
                        name="hub-setup"
                        options={{
                            presentation: "transparentModal",
                            animation: "none",
                        }}
                    />
                </Stack>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
