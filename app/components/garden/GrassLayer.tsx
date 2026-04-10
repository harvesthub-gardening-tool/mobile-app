import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { GRASS_DECORATIONS, MAP_SIZE } from "../../constants/garden";

const BORDER_WIDTH = 40;
const INNER_SIZE = MAP_SIZE - BORDER_WIDTH * 2;

export const GrassLayer = memo(function GrassLayer() {
  return (
    <View
      style={styles.container}
      pointerEvents="none"
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      {GRASS_DECORATIONS.map((g, i) => (
        <Text
          key={`grass_${i}`}
          style={[styles.grass, { left: g.x, top: g.y, fontSize: g.size }]}
        >
          {g.emoji}
        </Text>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: INNER_SIZE,
    height: INNER_SIZE,
    overflow: "hidden",
  },
  grass: {
    position: "absolute",
    opacity: 0.5,
  },
});
