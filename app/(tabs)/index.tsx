import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type FoodLogItem = {
  id: string;
  productName: string;
  brand?: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
};

const STORAGE_KEY = "today_food_logs";

export default function HomeScreen() {
  const [items, setItems] = useState<FoodLogItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadTodayItems();
    }, []),
  );

  async function loadTodayItems() {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const loadedItems: FoodLogItem[] = data ? JSON.parse(data) : [];
    setItems(loadedItems);
  }

  async function clearToday() {
    Alert.alert(
      "Tagesübersicht löschen",
      "Möchtest du alle heutigen Einträge löschen?",
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setItems([]);
          },
        },
      ],
    );
  }

  const totalKcal = items.reduce((sum, item) => sum + item.kcal, 0);
  const totalProtein = items.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = items.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = items.reduce((sum, item) => sum + item.fat, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Your Fat</Text>

      <Text style={styles.subtitle}>
        Checke deine Ernährung per Kamera statt Kalorien manuell zu zählen.
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Heute</Text>
        <Text style={styles.kcalText}>{totalKcal} kcal</Text>

        <View style={styles.macroRow}>
          <Text style={styles.macroText}>
            Eiweiß: {Math.round(totalProtein * 10) / 10} g
          </Text>
          <Text style={styles.macroText}>
            KH: {Math.round(totalCarbs * 10) / 10} g
          </Text>
          <Text style={styles.macroText}>
            Fett: {Math.round(totalFat * 10) / 10} g
          </Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={() => router.push("/scanner")}>
        <Text style={styles.buttonText}>Ernährung checken</Text>
      </Pressable>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Heute gegessen</Text>

        {items.length > 0 ? (
          <Pressable onPress={clearToday}>
            <Text style={styles.deleteText}>Löschen</Text>
          </Pressable>
        ) : null}
      </View>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>Noch keine Produkte gespeichert.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.foodCard}>
              <View style={styles.foodTopRow}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.productName}</Text>
                  {item.brand ? (
                    <Text style={styles.brand}>{item.brand}</Text>
                  ) : null}
                  <Text style={styles.grams}>{item.grams} g</Text>
                </View>

                <Text style={styles.foodKcal}>{item.kcal} kcal</Text>
              </View>

              <Text style={styles.foodMacros}>
                Eiweiß {item.protein} g · KH {item.carbs} g · Fett {item.fat} g
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 70,
    backgroundColor: "#f7f7f7",
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#555",
    marginBottom: 24,
  },

  summaryCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    marginBottom: 18,
  },

  summaryLabel: {
    fontSize: 16,
    color: "#555",
    marginBottom: 6,
  },

  kcalText: {
    fontSize: 38,
    fontWeight: "800",
    marginBottom: 10,
  },

  macroRow: {
    gap: 4,
  },

  macroText: {
    fontSize: 15,
    color: "#444",
  },

  button: {
    backgroundColor: "#111",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  deleteText: {
    color: "red",
    fontSize: 14,
    fontWeight: "600",
  },

  emptyText: {
    color: "#666",
    fontSize: 15,
    marginTop: 8,
  },

  list: {
    paddingBottom: 40,
  },

  foodCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  foodTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  foodInfo: {
    flex: 1,
  },

  foodName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },

  brand: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },

  grams: {
    fontSize: 14,
    color: "#444",
  },

  foodKcal: {
    fontSize: 18,
    fontWeight: "800",
  },

  foodMacros: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
  },
});
