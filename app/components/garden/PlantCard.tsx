import { memo, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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
const BOTTOM_BAR_HEIGHT = 40;

type PlantCardProps = {
  plant: PlacedPlant;
  sondes: PlacedSonde[];
  sensorData: Map<string, ProbeSensorData>;
  isMoving: boolean;
  isSelected: boolean;
  mapScale: SharedValue<number>;
  isCardInteracting: SharedValue<boolean>;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleMove: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, x: number, y: number, width: number, height: number) => void;
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
  onToggleMove,
  onMove,
  onResize,
}: PlantCardProps) {
  const linkedSonde = plant.sondeId ? sondes.find((s) => s.id === plant.sondeId) : null;
  const summary = linkedSonde?.nodeId ? sensorData.get(linkedSonde.nodeId) : undefined;

  const tempValue = summary?.airTemperature !== undefined ? `${summary.airTemperature.toFixed(1)}°` : "--";
  const humidValue = summary?.airHumidity !== undefined ? `${Math.round(summary.airHumidity)}%` : "--";

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

  function makeCornerGesture(anchorX: "left" | "right", anchorY: "top" | "bottom") {
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
        runOnJS(commitResize)(offsetX.value, offsetY.value, offsetW.value, offsetH.value);
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
    height: Math.max(MIN_CARD_SIZE, plant.height + offsetH.value) + BOTTOM_BAR_HEIGHT,
    borderColor: isMoving
      ? colors.brand.info
      : isSelected
        ? withAlpha(colors.brand.primary, 0.45 + 0.4 * pulse.value)
        : withAlpha(colors.base.white, 0.5),
    borderWidth: isMoving || isSelected ? 3 : 2,
    shadowColor: colors.overlay.shadow,
    shadowOpacity: isSelected ? 1 : 0,
    shadowRadius: isSelected ? 40 + 8 * pulse.value : 0,
    elevation: isSelected ? 6 : 0,
  }));

  const handlePress = useCallback(() => onPress(plant.id), [onPress, plant.id]);
  const handleToggleMove = useCallback(() => onToggleMove(plant.id), [onToggleMove, plant.id]);
  const handleHitSlop = (HANDLE_HIT - HANDLE_SIZE) / 2;

  const cardContent = (
    <>
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>
          {plant.quantity} {plant.plantType.name}
          {plant.quantity > 1 ? "s" : ""}
        </Text>
        {linkedSonde && (
          <View style={styles.badgesRow}>
            <View style={styles.sensorBadge}>
              <Feather name="thermometer" size={9} color={colors.text.onPrimary} />
              <Text style={styles.sensorValue}>{tempValue}</Text>
            </View>
            <View style={[styles.sensorBadge, styles.sensorBadgeHumid]}>
              <Feather name="droplet" size={9} color={colors.text.onPrimary} />
              <Text style={styles.sensorValue}>{humidValue}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.emoji}>{plant.plantType.emoji}</Text>
      </View>

      <View style={styles.bottomBar}>
        {linkedSonde && (
          <View style={styles.sondeName}>
            <Text style={styles.sondeNameText}>{getSondeDisplayName(linkedSonde, sondes)}</Text>
          </View>
        )}
        <Pressable style={[styles.actionBtn, isMoving && styles.actionBtnActive]} onPress={handleToggleMove}>
          <Feather
            name="move"
            size={12}
            color={isMoving ? colors.text.onPrimary : colors.text.secondary}
          />
        </Pressable>
      </View>

      {isMoving && (
        <>
          <GestureDetector gesture={topLeftGesture}>
            <Animated.View hitSlop={handleHitSlop} style={[styles.handle, styles.handleTL]} />
          </GestureDetector>
          <GestureDetector gesture={topRightGesture}>
            <Animated.View hitSlop={handleHitSlop} style={[styles.handle, styles.handleTR]} />
          </GestureDetector>
          <GestureDetector gesture={bottomLeftGesture}>
            <Animated.View hitSlop={handleHitSlop} style={[styles.handle, styles.handleBL]} />
          </GestureDetector>
          <GestureDetector gesture={bottomRightGesture}>
            <Animated.View hitSlop={handleHitSlop} style={[styles.handle, styles.handleBR]} />
          </GestureDetector>
        </>
      )}
    </>
  );

  if (isMoving) {
    return (
      <GestureDetector gesture={dragGesture}>
        <Animated.View style={[styles.card, styles.cardMoving, animatedCardStyle]}>{cardContent}</Animated.View>
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
          height: plant.height + BOTTOM_BAR_HEIGHT,
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
    padding: 6,
  },
  cardMoving: {
    borderColor: colors.brand.info,
    borderWidth: 3,
    backgroundColor: withAlpha(colors.brand.info, 0.14),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.onPrimary,
    textShadowColor: withAlpha(colors.base.black, 0.45),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
    marginRight: 4,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 3,
  },
  sensorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: withAlpha(colors.state.danger, 0.78),
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  sensorBadgeHumid: {
    backgroundColor: withAlpha(colors.brand.secondary, 0.78),
  },
  sensorValue: {
    fontSize: 9,
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
  bottomBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingTop: 4,
    height: BOTTOM_BAR_HEIGHT - 4,
  },
  sondeName: {
    backgroundColor: withAlpha(colors.base.white, 0.85),
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  sondeNameText: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.brand.secondary,
  },
  actionBtn: {
    width: 28,
    height: 28,
    backgroundColor: withAlpha(colors.base.white, 0.9),
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnActive: {
    backgroundColor: colors.brand.info,
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
