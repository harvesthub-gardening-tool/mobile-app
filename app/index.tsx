import { useEffect } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const CORNER_WIDTH = width * 0.6;
const CORNER_HEIGHT = height * 0.25;

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/lefttop.png")}
        style={[styles.corner, styles.topLeft]}
        resizeMode="contain"
      />
      <Image
        source={require("../assets/images/righttop.png")}
        style={[styles.corner, styles.topRight]}
        resizeMode="contain"
      />
      <Image
        source={require("../assets/images/leftbas.png")}
        style={[styles.corner, styles.bottomLeft]}
        resizeMode="contain"
      />
      <Image
        source={require("../assets/images/rightbas.png")}
        style={[styles.corner, styles.bottomRight]}
        resizeMode="contain"
      />

      <Image
        source={require("../assets/images/Harvesthub-app.webp")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Harvest Hub</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  corner: {
    position: "absolute",
    width: CORNER_WIDTH,
    height: CORNER_HEIGHT,
  },
  topLeft: {
    top: -CORNER_HEIGHT * 0.25,
    left: -CORNER_WIDTH * 0.25,
  },
  topRight: {
    top: -CORNER_HEIGHT * 0.25,
    right: -CORNER_WIDTH * 0.25,
  },
  bottomLeft: {
    bottom: -CORNER_HEIGHT * 0.25,
    left: -CORNER_WIDTH * 0.25,
  },
  bottomRight: {
    bottom: -CORNER_HEIGHT * 0.25,
    right: -CORNER_WIDTH * 0.25,
  },

  logo: {
    width: 200,
    height: 200,
    marginBottom: 18,
  },
  title: {
    fontSize: 16,
    color: "#444",
  },
});
