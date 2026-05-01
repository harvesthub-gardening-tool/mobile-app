import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
    return (
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
    );
}
