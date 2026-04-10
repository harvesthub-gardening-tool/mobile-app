import { memo } from "react";
import { Text, StyleSheet } from "react-native";
import { GRASS_DECORATIONS } from "../../constants/garden";

export const GrassLayer = memo(function GrassLayer() {
  return (
    <>
      {GRASS_DECORATIONS.map((g, i) => (
        <Text
          key={`grass_${i}`}
          style={[styles.grass, { left: g.x, top: g.y, fontSize: g.size }]}
        >
          {g.emoji}
        </Text>
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  grass: {
    position: "absolute",
    opacity: 0.5,
  },
});
