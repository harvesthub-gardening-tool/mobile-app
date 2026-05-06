import { useMemo } from "react";
import type { ComponentProps } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGardenStorage } from "@/hooks/useGardenStorage";
import { useSensorData } from "@/hooks/useSensorData";
import { colors, withAlpha } from "@/theme";
import type { PlacedPlant, PlacedSonde } from "@/types/garden";

const DRY_SOIL_THRESHOLD = 35;
const WATERED_SOIL_THRESHOLD = 70;

type WaterStatus = "dry" | "watered" | "wet" | "missing-reading" | "unlinked";

type PlantWaterStatus = {
    id: string;
    name: string;
    quantity: number;
    status: WaterStatus;
    soilHumidity: number | null;
    soilTemperature: number | null;
    hubName: string | null;
    nodeId: string | null;
    recommendation: string;
};

type StatusVisual = {
    label: string;
    title: string;
    color: string;
    soft: string;
    icon: ComponentProps<typeof Feather>["name"];
};

const statusVisuals: Record<WaterStatus, StatusVisual> = {
    dry: {
        label: "À arroser",
        title: "Besoin d'eau",
        color: colors.state.danger,
        soft: colors.state.dangerSoft,
        icon: "droplet",
    },
    watered: {
        label: "Arrosée",
        title: "Hydratation correcte",
        color: colors.state.success,
        soft: colors.state.successSoft,
        icon: "check-circle",
    },
    wet: {
        label: "Très humide",
        title: "Trop d'eau possible",
        color: colors.brand.info,
        soft: colors.state.infoSoft,
        icon: "cloud-rain",
    },
    "missing-reading": {
        label: "En attente",
        title: "Lecture indisponible",
        color: colors.brand.info,
        soft: colors.state.infoSoft,
        icon: "wifi-off",
    },
    unlinked: {
        label: "Sans sonde",
        title: "Sonde non liée",
        color: colors.text.muted,
        soft: colors.surface.low,
        icon: "link-2",
    },
};

function getPlantStatus(plant: PlacedPlant, sondes: PlacedSonde[], sensorData: Map<string, { soilHumidity?: number; soilTemperature?: number }>): PlantWaterStatus {
    const linkedSonde = plant.sondeId
        ? sondes.find((sonde) => sonde.id === plant.sondeId) ?? null
        : null;

    if (!linkedSonde) {
        return {
            id: plant.id,
            name: plant.plantType.name,
            quantity: plant.quantity,
            status: "unlinked",
            soilHumidity: null,
            soilTemperature: null,
            hubName: null,
            nodeId: null,
            recommendation: "Liez une sonde à cette plante depuis la carte du jardin pour suivre son arrosage.",
        };
    }

    const reading = sensorData.get(linkedSonde.nodeId);
    const soilHumidity = typeof reading?.soilHumidity === "number" ? reading.soilHumidity : null;
    const soilTemperature = typeof reading?.soilTemperature === "number" ? reading.soilTemperature : null;

    if (soilHumidity === null) {
        return {
            id: plant.id,
            name: plant.plantType.name,
            quantity: plant.quantity,
            status: "missing-reading",
            soilHumidity,
            soilTemperature,
            hubName: linkedSonde.hubName,
            nodeId: linkedSonde.nodeId,
            recommendation: "Aucune humidité du sol reçue pour cette sonde. Vérifiez la connexion ou la batterie.",
        };
    }

    if (soilHumidity < DRY_SOIL_THRESHOLD) {
        return {
            id: plant.id,
            name: plant.plantType.name,
            quantity: plant.quantity,
            status: "dry",
            soilHumidity,
            soilTemperature,
            hubName: linkedSonde.hubName,
            nodeId: linkedSonde.nodeId,
            recommendation: "Arrosez cette zone maintenant, puis contrôlez la lecture à la prochaine synchronisation.",
        };
    }

    if (soilHumidity <= WATERED_SOIL_THRESHOLD) {
        return {
            id: plant.id,
            name: plant.plantType.name,
            quantity: plant.quantity,
            status: "watered",
            soilHumidity,
            soilTemperature,
            hubName: linkedSonde.hubName,
            nodeId: linkedSonde.nodeId,
            recommendation: "Le niveau d'humidité est dans la zone idéale. Aucun arrosage nécessaire.",
        };
    }

    return {
        id: plant.id,
        name: plant.plantType.name,
        quantity: plant.quantity,
        status: "wet",
        soilHumidity,
        soilTemperature,
        hubName: linkedSonde.hubName,
        nodeId: linkedSonde.nodeId,
        recommendation: "Suspendez l'arrosage et surveillez cette plante pour éviter l'excès d'eau.",
    };
}

function formatHumidity(value: number | null): string {
    return value === null ? "--" : `${Math.round(value)}%`;
}

function formatTemperature(value: number | null): string {
    return value === null ? "--" : `${value.toFixed(1)}°C`;
}

function sortPlantStatuses(a: PlantWaterStatus, b: PlantWaterStatus): number {
    const priority: Record<WaterStatus, number> = {
        dry: 0,
        wet: 1,
        "missing-reading": 2,
        unlinked: 3,
        watered: 4,
    };

    return priority[a.status] - priority[b.status] || a.name.localeCompare(b.name, "fr");
}

function PlantStatusCard({ plantStatus }: { plantStatus: PlantWaterStatus }) {
    const visual = statusVisuals[plantStatus.status];

    return (
        <View style={styles.statusCard} testID={`plant-water-status-${plantStatus.id}`}>
            <View style={styles.statusTopRow}>
                <View style={[styles.statusIconWrap, { backgroundColor: visual.soft }]}>
                    <Feather name={visual.icon} size={20} color={visual.color} />
                </View>
                <View style={styles.statusTitleColumn}>
                    <Text style={styles.statusTitle}>{plantStatus.name}</Text>
                    <Text style={styles.statusSubtitle}>
                        {plantStatus.hubName ? `${plantStatus.hubName} · ${plantStatus.nodeId}` : "Aucune sonde active"}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: visual.soft }]}>
                    <Text style={[styles.statusBadgeText, { color: visual.color }]}>{visual.label}</Text>
                </View>
            </View>

            <Text style={styles.statusMessage}>{visual.title}</Text>

            <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Humidité</Text>
                    <Text style={[styles.metricValue, { color: visual.color }]}>
                        {formatHumidity(plantStatus.soilHumidity)}
                    </Text>
                </View>
                <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Temp. sol</Text>
                    <Text style={styles.metricValue}>{formatTemperature(plantStatus.soilTemperature)}</Text>
                </View>
                <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Quantité</Text>
                    <Text style={styles.metricValue}>{plantStatus.quantity}</Text>
                </View>
            </View>

            <View style={styles.recommendationRow}>
                <Feather name="activity" size={14} color={visual.color} />
                <Text style={styles.recommendationText}>{plantStatus.recommendation}</Text>
            </View>
        </View>
    );
}

export default function Alerts() {
    const { plants, sondes } = useGardenStorage();
    const sensorData = useSensorData();

    const plantStatuses = useMemo(
        () => plants.map((plant) => getPlantStatus(plant, sondes, sensorData)).sort(sortPlantStatuses),
        [plants, sensorData, sondes],
    );

    const dryCount = plantStatuses.filter((plantStatus) => plantStatus.status === "dry").length;
    const wateredCount = plantStatuses.filter((plantStatus) => plantStatus.status === "watered").length;
    const monitoredCount = plantStatuses.filter(
        (plantStatus) => plantStatus.status !== "unlinked" && plantStatus.status !== "missing-reading",
    ).length;

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <View style={styles.heroGlow} />
                    <View style={styles.heroHeaderRow}>
                        <View>
                            <Text style={styles.eyebrow}>Suivi des sondes</Text>
                            <Text style={styles.headerTitle}>Alertes</Text>
                        </View>
                        <View style={styles.heroIconWrap}>
                            <Feather name="bell" size={22} color={colors.text.onPrimary} />
                        </View>
                    </View>

                    <Text style={styles.heroSubtitle}>
                        Les alertes sont calculées à partir des plantes liées à vos sondes. La page se met à jour avec les lectures reçues par l&apos;app.
                    </Text>

                    <View style={styles.heroStatsRow}>
                        <View style={styles.heroStatCard}>
                            <Text style={styles.heroStatValue}>{dryCount}</Text>
                            <Text style={styles.heroStatLabel}>à arroser</Text>
                        </View>
                        <View style={styles.heroStatCard}>
                            <Text style={styles.heroStatValue}>{wateredCount}</Text>
                            <Text style={styles.heroStatLabel}>arrosées</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryIconWrap}>
                        <Feather name="refresh-cw" size={16} color={colors.brand.primary} />
                    </View>
                    <View style={styles.summaryTextColumn}>
                        <Text style={styles.summaryTitle}>Données en direct</Text>
                        <Text style={styles.summaryText}>
                            {monitoredCount > 0
                                ? `${monitoredCount} plante${monitoredCount > 1 ? "s" : ""} suivie${monitoredCount > 1 ? "s" : ""} par sonde. Rafraîchissement automatique toutes les 30 secondes.`
                                : "Aucune plante n'a encore de lecture d'humidité disponible."}
                        </Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>État d&apos;arrosage</Text>
                        <Text style={styles.sectionHint}>Sol sec &lt; 35%, zone idéale 35–70%.</Text>
                    </View>
                </View>

                {plantStatuses.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconWrap}>
                            <Feather name="map" size={24} color={colors.brand.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>Aucune plante à surveiller</Text>
                        <Text style={styles.emptyText}>
                            Ajoutez des plantes sur la carte du jardin et liez-les à une sonde pour voir les besoins en eau ici.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.statusList}>
                        {plantStatuses.map((plantStatus) => (
                            <PlantStatusCard key={plantStatus.id} plantStatus={plantStatus} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface.base },
    content: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 128,
        gap: 18,
    },
    hero: {
        minHeight: 250,
        borderRadius: 34,
        padding: 22,
        overflow: "hidden",
        backgroundColor: colors.brand.primary,
        shadowColor: colors.brand.primary,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
        elevation: 8,
    },
    heroGlow: {
        position: "absolute",
        top: -70,
        right: -40,
        width: 190,
        height: 190,
        borderRadius: 95,
        backgroundColor: withAlpha(colors.brand.tertiaryContainer, 0.38),
    },
    heroHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 14,
    },
    eyebrow: {
        color: withAlpha(colors.text.onPrimary, 0.72),
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.7,
        textTransform: "uppercase",
    },
    headerTitle: {
        marginTop: 6,
        fontSize: 34,
        fontWeight: "800",
        color: colors.text.onPrimary,
        letterSpacing: -0.8,
    },
    heroIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: withAlpha(colors.base.white, 0.16),
        borderWidth: 1,
        borderColor: withAlpha(colors.base.white, 0.22),
    },
    heroSubtitle: {
        marginTop: 18,
        color: withAlpha(colors.text.onPrimary, 0.82),
        fontSize: 15,
        lineHeight: 22,
        maxWidth: 320,
    },
    heroStatsRow: {
        marginTop: 24,
        flexDirection: "row",
        gap: 12,
    },
    heroStatCard: {
        flex: 1,
        borderRadius: 22,
        padding: 14,
        backgroundColor: withAlpha(colors.base.white, 0.13),
        borderWidth: 1,
        borderColor: withAlpha(colors.base.white, 0.14),
    },
    heroStatValue: {
        color: colors.text.onPrimary,
        fontSize: 28,
        fontWeight: "800",
    },
    heroStatLabel: {
        marginTop: 2,
        color: withAlpha(colors.text.onPrimary, 0.68),
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    summaryCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 24,
        padding: 14,
        backgroundColor: colors.surface.lowest,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.2),
    },
    summaryIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.brand.primaryFixed,
    },
    summaryTextColumn: { flex: 1 },
    summaryTitle: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: "800",
    },
    summaryText: {
        marginTop: 3,
        color: colors.text.secondary,
        fontSize: 13,
        lineHeight: 19,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    sectionTitle: {
        color: colors.text.primary,
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: -0.4,
    },
    sectionHint: {
        marginTop: 3,
        color: colors.text.muted,
        fontSize: 13,
    },
    statusList: { gap: 14 },
    statusCard: {
        borderRadius: 30,
        padding: 16,
        gap: 14,
        backgroundColor: withAlpha(colors.surface.lowest, 0.96),
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.2),
        shadowColor: colors.overlay.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.85,
        shadowRadius: 18,
        elevation: 3,
    },
    statusTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    statusIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    statusTitleColumn: { flex: 1, minWidth: 0 },
    statusTitle: {
        color: colors.text.primary,
        fontSize: 17,
        fontWeight: "800",
    },
    statusSubtitle: {
        marginTop: 3,
        color: colors.text.muted,
        fontSize: 12,
        fontWeight: "600",
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    statusMessage: {
        color: colors.text.secondary,
        fontSize: 14,
        fontWeight: "700",
    },
    metricsRow: {
        flexDirection: "row",
        gap: 10,
    },
    metricBox: {
        flex: 1,
        minHeight: 72,
        borderRadius: 20,
        padding: 12,
        backgroundColor: colors.surface.low,
        justifyContent: "center",
    },
    metricLabel: {
        color: colors.text.muted,
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    metricValue: {
        marginTop: 5,
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: "800",
    },
    recommendationRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },
    recommendationText: {
        flex: 1,
        color: colors.text.secondary,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: "600",
    },
    emptyCard: {
        minHeight: 240,
        borderRadius: 32,
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface.lowest,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.18),
    },
    emptyIconWrap: {
        width: 58,
        height: 58,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.brand.primaryFixed,
    },
    emptyTitle: {
        marginTop: 16,
        color: colors.text.primary,
        fontSize: 22,
        fontWeight: "800",
    },
    emptyText: {
        marginTop: 8,
        color: colors.text.secondary,
        fontSize: 14,
        lineHeight: 21,
        textAlign: "center",
    },
});
