import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Dimensions, PanResponder, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useBluetoothSetup } from "./hooks/useBluetoothSetup";
import { useWifiSetup } from "./hooks/useWifiSetup";
import { IntroStep } from "./components/hub-setup/IntroStep";
import { BluetoothStep } from "./components/hub-setup/BluetoothStep";
import { WifiStep } from "./components/hub-setup/WifiStep";
import { SuccessStep } from "./components/hub-setup/SuccessStep";
import { STEPS, type Step } from "./types/hub-setup";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HubSetupScreen() {
    const { hub_name } = useLocalSearchParams<{ hub_name: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const hubName = hub_name ?? "HarvestHub";

    const [step, setStep] = useState<Step>("intro");
    const stepRef = useRef<Step>("intro");

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const goToStep = (next: Step) => {
        stepRef.current = next;
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true })
            .start(() => {
                setStep(next);
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
            });
    };

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT, duration: 280, useNativeDriver: true,
                easing: Easing.in(Easing.ease),
            }),
        ]).start(() => router.back());
    };

    const { btSteps, btError, runBluetoothFlow } = useBluetoothSetup(hubName, () => goToStep("wifi"));
    const wifi = useWifiSetup(() => goToStep("succes"));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, {
                toValue: 0, duration: 350, useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, []);

    useEffect(() => {
        if (step !== "succes") return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [step]);

    useEffect(() => {
        if (step === "bluetooth") runBluetoothFlow();
    }, [step]);

    useEffect(() => {
        if (step === "wifi" && Platform.OS === "android") wifi.startWifiScan();
    }, [step]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, { dy, dx }) =>
                stepRef.current !== "bluetooth" && dy > 8 && Math.abs(dy) > Math.abs(dx),
            onPanResponderMove: (_, { dy }) => { if (dy > 0) slideAnim.setValue(dy); },
            onPanResponderRelease: (_, { dy, vy }) => {
                if (dy > 80 || vy > 0.5) {
                    handleDismiss();
                } else {
                    Animated.timing(slideAnim, {
                        toValue: 0, duration: 200, useNativeDriver: true,
                        easing: Easing.out(Easing.ease),
                    }).start();
                }
            },
        }),
    ).current;

    const stepIndex = STEPS.indexOf(step);
    const wifiSsid = (Platform.OS === "ios" ? wifi.manualSsid : wifi.selectedSsid) ?? "";

    return (
        <View style={styles.root}>
            <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
            <View>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            transform: [{ translateY: slideAnim }],
                            paddingBottom: insets.bottom + 24,
                            marginBottom: -insets.bottom,
                        },
                    ]}
                >
                    <View style={styles.handleArea} {...panResponder.panHandlers}>
                        <View style={styles.handleBar} />
                    </View>
                    <View style={styles.stepDots}>
                        {STEPS.map((s, i) => (
                            <View
                                key={s}
                                style={[styles.dot, i <= stepIndex ? styles.dotActive : styles.dotInactive]}
                            />
                        ))}
                    </View>
                    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
                        {step === "intro" && (
                            <IntroStep hubName={hubName} onNext={() => goToStep("bluetooth")} />
                        )}
                        {step === "bluetooth" && (
                            <BluetoothStep
                                btSteps={btSteps}
                                btError={btError}
                                onRetry={runBluetoothFlow}
                                onSkip={() => goToStep("wifi")}
                            />
                        )}
                        {step === "wifi" && <WifiStep {...wifi} />}
                        {step === "succes" && (
                            <SuccessStep
                                hubName={hubName}
                                wifiSsid={wifiSsid}
                                pulseAnim={pulseAnim}
                                onDismiss={handleDismiss}
                            />
                        )}
                    </Animated.View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    card: {
        height: SCREEN_HEIGHT * 0.72,
        backgroundColor: "#FFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 24,
        paddingBottom: 24,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -6 },
        elevation: 10,
    },
    handleArea: { alignSelf: "stretch", alignItems: "center", paddingVertical: 8, marginBottom: 8 },
    handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0" },
    stepDots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 20 },
    dot: { height: 5, borderRadius: 2.5 },
    dotActive: { width: 24, backgroundColor: "#63FFA4" },
    dotInactive: { width: 8, backgroundColor: "#E0E0E0" },
});
