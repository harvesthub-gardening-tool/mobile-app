import { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Animated, Easing, Dimensions, PanResponder, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useBluetoothSetup } from "@/hooks/useBluetoothSetup";
import { useWifiSetup } from "@/hooks/useWifiSetup";
import { revokeHubByDeviceId } from "@/services/authService";
import { IntroStep } from "@/components/hub-setup/IntroStep";
import { BluetoothStep } from "@/components/hub-setup/BluetoothStep";
import { ProbeDiscoveryStep } from "@/components/hub-setup/ProbeDiscoveryStep";
import { WifiStep } from "@/components/hub-setup/WifiStep";
import { SuccessStep } from "@/components/hub-setup/SuccessStep";
import { STEPS, type Step, type HubSetupParams, type SetupProbe } from "@/types/hub-setup";
import { colors, withAlpha } from "@/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SETUP_RESET_DELAY_MS = 700;

export default function HubSetupScreen() {
    const { hub_name, hub_uuid, hub_secret } = useLocalSearchParams<HubSetupParams>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const hubName = hub_name ?? "HarvestHub";
    const hubUuid = hub_uuid ?? "";
    const hubSecret = hub_secret ?? "";

    const [step, setStep] = useState<Step>("intro");
    const stepRef = useRef<Step>("intro");
    const [setupProbes, setSetupProbes] = useState<SetupProbe[]>([]);
    const [isScanningProbes, setIsScanningProbes] = useState(false);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const goToStep = useCallback((next: Step) => {
        stepRef.current = next;
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true })
            .start(() => {
                setStep(next);
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
            });
    }, [fadeAnim]);

    const handleDismiss = useCallback(() => {
        Animated.parallel([
            Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT, duration: 280, useNativeDriver: true,
                easing: Easing.in(Easing.ease),
            }),
        ]).start(() => {
            if (router.canGoBack()) {
                router.back();
                return;
            }

            router.replace("/pages/dashboard");
        });
    }, [backdropAnim, router, slideAnim]);

    const handleBluetoothSuccess = useCallback(() => {
        goToStep("wifi");
    }, [goToStep]);

    const handleProbeScanStarted = useCallback(() => {
        setIsScanningProbes(true);
        goToStep("probes");
    }, [goToStep]);

    const { btSteps, btError, runBluetoothFlow, sendWifiCredentials, markSetupRolledBack } = useBluetoothSetup(
        hubName,
        hubUuid,
        hubSecret,
        handleBluetoothSuccess,
        handleProbeScanStarted,
    );
    const handleSetupFailure = async (error: unknown) => {
        try {
            await revokeHubByDeviceId(hubUuid);
        } catch {
            throw new Error(
                "La configuration du hub a échoué et l'association n'a pas pu être réinitialisée. Vérifiez votre connexion puis réessayez.",
            );
        }
        const message =
            (error as Error)?.message
                ?? "La configuration du hub a échoué. L'association a été réinitialisée.";
        wifi.setWifiError(message);
        setTimeout(() => {
            markSetupRolledBack(`${message} L'association a été réinitialisée, recommencez l'installation.`);
            goToStep("bluetooth");
        }, SETUP_RESET_DELAY_MS);
    };

    const wifi = useWifiSetup(
        useCallback((probes: SetupProbe[]) => {
            setSetupProbes(probes);
            setIsScanningProbes(false);
            if (stepRef.current !== "probes") {
                goToStep("probes");
            }
        }, [goToStep]),
        sendWifiCredentials,
        handleSetupFailure,
    );
    const { startWifiScan } = wifi;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, {
                toValue: 0, duration: 350, useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, [backdropAnim, slideAnim]);

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
    }, [pulseAnim, step]);

    useEffect(() => {
        if (step === "bluetooth") runBluetoothFlow();
    }, [runBluetoothFlow, step]);

    useEffect(() => {
        if (step === "wifi" && Platform.OS === "android") startWifiScan();
    }, [startWifiScan, step]);

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
            <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => { if (stepRef.current !== "bluetooth") handleDismiss(); }}
            />
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
                    {...panResponder.panHandlers}
                >
                    <View style={styles.handleArea}>
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
                        {step === "probes" && (
                            <ProbeDiscoveryStep
                                probes={setupProbes}
                                scanning={isScanningProbes}
                                onNext={() => goToStep("succes")}
                            />
                        )}
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
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(colors.base.black, 0.45) },
    card: {
        height: SCREEN_HEIGHT * 0.72,
        backgroundColor: colors.surface.lowest,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 24,
        paddingBottom: 24,
        shadowColor: colors.base.black,
        shadowOpacity: 0.15,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -6 },
        elevation: 10,
    },
    handleArea: { alignSelf: "stretch", alignItems: "center", paddingVertical: 8, marginBottom: 8 },
    handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border.subtle },
    stepDots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 20 },
    dot: { height: 5, borderRadius: 2.5 },
    dotActive: { width: 24, backgroundColor: colors.brand.primary },
    dotInactive: { width: 8, backgroundColor: colors.border.subtle },
});
