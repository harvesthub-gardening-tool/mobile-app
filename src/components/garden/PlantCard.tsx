import { memo, useCallback, useEffect } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  runOnJS,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";
import type { PlacedPlant, PlacedSonde } from "../../types/garden";
import { MIN_CARD_SIZE, DEFAULT_CELL } from "../../constants/garden";
import { getSondeDisplayName } from "../../utils/sondeDisplay";
import type { ProbeSensorData } from "../../hooks/useSensorData";
import { colors, withAlpha } from "../../theme";

const HANDLE_SIZE = 24;
const HEADER_HEIGHT = 18;
const CARD_BACKGROUND_IMAGE = require("../../../assets/images/garden_card_bg.png");

const AnimatedFeather = Animated.createAnimatedComponent(Feather);

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

  const handleHitSlop = HANDLE_SIZE * 0.5;

  // ── Shared values ──────────────────────────────────────────────────────────
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
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [isSelected, isMoving, pulse]);

  // ── Live size ratio (UI thread) ────────────────────────────────────────────
  // Reads offsetW/offsetH on every gesture frame → all derived styles update
  // in real time during resize, not just on commit.
  const animSizeRatio = useDerivedValue(() => {
    const w = Math.max(MIN_CARD_SIZE, plant.width + offsetW.value);
    const h = Math.max(MIN_CARD_SIZE, plant.height + offsetH.value);
    return Math.min(w, h) / DEFAULT_CELL;
  });

  // ── Emoji count (JS thread, discrete) ─────────────────────────────────────

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

  // ── Animated styles (all driven by animSizeRatio → UI-thread smooth) ───────

  const animatedCardStyle = useAnimatedStyle(() => {
    const r = animSizeRatio.value;
    const hFS = Math.max(5, Math.round(12 * r));
    return {
      left: plant.x + offsetX.value,
      top: plant.y + offsetY.value,
      width: Math.max(MIN_CARD_SIZE, plant.width + offsetW.value),
      height: Math.max(MIN_CARD_SIZE, plant.height + offsetH.value) + hFS + 6,
      borderColor: isMoving
        ? colors.brand.info
        : isSelected
          ? withAlpha(colors.brand.primary, 0.45 + 0.4 * pulse.value)
          : withAlpha(colors.base.white, 0.5),
      shadowColor: colors.overlay.shadow,
      shadowOpacity: isSelected ? 1 : 0,
      shadowRadius: isSelected ? 40 + 8 * pulse.value : 0,
      elevation: isSelected ? 6 : 0,
    };
  });

  // Header row height
  const animTopRowStyle = useAnimatedStyle(() => {
    const r = animSizeRatio.value;
    return { height: Math.max(5, Math.round(12 * r)) + 6 };
  });

  // Header text fontSize (shared by all 5 label copies)
  const animHeaderTextStyle = useAnimatedStyle(() => ({
    fontSize: Math.max(5, Math.round(12 * animSizeRatio.value)),
  }));

  // Shadow/outline offsets for the 4 absolute copies
  const animOutlineLeftStyle = useAnimatedStyle(() => ({
    left: -Math.max(0.5, animSizeRatio.value * 0.8),
  }));
  const animOutlineRightStyle = useAnimatedStyle(() => ({
    left: Math.max(0.5, animSizeRatio.value * 0.8),
  }));
  const animOutlineTopStyle = useAnimatedStyle(() => ({
    top: -Math.max(0.5, animSizeRatio.value * 0.8),
  }));
  const animOutlineBottomStyle = useAnimatedStyle(() => ({
    top: Math.max(0.5, animSizeRatio.value * 0.8),
  }));

  // Badge row gap
  const animBadgeRowStyle = useAnimatedStyle(() => ({
    gap: Math.max(2, Math.round(4 * animSizeRatio.value)),
  }));

  // Badge gap + padding (shared by all 4 badge views)
  const animBadgeStyle = useAnimatedStyle(() => {
    const r = animSizeRatio.value;
    return {
      gap: Math.max(2, Math.round(4 * r)),
      paddingHorizontal: Math.max(3, Math.round(6 * r)),
      paddingVertical: Math.max(1, Math.round(2 * r)),
    };
  });

  // Sensor value text fontSize
  const animSensorTextStyle = useAnimatedStyle(() => ({
    fontSize: Math.max(6, Math.round(14 * animSizeRatio.value)),
  }));

  // Emoji fontSize — grows at half the original rate so the grid fills the space
  const animEmojiStyle = useAnimatedStyle(() => ({
    fontSize: Math.max(16, Math.round(32 * animSizeRatio.value)),
  }));

  const animIconContainerStyle = useAnimatedStyle(() => {
    const sz = Math.max(4, Math.round(9 * animSizeRatio.value));
    return {
      width: sz,
      height: sz,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      overflow: "visible" as const,
    };
  });

  const animIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animSizeRatio.value }],
  }));

  const animHandleTLStyle = useAnimatedStyle(() => {
    const sz = HANDLE_SIZE / mapScale.value;
    const half = sz / 2;
    return { width: sz, height: sz, borderRadius: half, top: -half, left: -half };
  });
  const animHandleTRStyle = useAnimatedStyle(() => {
    const sz = HANDLE_SIZE / mapScale.value;
    const half = sz / 2;
    return { width: sz, height: sz, borderRadius: half, top: -half, right: -half };
  });
  const animHandleBLStyle = useAnimatedStyle(() => {
    const sz = HANDLE_SIZE / mapScale.value;
    const half = sz / 2;
    return { width: sz, height: sz, borderRadius: half, bottom: -half, left: -half };
  });
  const animHandleBRStyle = useAnimatedStyle(() => {
    const sz = HANDLE_SIZE / mapScale.value;
    const half = sz / 2;
    return { width: sz, height: sz, borderRadius: half, bottom: -half, right: -half };
  });

  const handlePress = useCallback(() => onPress(plant.id), [onPress, plant.id]);

  const cardContent = (
    <>
      <ImageBackground
        source={CARD_BACKGROUND_IMAGE}
        style={styles.cardBackground}
        imageStyle={styles.cardBackgroundImage}
      >
        <Animated.View style={[styles.topRow, animTopRowStyle]}>
          {probeDisplayName && (
            <View style={styles.headerProbeTextWrap}>
              <Animated.Text
                style={[
                  styles.headerProbeName,
                  styles.headerProbeNameOutlineLeft,
                  animHeaderTextStyle,
                  animOutlineLeftStyle,
                ]}
                numberOfLines={1}
              >
                {probeDisplayName}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.headerProbeName,
                  styles.headerProbeNameOutlineRight,
                  animHeaderTextStyle,
                  animOutlineRightStyle,
                ]}
                numberOfLines={1}
              >
                {probeDisplayName}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.headerProbeName,
                  styles.headerProbeNameOutlineTop,
                  animHeaderTextStyle,
                  animOutlineTopStyle,
                ]}
                numberOfLines={1}
              >
                {probeDisplayName}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.headerProbeName,
                  styles.headerProbeNameOutlineBottom,
                  animHeaderTextStyle,
                  animOutlineBottomStyle,
                ]}
                numberOfLines={1}
              >
                {probeDisplayName}
              </Animated.Text>
              <Animated.Text
                style={[styles.headerProbeName, animHeaderTextStyle]}
                numberOfLines={1}
              >
                {probeDisplayName}
              </Animated.Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.mainContainer}>
          <View style={styles.mainSectionAir}>
            <Animated.View style={[styles.airDataRow, animBadgeRowStyle]}>
              <Animated.View
                style={[styles.sensorBadge, styles.sensorBadgeTemp, animBadgeStyle]}
              >
                <Animated.View style={animIconContainerStyle}>
                  <AnimatedFeather
                    name="thermometer"
                    color={colors.text.onPrimary}
                    size={9}
                    style={animIconStyle}
                  />
                </Animated.View>
                <Animated.Text style={[styles.sensorValue, animSensorTextStyle]}>
                  {tempValue}
                </Animated.Text>
              </Animated.View>
              <Animated.View
                style={[styles.sensorBadge, styles.sensorBadgeHumid, animBadgeStyle]}
              >
                <Animated.View style={animIconContainerStyle}>
                  <AnimatedFeather
                    name="droplet"
                    color={colors.text.onPrimary}
                    size={9}
                    style={animIconStyle}
                  />
                </Animated.View>
                <Animated.Text style={[styles.sensorValue, animSensorTextStyle]}>
                  {humidValue}
                </Animated.Text>
              </Animated.View>
            </Animated.View>
          </View>

          <View style={styles.mainSectionPlant}>
            <Animated.Text style={animEmojiStyle}>
              {plant.plantType.emoji}
            </Animated.Text>
          </View>

          <View style={styles.mainSectionSoil}>
            <Animated.View style={[styles.soilDataRow, animBadgeRowStyle]}>
              <Animated.View
                style={[styles.sensorBadge, styles.sensorBadgeTemp, animBadgeStyle]}
              >
                <Animated.View style={animIconContainerStyle}>
                  <AnimatedFeather
                    name="thermometer"
                    color={colors.text.onPrimary}
                    size={9}
                    style={animIconStyle}
                  />
                </Animated.View>
                <Animated.Text style={[styles.sensorValue, animSensorTextStyle]}>
                  {soilTempValue}
                </Animated.Text>
              </Animated.View>
              <Animated.View
                style={[styles.sensorBadge, styles.sensorBadgeHumid, animBadgeStyle]}
              >
                <Animated.View style={animIconContainerStyle}>
                  <AnimatedFeather
                    name="cloud-rain"
                    color={colors.text.onPrimary}
                    size={9}
                    style={animIconStyle}
                  />
                </Animated.View>
                <Animated.Text style={[styles.sensorValue, animSensorTextStyle]}>
                  {soilHumidValue}
                </Animated.Text>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </ImageBackground>

      {isMoving && (
        <>
          <GestureDetector gesture={topLeftGesture}>
            <Animated.View
              hitSlop={handleHitSlop}
              style={[styles.handle, animHandleTLStyle]}
            />
          </GestureDetector>
          <GestureDetector gesture={topRightGesture}>
            <Animated.View
              hitSlop={handleHitSlop}
              style={[styles.handle, animHandleTRStyle]}
            />
          </GestureDetector>
          <GestureDetector gesture={bottomLeftGesture}>
            <Animated.View
              hitSlop={handleHitSlop}
              style={[styles.handle, animHandleBLStyle]}
            />
          </GestureDetector>
          <GestureDetector gesture={bottomRightGesture}>
            <Animated.View
              hitSlop={handleHitSlop}
              style={[styles.handle, animHandleBRStyle]}
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
    overflow: "hidden",
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
  handle: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.brand.info,
    borderWidth: 2,
    borderColor: colors.text.onPrimary,
  },
});
