import { memo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";
import type { PlacedPlant, PlacedSonde } from "../../types/garden";
import { MIN_CARD_SIZE } from "../../constants/garden";
import { getSondeDisplayName } from "../../utils/sondeDisplay";
import type { ProbeSensorData } from "../../hooks/useSensorData";
import { colors, withAlpha } from "../../theme";

const HANDLE_SIZE = 24;
const HANDLE_HIT = 32;
const HEADER_HEIGHT = 18;
const CARD_BACKGROUND_IMAGE = require("../../../assets/images/garden_card_bg.png");

type PlantCardProps = {
  plant: PlacedPlant;
  sondes: PlacedSonde[];
  sensorData: Map<string, ProbeSensorData>;
  isMoving: boolean;
  isSelected: boolean;
  mapScale: SharedValue<number>;
  isCardInteracting: SharedValue<boolean>;
  onPress: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PlantCard = memo(function PlantCard({
  plant,
  sondes,
  sensorData,
  isMoving,
  isSelected,
  mapScale,
  isCardInteracting,
  onPress,
  onMove,
  onResize,
}: PlantCardProps) {
  const linkedSonde = plant.sondeId
    ? sondes.find((s) => s.id === plant.sondeId)
    : null;
  const summary = linkedSonde?.nodeId
    ? sensorData.get(linkedSonde.nodeId)
    : undefined;
  const probeDisplayName = linkedSonde
    ? getSondeDisplayName(linkedSonde, sondes)
    : null;

  const tempValue =
    summary?.airTemperature !== undefined
      ? `${summary.airTemperature.toFixed(1)}°`
      : "--";
  const humidValue =
    summary?.airHumidity !== undefined
      ? `${Math.round(summary.airHumidity)}%`
      : "--";
  const soilHumidValue =
    summary?.soilHumidity !== undefined
      ? `${Math.round(summary.soilHumidity)}%`
      : "--";
  const soilTempValue =
    summary?.soilTemperature !== undefined
      ? `${summary.soilTemperature.toFixed(1)}°`
      : "--";

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const offsetW = useSharedValue(0);
  const offsetH = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    offsetX.value = 0;
    offsetY.value = 0;
    offsetW.value = 0;
    offsetH.value = 0;
  }, [plant.x, plant.y, plant.width, plant.height]);

  useEffect(() => {
    if (!isSelected || isMoving) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }

    pulse.value = withRepeat(
      withTiming(1, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [isSelected, isMoving, pulse]);

  const commitMove = useCallback(
    (dx: number, dy: number) => onMove(plant.id, plant.x + dx, plant.y + dy),
    [onMove, plant.id, plant.x, plant.y],
  );

  const commitResize = useCallback(
    (dx: number, dy: number, dw: number, dh: number) => {
      onResize(
        plant.id,
        plant.x + dx,
        plant.y + dy,
        Math.max(MIN_CARD_SIZE, plant.width + dw),
        Math.max(MIN_CARD_SIZE, plant.height + dh),
      );
    },
    [onResize, plant.id, plant.x, plant.y, plant.width, plant.height],
  );

  const dragGesture = Gesture.Pan()
    .enabled(isMoving)
    .onBegin(() => {
      isCardInteracting.value = true;
    })
    .onChange((e) => {
      offsetX.value += e.changeX / mapScale.value;
      offsetY.value += e.changeY / mapScale.value;
    })
    .onFinalize(() => {
      isCardInteracting.value = false;
      runOnJS(commitMove)(offsetX.value, offsetY.value);
    });

  function makeCornerGesture(
    anchorX: "left" | "right",
    anchorY: "top" | "bottom",
  ) {
    return Gesture.Pan()
      .enabled(isMoving)
      .onBegin(() => {
        isCardInteracting.value = true;
      })
      .onChange((e) => {
        const dx = e.changeX / mapScale.value;
        const dy = e.changeY / mapScale.value;
        if (anchorX === "left") {
          const w = offsetW.value - dx;
          if (plant.width + w >= MIN_CARD_SIZE) {
            offsetX.value += dx;
            offsetW.value = w;
          }
        } else {
          const w = offsetW.value + dx;
          if (plant.width + w >= MIN_CARD_SIZE) offsetW.value = w;
        }
        if (anchorY === "top") {
          const h = offsetH.value - dy;
          if (plant.height + h >= MIN_CARD_SIZE) {
            offsetY.value += dy;
            offsetH.value = h;
          }
        } else {
          const h = offsetH.value + dy;
          if (plant.height + h >= MIN_CARD_SIZE) offsetH.value = h;
        }
      })
      .onFinalize(() => {
        isCardInteracting.value = false;
        runOnJS(commitResize)(
          offsetX.value,
          offsetY.value,
          offsetW.value,
          offsetH.value,
        );
      });
  }

  const topLeftGesture = makeCornerGesture("left", "top");
  const topRightGesture = makeCornerGesture("right", "top");
  const bottomLeftGesture = makeCornerGesture("left", "bottom");
  const bottomRightGesture = makeCornerGesture("right", "bottom");

  const animatedCardStyle = useAnimatedStyle(() => ({
    left: plant.x + offsetX.value,
    top: plant.y + offsetY.value,
    width: Math.max(MIN_CARD_SIZE, plant.width + offsetW.value),
    height:
      Math.max(MIN_CARD_SIZE, plant.height + offsetH.value) + HEADER_HEIGHT,
    borderColor: isMoving
      ? colors.brand.info
      : isSelected
        ? withAlpha(colors.brand.primary, 0.45 + 0.4 * pulse.value)
        : withAlpha(colors.base.white, 0.5),
    // borderWidth: isMoving || isSelected ? 2 : 2,
    shadowColor: colors.overlay.shadow,
    shadowOpacity: isSelected ? 1 : 0,
    shadowRadius: isSelected ? 40 + 8 * pulse.value : 0,
    elevation: isSelected ? 6 : 0,
  }));

  const handlePress = useCallback(() => onPress(plant.id), [onPress, plant.id]);
  const handleHitSlop = (HANDLE_HIT - HANDLE_SIZE) / 2;

  const cardContent = (
    <>
      <ImageBackground
        source={CARD_BACKGROUND_IMAGE}
        style={styles.cardBackground}
        imageStyle={styles.cardBackgroundImage}
      >
        <View style={styles.topRow}>
          {probeDisplayName && (
            <View style={styles.headerProbeTextWrap}>
              <Text
                style={[
                  styles.headerProbeName,
                  styles.headerProbeNameOutlineLeft,
                ]}
                numberOfLines={1}
              >
                {probeDisplayName}
              </Text>
              <Text
                style={[
                  styles.headerProbeName,
                  styles.headerProbeNameOutlineRight,
                ]}
                numberOfLines={1}
              >
                {probeDisplayName}
              </Text>
              <Text
                style={[
                  styles.headerProbeName,
                  styles.headerProbeNameOutlineTop,
                ]}
                numberOfLines={1}
              >
                {probeDisplayName}
              </Text>
              <Text
                style={[
                  styles.headerProbeName,
                  styles.headerProbeNameOutlineBottom,
                ]}
                numberOfLines={1}
              >
                {probeDisplayName}
              </Text>
              <Text style={styles.headerProbeName} numberOfLines={1}>
                {probeDisplayName}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.mainContainer}>
          <View style={styles.mainSectionAir}>
            <View style={styles.airDataRow}>
              <View style={[styles.sensorBadge, styles.sensorBadgeTemp]}>
                <Feather
                  name="thermometer"
                  size={9}
                  color={colors.text.onPrimary}
                />
                <Text style={styles.sensorValue}>{tempValue}</Text>
              </View>
              <View style={[styles.sensorBadge, styles.sensorBadgeHumid]}>
                <Feather
                  name="droplet"
                  size={9}
                  color={colors.text.onPrimary}
                />
                <Text style={styles.sensorValue}>{humidValue}</Text>
              </View>
            </View>
          </View>

          <View style={styles.mainSectionPlant}>
            <Text style={styles.emoji}>{plant.plantType.emoji}</Text>
          </View>

          <View style={styles.mainSectionSoil}>
            <View style={styles.soilDataRow}>
              <View style={[styles.sensorBadge, styles.sensorBadgeTemp]}>
                <Feather
                  name="thermometer"
                  size={9}
                  color={colors.text.onPrimary}
                />
                <Text style={styles.sensorValue}>{soilTempValue}</Text>
              </View>
              <View style={[styles.sensorBadge, styles.sensorBadgeHumid]}>
                <Feather
                  name="cloud-rain"
                  size={9}
                  color={colors.text.onPrimary}
                />
                <Text style={styles.sensorValue}>{soilHumidValue}</Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>

      {isMoving && (
        <>
          <GestureDetector gesture={topLeftGesture}>
            <Animated.View
              hitSlop={handleHitSlop}
              style={[styles.handle, styles.handleTL]}
            />
          </GestureDetector>
          <GestureDetector gesture={topRightGesture}>
            <Animated.View
              hitSlop={handleHitSlop}
              style={[styles.handle, styles.handleTR]}
            />
          </GestureDetector>
          <GestureDetector gesture={bottomLeftGesture}>
            <Animated.View
              hitSlop={handleHitSlop}
              style={[styles.handle, styles.handleBL]}
            />
          </GestureDetector>
          <GestureDetector gesture={bottomRightGesture}>
            <Animated.View
              hitSlop={handleHitSlop}
              style={[styles.handle, styles.handleBR]}
            />
          </GestureDetector>
        </>
      )}
    </>
  );

  if (isMoving) {
    return (
      <GestureDetector gesture={dragGesture}>
        <Animated.View
          style={[styles.card, styles.cardMoving, animatedCardStyle]}
        >
          {cardContent}
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <AnimatedPressable
      style={[
        styles.card,
        {
          left: plant.x,
          top: plant.y,
          width: plant.width,
          height: plant.height + HEADER_HEIGHT,
        },
        animatedCardStyle,
      ]}
      onPress={handlePress}
    >
      {cardContent}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: withAlpha(colors.base.white, 0.5),
    backgroundColor: withAlpha(colors.base.white, 0.18),
    padding: 2,
  },
  cardMoving: {
    borderColor: colors.brand.info,
    backgroundColor: withAlpha(colors.brand.info, 0.14),
  },
  topRow: {
    height: HEADER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  headerProbeTextWrap: {
    maxWidth: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBackground: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardBackgroundImage: {
    resizeMode: "cover",
    opacity: 0.9,
  },
  headerProbeName: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: colors.text.onPrimary,
  },
  headerProbeNameOutlineLeft: {
    position: "absolute",
    left: -0.8,
    color: withAlpha(colors.base.black, 0.88),
  },
  headerProbeNameOutlineRight: {
    position: "absolute",
    left: 0.8,
    color: withAlpha(colors.base.black, 0.88),
  },
  headerProbeNameOutlineTop: {
    position: "absolute",
    top: -0.8,
    color: withAlpha(colors.base.black, 0.88),
  },
  headerProbeNameOutlineBottom: {
    position: "absolute",
    top: 0.8,
    color: withAlpha(colors.base.black, 0.88),
  },
  mainContainer: {
    flex: 1,
  },
  mainSectionAir: {
    minHeight: 0,
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 1,
  },
  mainSectionPlant: {
    minHeight: 0,
    flex: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  mainSectionSoil: {
    minHeight: 0,
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 1,
  },
  airDataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: "100%",
  },
  soilDataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sensorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sensorBadgeTemp: {
    backgroundColor: withAlpha(colors.state.danger, 0.78),
  },
  sensorBadgeHumid: {
    backgroundColor: withAlpha(colors.brand.primary, 0.82),
  },
  sensorValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.onPrimary,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 64,
  },
  handle: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.brand.info,
    borderWidth: 2,
    borderColor: colors.text.onPrimary,
  },
  handleTL: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  handleTR: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  handleBL: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  handleBR: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
});
