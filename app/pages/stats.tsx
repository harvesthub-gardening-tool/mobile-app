import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DayItem = {
  day: string;
  label: string;
  active?: boolean;
};

const DAYS: DayItem[] = [
  { day: "03", label: "Lundi" },
  { day: "04", label: "Mardi" },
  { day: "05", label: "Mercredi" },
  { day: "06", label: "Jeudi" },
  { day: "07", label: "Vendredi" },
  { day: "01", label: "Samedi" },
  { day: "02", label: "Dimanche" },
];

export default function Stats() {
  return (
    <SafeAreaView style={styles.safe}>
      {}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiques</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {DAYS.map((d) => (
            <View key={d.day} style={styles.dayCard}>
              <Text style={styles.dayNumber}>{d.day}</Text>
              <Text style={styles.dayLabel}>{d.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {}
      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContent}
        >
          {}
          <Text style={styles.sectionTitle}>Répartition de la sonde</Text>
          <View style={styles.chartBox}>
            {}
            <View style={styles.pieWrapper}>
              <View style={styles.pieCircle}>
                <View style={styles.pieSlice} />
              </View>

              {}
              <View style={styles.pieLabels}>
                <Text style={styles.pieLabel}>35{"\n"}9</Text>
                <Text style={styles.pieLabelRight}>10{"\n"}6</Text>
                <Text style={styles.pieLabelBottom}>14{"\n"}3</Text>
              </View>
            </View>
          </View>

          {}
          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
            Comparaison
          </Text>
          <View style={styles.chartBox}>
            {}
            <View style={styles.barChart}>
              {}
              <View style={styles.grid}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={styles.gridLine} />
                ))}
              </View>

              {}
              <View style={styles.barsRow}>
                <View style={styles.group}>
                  <View style={[styles.barDark, { height: 52 }]} />
                  <View style={[styles.barGreen, { height: 110 }]} />
                </View>

                <View style={styles.group}>
                  <View style={[styles.barDark, { height: 36 }]} />
                  <View style={[styles.barGreen, { height: 72 }]} />
                </View>
              </View>

              {}
              <View style={styles.xLabels}>
                <Text style={styles.xLabel}>0</Text>
                <Text style={styles.xLabel}>1</Text>
              </View>

              {}
              <View style={styles.yLabels}>
                <Text style={styles.yLabel}>10</Text>
                <Text style={styles.yLabel}>0</Text>
                <Text style={styles.yLabel}>7</Text>
                <Text style={styles.yLabel}>0</Text>
                <Text style={styles.yLabel}>5</Text>
                <Text style={styles.yLabel}>0</Text>
                <Text style={styles.yLabel}>2</Text>
                <Text style={styles.yLabel}>0</Text>
              </View>
            </View>
          </View>

          {}
          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
            Mes sondes
          </Text>
          <View style={styles.probesRow}>
            <View style={styles.probePill}>
              <Text style={styles.probeText}>Sonde #1 - Jardin</Text>
            </View>
            <View style={styles.probePill}>
              <Text style={styles.probeText}>Sonde #2 - Balcon</Text>
            </View>
          </View>

          <View style={{ height: 18 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F5" },

  header: {
    height: 220,
    backgroundColor: "#63FFA4",
    paddingTop: 14,
    paddingHorizontal: 20,
  },
  headerTitle: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "500",
    color: "#2B2B2B",
  },

  daysRow: {
    paddingTop: 18,
    paddingBottom: 12,
    gap: 14,
  },
  dayCard: {
    width: 78,
    height: 78,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2B2B2B",
  },
  dayLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#2B2B2B",
    opacity: 0.6,
  },

  body: {
    flex: 1,
    marginTop: -30,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  bodyContent: {
    paddingTop: 18,
    paddingBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2B2B2B",
    marginBottom: 12,
  },
  sectionSpacing: {
    marginTop: 18,
  },

  chartBox: {
    backgroundColor: "transparent",
    borderRadius: 16,
    paddingVertical: 6,
    marginBottom: 10,
  },

  pieWrapper: {
    height: 140,
    justifyContent: "center",
    paddingLeft: 8,
  },
  pieCircle: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "#E9E9E9",
    overflow: "hidden",
  },
  pieSlice: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 46,
    height: 92,
    backgroundColor: "#63FFA4",
  },
  pieLabels: {
    position: "absolute",
    left: 0,
    top: 16,
    width: 170,
    height: 120,
  },
  pieLabel: {
    position: "absolute",
    left: -6,
    top: 34,
    fontSize: 10,
    color: "#2B2B2B",
    opacity: 0.55,
    textAlign: "right",
    lineHeight: 12,
  },
  pieLabelRight: {
    position: "absolute",
    left: 104,
    top: 18,
    fontSize: 10,
    color: "#2B2B2B",
    opacity: 0.55,
    lineHeight: 12,
  },
  pieLabelBottom: {
    position: "absolute",
    left: 96,
    top: 88,
    fontSize: 10,
    color: "#2B2B2B",
    opacity: 0.55,
    lineHeight: 12,
  },

  barChart: {
    height: 160,
    paddingLeft: 22,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  grid: {
    position: "absolute",
    left: 22,
    right: 8,
    top: 8,
    bottom: 30,
    justifyContent: "space-between",
  },
  gridLine: {
    height: 1,
    backgroundColor: "#E3E3E3",
  },

  barsRow: {
    flex: 1,
    flexDirection: "row",
    gap: 38,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingBottom: 18,
  },
  group: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  barDark: {
    width: 46,
    borderRadius: 2,
    backgroundColor: "#4A4F55",
  },
  barGreen: {
    width: 46,
    borderRadius: 2,
    backgroundColor: "#63FFA4",
  },
  xLabels: {
    position: "absolute",
    left: 22,
    right: 8,
    bottom: 6,
    flexDirection: "row",
    justifyContent: "center",
    gap: 96,
  },
  xLabel: {
    fontSize: 10,
    color: "#2B2B2B",
    opacity: 0.55,
  },
  yLabels: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 30,
    justifyContent: "space-between",
  },
  yLabel: {
    fontSize: 9,
    color: "#2B2B2B",
    opacity: 0.55,
    lineHeight: 10,
  },

  probesRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  probePill: {
    flex: 1,
    height: 38,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 14,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  probeText: {
    fontSize: 11,
    color: "#2B2B2B",
    opacity: 0.7,
    fontWeight: "500",
  },
});
