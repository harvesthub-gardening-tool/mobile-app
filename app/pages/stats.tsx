import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import type { SensorSummary } from "@harvesthub-gardening-tool/protos-typescript/garden/v2/garden_pb";

import { useGardenStorage } from "../hooks/useGardenStorage";
import { useSensorData } from "../hooks/useSensorData";
import { useHubs } from "../hooks/useHubs";
import { getSummary } from "../services/gardenService";
import { colors, withAlpha } from "../theme";
import { getSondeDisplayName } from "../utils/sondeDisplay";

const WINDOW_OPTIONS = [
    { label: "24h", hours: 24 },
    { label: "48h", hours: 48 },
    { label: "7j", hours: 168 },
] as const;

type WindowOption = (typeof WINDOW_OPTIONS)[number]["hours"];

type TrendPoint = {
    key: string;
    label: string;
    airTemperature: number | null;
    soilHumidity: number | null;
    maxAirTemperature: number | null;
};

type BarChartCardProps = {
    title: string;
    caption: string;
    color: string;
    points: number[];
    labels: string[];
    currentValue: string;
    deltaLabel: string;
    testID: string;
};

type KpiCardProps = {
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
    value: string;
    helper: string;
    tone?: "default" | "accent";
};

type ClimateCardProps = {
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
    value: string;
    helper: string;
    color: string;
};

function average(values: (number | undefined)[]): number | null {
    const validValues = values.filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
    );

    if (validValues.length === 0) {
        return null;
    }

    return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function formatMetric(value: number | null, suffix: string, digits = 0): string {
    if (value === null) {
        return "--";
    }
    return `${value.toFixed(digits)}${suffix}`;
}

function formatCompactDate(value: bigint | null): string {
    if (value === null) {
        return "Aucune donnée récente";
    }

    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) {
        return "Aucune donnée récente";
    }

    return `${date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
    })} · ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
}

function formatHubDate(createdAt: bigint): string {
    const date = new Date(Number(createdAt));
    if (Number.isNaN(date.getTime())) {
        return "Date inconnue";
    }

    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getHumidityStatus(
    humidity: number | null,
): { label: string; color: string; backgroundColor: string } {
    if (humidity === null) {
        return {
            label: "Aucune lecture",
            color: colors.text.muted,
            backgroundColor: colors.surface.low,
        };
    }

    if (humidity < 35) {
        return {
            label: "Sol sec",
            color: colors.state.danger,
            backgroundColor: colors.state.dangerSoft,
        };
    }

    if (humidity <= 70) {
        return {
            label: "Zone idéale",
            color: colors.state.success,
            backgroundColor: colors.state.successSoft,
        };
    }

    return {
        label: "Très humide",
        color: colors.brand.info,
        backgroundColor: colors.state.infoSoft,
    };
}

function aggregateTrendPoints(rows: SensorSummary[]): TrendPoint[] {
    const aggregateByInterval = new Map<
        string,
        {
            intervalStart: bigint;
            totalAirTemperature: number;
            airCount: number;
            totalSoilHumidity: number;
            soilCount: number;
            maxAirTemperature: number | null;
        }
    >();

    for (const row of rows) {
        const key = String(row.intervalStart);
        const aggregate = aggregateByInterval.get(key) ?? {
            intervalStart: row.intervalStart,
            totalAirTemperature: 0,
            airCount: 0,
            totalSoilHumidity: 0,
            soilCount: 0,
            maxAirTemperature: null,
        };

        if (Number.isFinite(row.avgAirTemperature)) {
            aggregate.totalAirTemperature += row.avgAirTemperature;
            aggregate.airCount += 1;
        }

        if (Number.isFinite(row.avgSoilHumidity)) {
            aggregate.totalSoilHumidity += row.avgSoilHumidity;
            aggregate.soilCount += 1;
        }

        if (Number.isFinite(row.maxAirTemperature)) {
            aggregate.maxAirTemperature =
                aggregate.maxAirTemperature === null
                    ? row.maxAirTemperature
                    : Math.max(aggregate.maxAirTemperature, row.maxAirTemperature);
        }

        aggregateByInterval.set(key, aggregate);
    }

    return Array.from(aggregateByInterval.entries())
        .sort(([, left], [, right]) => {
            if (left.intervalStart < right.intervalStart) {
                return -1;
            }
            if (left.intervalStart > right.intervalStart) {
                return 1;
            }
            return 0;
        })
        .map(([key, aggregate]) => {
            const date = new Date(Number(aggregate.intervalStart));
            const label = Number.isNaN(date.getTime())
                ? "--"
                : date.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                  });

            return {
                key,
                label,
                airTemperature:
                    aggregate.airCount > 0
                        ? aggregate.totalAirTemperature / aggregate.airCount
                        : null,
                soilHumidity:
                    aggregate.soilCount > 0
                        ? aggregate.totalSoilHumidity / aggregate.soilCount
                        : null,
                maxAirTemperature: aggregate.maxAirTemperature,
            };
        });
}

function BarChartCard({
    title,
    caption,
    color,
    points,
    labels,
    currentValue,
    deltaLabel,
    testID,
}: BarChartCardProps) {
    const peak = Math.max(...points, 1);

    return (
        <View style={styles.chartCard} testID={testID}>
            <View style={styles.chartHeader}>
                <View>
                    <Text style={styles.chartTitle}>{title}</Text>
                    <Text style={styles.chartCaption}>{caption}</Text>
                </View>
                <View style={[styles.chartValuePill, { backgroundColor: withAlpha(color, 0.12) }]}>
                    <Text style={[styles.chartValue, { color }]}>{currentValue}</Text>
                </View>
            </View>

            <View style={styles.chartArea}>
                {points.map((point, index) => {
                    const heightRatio = peak > 0 ? point / peak : 0;
                    const barHeight = Math.max(16, Math.round(heightRatio * 76));

                    return (
                        <View key={`${labels[index]}-${index}`} style={styles.chartColumn}>
                            <View
                                style={[
                                    styles.chartBar,
                                    {
                                        height: barHeight,
                                        backgroundColor: withAlpha(color, 0.2 + heightRatio * 0.55),
                                        borderColor: withAlpha(color, 0.22),
                                    },
                                ]}
                            />
                            <Text style={styles.chartLabel}>{labels[index]}</Text>
                        </View>
                    );
                })}
            </View>

            <Text style={styles.chartDelta}>{deltaLabel}</Text>
        </View>
    );
}

function KpiCard({ icon, label, value, helper, tone = "default" }: KpiCardProps) {
    const accent = tone === "accent";

    return (
        <View style={[styles.kpiCard, accent && styles.kpiCardAccent]}>
            <View style={[styles.kpiIconWrap, accent && styles.kpiIconWrapAccent]}>
                <Feather
                    name={icon}
                    size={16}
                    color={accent ? colors.text.onPrimary : colors.brand.secondary}
                />
            </View>
            <Text style={[styles.kpiLabel, accent && styles.kpiLabelAccent]}>{label}</Text>
            <Text style={[styles.kpiValue, accent && styles.kpiValueAccent]}>{value}</Text>
            <Text style={[styles.kpiHelper, accent && styles.kpiHelperAccent]}>{helper}</Text>
        </View>
    );
}

function ClimateCard({ icon, label, value, helper, color }: ClimateCardProps) {
    return (
        <View style={styles.climateCard}>
            <View style={[styles.climateIconWrap, { backgroundColor: withAlpha(color, 0.12) }]}>
                <Feather name={icon} size={16} color={color} />
            </View>
            <Text style={styles.climateLabel}>{label}</Text>
            <Text style={styles.climateValue}>{value}</Text>
            <Text style={styles.climateHelper}>{helper}</Text>
        </View>
    );
}

function SectionHeader({
    eyebrow,
    title,
    subtitle,
}: {
    eyebrow: string;
    title: string;
    subtitle: string;
}) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
    );
}

export default function Stats() {
    const [selectedWindow, setSelectedWindow] = useState<WindowOption>(24);
    const [trendRows, setTrendRows] = useState<SensorSummary[]>([]);
    const [trendLoading, setTrendLoading] = useState(true);
    const [trendError, setTrendError] = useState<string | null>(null);
    const [sensorRefreshSignal, setSensorRefreshSignal] = useState(0);

    const { plants, sondes } = useGardenStorage();
    const sensorData = useSensorData(sensorRefreshSignal);
    const {
        hubs,
        loading: hubsLoading,
        error: hubsError,
        refresh: refreshHubs,
    } = useHubs();
    const readableHubs = useMemo(
        () => hubs.filter((hub) => hub.claimed && !hub.revoked),
        [hubs],
    );

    useEffect(() => {
        let cancelled = false;

        async function loadTrendRows() {
            if (hubsLoading) {
                return;
            }

            if (readableHubs.length === 0) {
                if (!cancelled) {
                    setTrendRows([]);
                    setTrendError(null);
                    setTrendLoading(false);
                }
                return;
            }

            setTrendLoading(true);
            setTrendError(null);

            const responses = await Promise.allSettled(
                readableHubs.map((hub) =>
                    getSummary(undefined, selectedWindow, String(hub.id)),
                ),
            );

            if (!cancelled) {
                const fulfilledResponses = responses.flatMap((result) =>
                    result.status === "fulfilled" ? [result.value] : [],
                );
                const rejectedResponses = responses.filter(
                    (result) => result.status === "rejected",
                );

                setTrendRows(fulfilledResponses.flat());

                if (fulfilledResponses.length === 0 && rejectedResponses.length > 0) {
                    const firstReason = rejectedResponses[0].reason;
                    setTrendError(
                        firstReason instanceof Error
                            ? firstReason.message
                            : "Impossible de charger les tendances.",
                    );
                } else if (rejectedResponses.length > 0) {
                    setTrendError("Certaines tendances de hub sont momentanément indisponibles.");
                } else {
                    setTrendError(null);
                }

                setTrendLoading(false);
            }
        }

        void loadTrendRows();

        return () => {
            cancelled = true;
        };
    }, [hubsLoading, readableHubs, selectedWindow]);

    const liveReadings = useMemo(
        () => Array.from(sensorData.values()),
        [sensorData],
    );

    const validSondeIds = useMemo(
        () => new Set(sondes.map((sonde) => sonde.id)),
        [sondes],
    );

    const linkedPlantIds = useMemo(
        () =>
            new Set(
                plants
                    .filter((plant) => plant.sondeId !== null && validSondeIds.has(plant.sondeId))
                    .map((plant) => plant.id),
            ),
        [plants, validSondeIds],
    );

    const linkedSondeIds = useMemo(
        () =>
            new Set(
                plants.flatMap((plant) =>
                    plant.sondeId !== null && validSondeIds.has(plant.sondeId)
                        ? [plant.sondeId]
                        : [],
                ),
            ),
        [plants, validSondeIds],
    );

    const totalQuantity = useMemo(
        () => plants.reduce((sum, plant) => sum + plant.quantity, 0),
        [plants],
    );

    const linkedPlantsCount = linkedPlantIds.size;
    const probeCoverage = plants.length > 0 ? Math.round((linkedPlantsCount / plants.length) * 100) : 0;
    const activeHubCount = hubs.filter((hub) => hub.claimed && !hub.revoked).length;
    const pendingHubCount = hubs.filter((hub) => !hub.claimed && !hub.revoked).length;
    const revokedHubCount = hubs.filter((hub) => hub.revoked).length;

    async function refreshDashboard(): Promise<void> {
        setSensorRefreshSignal((current) => current + 1);
        await refreshHubs();
    }

    const averageAirTemperature = average(
        liveReadings.map((reading) => reading.airTemperature),
    );
    const averageAirHumidity = average(liveReadings.map((reading) => reading.airHumidity));
    const averageSoilHumidity = average(liveReadings.map((reading) => reading.soilHumidity));
    const averageSoilTemperature = average(
        liveReadings.map((reading) => reading.soilTemperature),
    );

    const humidityStatus = getHumidityStatus(averageSoilHumidity);

    const moistureDistribution = useMemo(() => {
        const distribution = {
            dry: 0,
            ideal: 0,
            wet: 0,
        };

        for (const reading of liveReadings) {
            if (reading.soilHumidity === undefined) {
                continue;
            }

            if (reading.soilHumidity < 35) {
                distribution.dry += 1;
            } else if (reading.soilHumidity <= 70) {
                distribution.ideal += 1;
            } else {
                distribution.wet += 1;
            }
        }

        return distribution;
    }, [liveReadings]);

    const moistureTotal =
        moistureDistribution.dry + moistureDistribution.ideal + moistureDistribution.wet;

    const trendPoints = useMemo(() => aggregateTrendPoints(trendRows), [trendRows]);
    const recentTrendPoints = trendPoints.slice(-8);
    const airTrendValues = recentTrendPoints.map((point) => point.airTemperature ?? 0);
    const soilTrendValues = recentTrendPoints.map((point) => point.soilHumidity ?? 0);
    const trendLabels = recentTrendPoints.map((point) => point.label);

    const latestTrendPoint = trendPoints.length > 0 ? trendPoints[trendPoints.length - 1] : null;
    const firstTrendPoint = trendPoints.length > 0 ? trendPoints[0] : null;

    const airDelta =
        latestTrendPoint?.airTemperature !== null &&
        latestTrendPoint?.airTemperature !== undefined &&
        firstTrendPoint?.airTemperature !== null &&
        firstTrendPoint?.airTemperature !== undefined
            ? latestTrendPoint.airTemperature - firstTrendPoint.airTemperature
            : null;

    const soilDelta =
        latestTrendPoint?.soilHumidity !== null &&
        latestTrendPoint?.soilHumidity !== undefined &&
        firstTrendPoint?.soilHumidity !== null &&
        firstTrendPoint?.soilHumidity !== undefined
            ? latestTrendPoint.soilHumidity - firstTrendPoint.soilHumidity
            : null;

    const maxRecordedTemperature = useMemo(() => {
        const validValues = trendPoints
            .map((point) => point.maxAirTemperature)
            .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
        return validValues.length > 0 ? Math.max(...validValues) : null;
    }, [trendPoints]);

    const latestSync = latestTrendPoint ? BigInt(latestTrendPoint.key) : null;

    const hubCards = useMemo(() => {
        return hubs.map((hub) => {
            const hubSondes = sondes.filter((sonde) => sonde.hubName === hub.hubName);
            const hubSondeIds = new Set(hubSondes.map((sonde) => sonde.id));
            const hubPlants = plants.filter(
                (plant) => plant.sondeId !== null && hubSondeIds.has(plant.sondeId),
            );
            const hubActiveNodeCount = hubSondes.filter((sonde) => sensorData.has(sonde.nodeId)).length;

            return {
                hub,
                probeCount: hubSondes.length,
                activeNodeCount: hubActiveNodeCount,
                plantCount: hubPlants.length,
                quantity: hubPlants.reduce((sum, plant) => sum + plant.quantity, 0),
                topProbeLabel:
                    hubSondes.length > 0
                        ? getSondeDisplayName(hubSondes[0], sondes)
                        : "Aucune sonde liée",
            };
        });
    }, [hubs, plants, sensorData, sondes]);

    const heroSummary = useMemo(() => {
        if (plants.length === 0 && hubs.length === 0 && sensorData.size === 0) {
            return "Ajoutez un hub puis reliez des sondes à vos plantes pour obtenir des indicateurs concrets.";
        }

        return `${sensorData.size} sonde${sensorData.size > 1 ? "s" : ""} active${sensorData.size > 1 ? "s" : ""} · ${linkedPlantsCount}/${plants.length || 0} plante${plants.length > 1 ? "s" : ""} suivie${linkedPlantsCount > 1 ? "s" : ""}`;
    }, [hubs.length, linkedPlantsCount, plants.length, sensorData.size]);

    const isEmpty =
        !hubsLoading &&
        !trendLoading &&
        hubs.length === 0 &&
        plants.length === 0 &&
        sensorData.size === 0;

    const refreshing = hubsLoading || trendLoading;
    const showHubEmptyState = !hubsLoading && hubCards.length === 0;

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            void refreshDashboard();
                        }}
                        tintColor={colors.brand.secondary}
                    />
                }
            >
                <View style={styles.hero}>
                    <View style={styles.heroBadge}>
                        <Feather name="activity" size={14} color={colors.text.onPrimary} />
                        <Text style={styles.heroBadgeText}>Vue opérationnelle du jardin</Text>
                    </View>
                    <Text style={styles.heroTitle}>Statistiques utiles</Text>
                    <Text style={styles.heroSubtitle}>{heroSummary}</Text>

                    <View style={styles.heroFooter}>
                        <View>
                            <Text style={styles.heroMetaLabel}>Dernière tendance</Text>
                            <Text style={styles.heroMetaValue}>{formatCompactDate(latestSync)}</Text>
                        </View>
                        <View style={styles.heroWindowSelector}>
                            {WINDOW_OPTIONS.map((option) => {
                                const active = option.hours === selectedWindow;
                                return (
                                    <TouchableOpacity
                                        key={option.hours}
                                        accessibilityRole="button"
                                        style={[
                                            styles.windowPill,
                                            active && styles.windowPillActive,
                                        ]}
                                        onPress={() => setSelectedWindow(option.hours)}
                                    >
                                        <Text
                                            style={[
                                                styles.windowPillText,
                                                active && styles.windowPillTextActive,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {isEmpty ? (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconWrap}>
                            <Feather name="bar-chart-2" size={20} color={colors.brand.secondary} />
                        </View>
                        <Text style={styles.emptyTitle}>Le tableau de bord attend ses premières données</Text>
                        <Text style={styles.emptyText}>
                            Associez vos hubs, ajoutez une sonde à une plante puis revenez ici pour suivre la santé du jardin.
                        </Text>
                    </View>
                ) : (
                    <>
                        <SectionHeader
                            eyebrow="Vue d'ensemble"
                            title="Les indicateurs qui comptent aujourd'hui"
                            subtitle="Couverture de vos plantes, activité des hubs et volume réel de suivi."
                        />

                        <View style={styles.kpiGrid}>
                            <KpiCard
                                icon="grid"
                                label="Plantes"
                                value={String(plants.length)}
                                helper={`${totalQuantity} unité${totalQuantity > 1 ? "s" : ""} plantée${totalQuantity > 1 ? "s" : ""}`}
                            />
                            <KpiCard
                                icon="radio"
                                label="Sondes actives"
                                value={String(sensorData.size)}
                                helper={`${linkedSondeIds.size} liée${linkedSondeIds.size > 1 ? "s" : ""} au jardin`}
                                tone="accent"
                            />
                            <KpiCard
                                icon="target"
                                label="Couverture"
                                value={`${probeCoverage}%`}
                                helper={`${linkedPlantsCount}/${plants.length || 0} plante${plants.length > 1 ? "s" : ""} suivie${linkedPlantsCount > 1 ? "s" : ""}`}
                            />
                            <KpiCard
                                icon="cpu"
                                label="Hubs"
                                value={String(activeHubCount)}
                                helper={`${pendingHubCount} en attente · ${revokedHubCount} révoqué${revokedHubCount > 1 ? "s" : ""}`}
                            />
                        </View>

                        <SectionHeader
                            eyebrow="Climat en direct"
                            title="Lecture instantanée de l'environnement"
                            subtitle="Moyennes calculées à partir des dernières sondes disponibles dans vos hubs."
                        />

                        <View style={styles.climateGrid}>
                            <ClimateCard
                                icon="thermometer"
                                label="Air"
                                value={formatMetric(averageAirTemperature, "°C", 1)}
                                helper="Température moyenne"
                                color={colors.state.danger}
                            />
                            <ClimateCard
                                icon="droplet"
                                label="Humidité air"
                                value={formatMetric(averageAirHumidity, "%")}
                                helper="Niveau ambiant"
                                color={colors.brand.info}
                            />
                            <ClimateCard
                                icon="cloud-rain"
                                label="Humidité sol"
                                value={formatMetric(averageSoilHumidity, "%")}
                                helper={humidityStatus.label}
                                color={colors.state.success}
                            />
                            <ClimateCard
                                icon="sun"
                                label="Température sol"
                                value={formatMetric(averageSoilTemperature, "°C", 1)}
                                helper="Moyenne des racines"
                                color={colors.brand.secondary}
                            />
                        </View>

                        <SectionHeader
                            eyebrow="Santé hydrique"
                            title="Répartition de l'humidité du sol"
                            subtitle="Repérez immédiatement les zones trop sèches, stables ou sur-arrosées."
                        />

                        <View style={styles.moistureCard}>
                            <View style={styles.moistureHeader}>
                                <View>
                                    <Text style={styles.moistureTitle}>État global des substrats</Text>
                                    <Text style={styles.moistureSubtitle}>
                                        {moistureTotal > 0
                                            ? `${moistureTotal} lecture${moistureTotal > 1 ? "s" : ""} de sol analysée${moistureTotal > 1 ? "s" : ""}`
                                            : "Aucune lecture de sol disponible"}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.moistureBadge,
                                        { backgroundColor: humidityStatus.backgroundColor },
                                    ]}
                                >
                                    <Text style={[styles.moistureBadgeText, { color: humidityStatus.color }]}>
                                        {humidityStatus.label}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.moistureBarTrack}>
                                <View
                                    style={[
                                        styles.moistureBarSegment,
                                        styles.moistureBarDry,
                                        {
                                            flex: moistureDistribution.dry || (moistureTotal === 0 ? 1 : 0),
                                        },
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.moistureBarSegment,
                                        styles.moistureBarIdeal,
                                        {
                                            flex: moistureDistribution.ideal || (moistureTotal === 0 ? 1 : 0),
                                        },
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.moistureBarSegment,
                                        styles.moistureBarWet,
                                        {
                                            flex: moistureDistribution.wet || (moistureTotal === 0 ? 1 : 0),
                                        },
                                    ]}
                                />
                            </View>

                            <View style={styles.moistureLegendRow}>
                                <View style={styles.moistureLegendItem}>
                                    <View style={[styles.moistureLegendDot, styles.moistureBarDry]} />
                                    <Text style={styles.moistureLegendLabel}>Sec</Text>
                                    <Text style={styles.moistureLegendValue}>{moistureDistribution.dry}</Text>
                                </View>
                                <View style={styles.moistureLegendItem}>
                                    <View style={[styles.moistureLegendDot, styles.moistureBarIdeal]} />
                                    <Text style={styles.moistureLegendLabel}>Idéal</Text>
                                    <Text style={styles.moistureLegendValue}>{moistureDistribution.ideal}</Text>
                                </View>
                                <View style={styles.moistureLegendItem}>
                                    <View style={[styles.moistureLegendDot, styles.moistureBarWet]} />
                                    <Text style={styles.moistureLegendLabel}>Humide</Text>
                                    <Text style={styles.moistureLegendValue}>{moistureDistribution.wet}</Text>
                                </View>
                            </View>
                        </View>

                        <SectionHeader
                            eyebrow="Tendances récentes"
                            title="Évolution agrégée sur les dernières heures"
                            subtitle="Une lecture consolidée par créneau pour voir les mouvements utiles, pas du bruit."
                        />

                        {trendLoading ? (
                            <View style={styles.loadingCard}>
                                <ActivityIndicator size="small" color={colors.brand.secondary} />
                                <Text style={styles.loadingText}>Chargement des tendances...</Text>
                            </View>
                        ) : trendError && recentTrendPoints.length === 0 ? (
                            <View style={styles.errorCard}>
                                <Feather name="alert-circle" size={16} color={colors.state.danger} />
                                <Text style={styles.errorText}>{trendError}</Text>
                            </View>
                        ) : recentTrendPoints.length === 0 ? (
                            <View style={styles.loadingCard}>
                                <Text style={styles.loadingText}>Aucune tendance disponible pour cette période.</Text>
                            </View>
                        ) : (
                            <View style={styles.chartGrid}>
                                <BarChartCard
                                    title="Air moyen"
                                    caption="Température moyenne par créneau"
                                    color={colors.state.danger}
                                    points={airTrendValues}
                                    labels={trendLabels}
                                    currentValue={formatMetric(latestTrendPoint?.airTemperature ?? null, "°C", 1)}
                                    deltaLabel={
                                        airDelta === null
                                            ? "Variation indisponible"
                                            : `${airDelta >= 0 ? "+" : ""}${airDelta.toFixed(1)}°C depuis le début de la période`
                                    }
                                    testID="air-trend-card"
                                />
                                <BarChartCard
                                    title="Humidité du sol"
                                    caption="Niveau moyen par créneau"
                                    color={colors.state.success}
                                    points={soilTrendValues}
                                    labels={trendLabels}
                                    currentValue={formatMetric(latestTrendPoint?.soilHumidity ?? null, "%")}
                                    deltaLabel={
                                        soilDelta === null
                                            ? "Variation indisponible"
                                            : `${soilDelta >= 0 ? "+" : ""}${soilDelta.toFixed(0)} pts depuis le début de la période`
                                    }
                                    testID="soil-trend-card"
                                />
                            </View>
                        )}

                        {trendError && recentTrendPoints.length > 0 ? (
                            <View style={styles.errorCard}>
                                <Feather name="alert-circle" size={16} color={colors.state.danger} />
                                <Text style={styles.errorText}>{trendError}</Text>
                            </View>
                        ) : null}

                        <View style={styles.highlightRow}>
                            <View style={styles.highlightCard}>
                                <Text style={styles.highlightLabel}>Pic chaleur</Text>
                                <Text style={styles.highlightValue}>
                                    {formatMetric(maxRecordedTemperature, "°C", 1)}
                                </Text>
                                <Text style={styles.highlightHelper}>Maximum relevé sur la période choisie</Text>
                            </View>
                            <View style={styles.highlightCard}>
                                <Text style={styles.highlightLabel}>Auto-refresh</Text>
                                <Text style={styles.highlightValue}>30s</Text>
                                <Text style={styles.highlightHelper}>Les lectures instantanées se mettent à jour automatiquement</Text>
                            </View>
                        </View>

                        <SectionHeader
                            eyebrow="Hubs connectés"
                            title="Capacité terrain par hub"
                            subtitle="Pour chaque hub, voyez la couverture locale, les sondes liées et le volume suivi."
                        />

                        {hubsError ? <Text style={styles.inlineError}>{hubsError}</Text> : null}

                        {showHubEmptyState ? (
                            <View style={styles.loadingCard}>
                                <Text style={styles.loadingText}>
                                    Aucun hub actif à afficher pour l&apos;instant. Associez ou activez un hub pour comparer vos zones.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.hubList}>
                                {hubCards.map(({ hub, probeCount, activeNodeCount, plantCount, quantity, topProbeLabel }) => {
                                    const statusLabel = hub.revoked
                                        ? "Révoqué"
                                        : hub.claimed
                                          ? "Actif"
                                          : "En attente";

                                    const statusStyle = hub.revoked
                                        ? styles.hubBadgeDanger
                                        : hub.claimed
                                          ? styles.hubBadgeSuccess
                                          : styles.hubBadgeWarning;

                                    return (
                                        <View key={String(hub.id)} style={styles.hubCard}>
                                            <View style={styles.hubCardHeader}>
                                                <View style={styles.hubTitleWrap}>
                                                    <Text style={styles.hubTitle}>{hub.hubName}</Text>
                                                    <Text style={styles.hubMeta}>Ajouté le {formatHubDate(hub.createdAt)}</Text>
                                                </View>

                                                <View style={[styles.hubBadge, statusStyle]}>
                                                    <Text style={styles.hubBadgeText}>{statusLabel}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.hubStatsRow}>
                                                <View style={styles.hubStat}>
                                                    <Text style={styles.hubStatValue}>{probeCount}</Text>
                                                    <Text style={styles.hubStatLabel}>sondes liées</Text>
                                                </View>
                                                <View style={styles.hubStat}>
                                                    <Text style={styles.hubStatValue}>{activeNodeCount}</Text>
                                                    <Text style={styles.hubStatLabel}>en lecture</Text>
                                                </View>
                                                <View style={styles.hubStat}>
                                                    <Text style={styles.hubStatValue}>{plantCount}</Text>
                                                    <Text style={styles.hubStatLabel}>plantes suivies</Text>
                                                </View>
                                            </View>

                                            <View style={styles.hubFooter}>
                                                <Text style={styles.hubFooterText} numberOfLines={1}>
                                                    Sonde repère: {topProbeLabel}
                                                </Text>
                                                <Text style={styles.hubFooterText}>
                                                    {quantity} unité{quantity > 1 ? "s" : ""} cultivée{quantity > 1 ? "s" : ""}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.surface.base,
    },
    content: {
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 120,
        gap: 22,
    },
    hero: {
        backgroundColor: colors.brand.primary,
        borderRadius: 30,
        padding: 20,
        gap: 14,
        shadowColor: colors.overlay.shadow,
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.8,
        shadowRadius: 24,
        elevation: 8,
    },
    heroBadge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: withAlpha(colors.base.white, 0.14),
    },
    heroBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.text.onPrimary,
    },
    heroTitle: {
        fontSize: 30,
        fontWeight: "800",
        color: colors.text.onPrimary,
    },
    heroSubtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: withAlpha(colors.base.white, 0.84),
    },
    heroFooter: {
        gap: 12,
    },
    heroMetaLabel: {
        fontSize: 12,
        color: withAlpha(colors.base.white, 0.64),
    },
    heroMetaValue: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.text.onPrimary,
    },
    heroWindowSelector: {
        flexDirection: "row",
        gap: 10,
        flexWrap: "wrap",
    },
    windowPill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: withAlpha(colors.base.white, 0.08),
        borderWidth: 1,
        borderColor: withAlpha(colors.base.white, 0.12),
    },
    windowPillActive: {
        backgroundColor: colors.surface.lowest,
        borderColor: colors.surface.lowest,
    },
    windowPillText: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.text.onPrimary,
    },
    windowPillTextActive: {
        color: colors.text.secondary,
    },
    emptyCard: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 28,
        padding: 20,
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.18),
    },
    emptyIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: withAlpha(colors.brand.secondary, 0.12),
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.text.secondary,
        textAlign: "center",
    },
    emptyText: {
        fontSize: 13,
        lineHeight: 20,
        color: colors.text.muted,
        textAlign: "center",
    },
    sectionHeader: {
        gap: 4,
    },
    sectionEyebrow: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: colors.brand.secondary,
    },
    sectionTitle: {
        fontSize: 21,
        fontWeight: "800",
        color: colors.text.primary,
    },
    sectionSubtitle: {
        fontSize: 13,
        lineHeight: 19,
        color: colors.text.muted,
    },
    kpiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    kpiCard: {
        width: "48%",
        minWidth: 156,
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.18),
    },
    kpiCardAccent: {
        backgroundColor: colors.brand.primary,
        borderColor: withAlpha(colors.base.white, 0.08),
    },
    kpiIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: withAlpha(colors.brand.secondary, 0.12),
    },
    kpiIconWrapAccent: {
        backgroundColor: withAlpha(colors.base.white, 0.12),
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.text.muted,
    },
    kpiLabelAccent: {
        color: withAlpha(colors.base.white, 0.72),
    },
    kpiValue: {
        fontSize: 24,
        fontWeight: "800",
        color: colors.text.primary,
    },
    kpiValueAccent: {
        color: colors.text.onPrimary,
    },
    kpiHelper: {
        fontSize: 12,
        lineHeight: 18,
        color: colors.text.muted,
    },
    kpiHelperAccent: {
        color: withAlpha(colors.base.white, 0.74),
    },
    climateGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    climateCard: {
        width: "48%",
        minWidth: 156,
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.18),
    },
    climateIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },
    climateLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.text.muted,
    },
    climateValue: {
        fontSize: 22,
        fontWeight: "800",
        color: colors.text.primary,
    },
    climateHelper: {
        fontSize: 12,
        color: colors.text.muted,
    },
    moistureCard: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 28,
        padding: 18,
        gap: 14,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.18),
    },
    moistureHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    moistureTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.text.secondary,
    },
    moistureSubtitle: {
        fontSize: 12,
        color: colors.text.muted,
        marginTop: 3,
    },
    moistureBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    moistureBadgeText: {
        fontSize: 11,
        fontWeight: "800",
    },
    moistureBarTrack: {
        height: 16,
        borderRadius: 999,
        overflow: "hidden",
        flexDirection: "row",
        backgroundColor: colors.surface.low,
    },
    moistureBarSegment: {
        height: "100%",
    },
    moistureBarDry: {
        backgroundColor: colors.state.danger,
    },
    moistureBarIdeal: {
        backgroundColor: colors.state.success,
    },
    moistureBarWet: {
        backgroundColor: colors.brand.info,
    },
    moistureLegendRow: {
        flexDirection: "row",
        gap: 14,
        flexWrap: "wrap",
    },
    moistureLegendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.surface.low,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
    },
    moistureLegendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    moistureLegendLabel: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    moistureLegendValue: {
        fontSize: 12,
        fontWeight: "800",
        color: colors.text.primary,
    },
    loadingCard: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.18),
    },
    loadingText: {
        fontSize: 13,
        color: colors.text.muted,
    },
    errorCard: {
        backgroundColor: colors.state.dangerSoft,
        borderRadius: 20,
        padding: 14,
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: colors.state.danger,
    },
    chartGrid: {
        gap: 12,
    },
    chartCard: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.18),
    },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    chartTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.text.secondary,
    },
    chartCaption: {
        fontSize: 12,
        color: colors.text.muted,
        marginTop: 3,
    },
    chartValuePill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    chartValue: {
        fontSize: 12,
        fontWeight: "800",
    },
    chartArea: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 8,
        minHeight: 104,
    },
    chartColumn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
    },
    chartBar: {
        width: "100%",
        maxWidth: 28,
        borderRadius: 999,
        borderWidth: 1,
    },
    chartLabel: {
        fontSize: 10,
        color: colors.text.muted,
    },
    chartDelta: {
        fontSize: 12,
        color: colors.text.muted,
    },
    highlightRow: {
        flexDirection: "row",
        gap: 12,
        flexWrap: "wrap",
    },
    highlightCard: {
        flex: 1,
        minWidth: 156,
        backgroundColor: colors.surface.low,
        borderRadius: 24,
        padding: 16,
        gap: 6,
    },
    highlightLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.text.muted,
    },
    highlightValue: {
        fontSize: 22,
        fontWeight: "800",
        color: colors.text.primary,
    },
    highlightHelper: {
        fontSize: 12,
        lineHeight: 18,
        color: colors.text.muted,
    },
    inlineError: {
        fontSize: 12,
        color: colors.state.danger,
    },
    hubList: {
        gap: 12,
    },
    hubCard: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        padding: 16,
        gap: 14,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.18),
    },
    hubCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    hubTitleWrap: {
        flex: 1,
    },
    hubTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.text.secondary,
    },
    hubMeta: {
        fontSize: 12,
        color: colors.text.muted,
        marginTop: 4,
    },
    hubBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    hubBadgeSuccess: {
        backgroundColor: colors.state.successSoft,
    },
    hubBadgeWarning: {
        backgroundColor: colors.state.warningSoft,
    },
    hubBadgeDanger: {
        backgroundColor: colors.state.dangerSoft,
    },
    hubBadgeText: {
        fontSize: 11,
        fontWeight: "800",
        color: colors.text.secondary,
    },
    hubStatsRow: {
        flexDirection: "row",
        gap: 10,
    },
    hubStat: {
        flex: 1,
        backgroundColor: colors.surface.low,
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: "center",
        gap: 4,
    },
    hubStatValue: {
        fontSize: 18,
        fontWeight: "800",
        color: colors.text.primary,
    },
    hubStatLabel: {
        fontSize: 11,
        textAlign: "center",
        color: colors.text.muted,
    },
    hubFooter: {
        gap: 4,
    },
    hubFooterText: {
        fontSize: 12,
        color: colors.text.muted,
    },
});
