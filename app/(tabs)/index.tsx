import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TrackYourFett</Text>

      <Text style={styles.subtitle}>
        Checke deine Ernährung per Kamera statt Kalorien manuell zu zählen.
      </Text>

      <Pressable style={styles.button} onPress={() => router.push("/scanner")}>
        <Text style={styles.buttonText}>Ernährung checken</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
