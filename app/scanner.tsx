import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type Product = {
  product_name?: string;
  brands?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
};

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

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [grams, setGrams] = useState("100");

  async function fetchProductByBarcode(barcode: string) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      );

      const data = await response.json();

      if (data.status !== 1) {
        setError("Produkt wurde nicht gefunden.");
        return;
      }

      setProduct(data.product);
    } catch {
      setError("Fehler beim Abrufen der Produktdaten.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBarcodeScanned(result: { data: string }) {
    if (scanned) return;

    setScanned(true);
    await fetchProductByBarcode(result.data);
  }

  function getAmount() {
    return Number(grams.replace(",", ".")) || 0;
  }

  function calculateValue(valuePer100g?: number) {
    const amount = getAmount();

    if (!valuePer100g || !amount) {
      return 0;
    }

    return Math.round((valuePer100g * amount) / 100);
  }

  function calculateMacro(valuePer100g?: number) {
    const amount = getAmount();

    if (!valuePer100g || !amount) {
      return 0;
    }

    return Math.round(((valuePer100g * amount) / 100) * 10) / 10;
  }

  async function addToTodayLog() {
    if (!product) return;

    Keyboard.dismiss();

    const amount = getAmount();

    if (amount <= 0) {
      Alert.alert("Fehler", "Bitte gib eine gültige Menge in Gramm ein.");
      return;
    }

    const nutriments = product.nutriments ?? {};

    const newItem: FoodLogItem = {
      id: Date.now().toString(),
      productName: product.product_name || "Unbekanntes Produkt",
      brand: product.brands,
      grams: amount,
      kcal: calculateValue(nutriments["energy-kcal_100g"]),
      protein: calculateMacro(nutriments.proteins_100g),
      carbs: calculateMacro(nutriments.carbohydrates_100g),
      fat: calculateMacro(nutriments.fat_100g),
      createdAt: new Date().toISOString(),
    };

    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    const existingItems: FoodLogItem[] = existingData
      ? JSON.parse(existingData)
      : [];

    const updatedItems = [newItem, ...existingItems];

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));

    Alert.alert("Gespeichert", "Produkt wurde zur Tagesübersicht hinzugefügt.");

    router.back();
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Kamera-Berechtigung wird geprüft...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          Die Kamera wird für den Barcode-Scan benötigt.
        </Text>

        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Kamera erlauben</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  if (product) {
    const nutriments = product.nutriments ?? {};

    const kcal100g = nutriments["energy-kcal_100g"];
    const protein100g = nutriments.proteins_100g;
    const carbs100g = nutriments.carbohydrates_100g;
    const fat100g = nutriments.fat_100g;

    const totalKcal = calculateValue(kcal100g);
    const totalProtein = calculateMacro(protein100g);
    const totalCarbs = calculateMacro(carbs100g);
    const totalFat = calculateMacro(fat100g);

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.resultContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Text style={styles.title}>Produkt erkannt</Text>

          <Text style={styles.productName}>
            {product.product_name || "Unbekanntes Produkt"}
          </Text>

          {product.brands ? (
            <Text style={styles.brand}>{product.brands}</Text>
          ) : null}

          <View style={styles.inputCard}>
            <Text style={styles.label}>Menge in Gramm</Text>

            <TextInput
              style={styles.input}
              value={grams}
              onChangeText={setGrams}
              keyboardType="decimal-pad"
              placeholder="z. B. 250"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={Keyboard.dismiss}
            />

            <View style={styles.amountGrid}>
              {["50", "100", "150", "200", "250", "500"].map((amount) => (
                <Pressable
                  key={amount}
                  style={[
                    styles.amountButton,
                    grams === amount && styles.amountButtonActive,
                  ]}
                  onPress={() => {
                    setGrams(amount);
                    Keyboard.dismiss();
                  }}
                >
                  <Text
                    style={[
                      styles.amountButtonText,
                      grams === amount && styles.amountButtonTextActive,
                    ]}
                  >
                    {amount}g
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Deine Portion</Text>

            <Text style={styles.bigResult}>{totalKcal} kcal</Text>

            <Text style={styles.row}>Eiweiß: {totalProtein} g</Text>
            <Text style={styles.row}>Kohlenhydrate: {totalCarbs} g</Text>
            <Text style={styles.row}>Fett: {totalFat} g</Text>
          </View>

          <Pressable style={styles.button} onPress={addToTodayLog}>
            <Text style={styles.buttonText}>Zur Tagesübersicht hinzufügen</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              Keyboard.dismiss();
              setProduct(null);
              setScanned(false);
              setError("");
              setGrams("100");
            }}
          >
            <Text>Neues Produkt scannen</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              Keyboard.dismiss();
              router.back();
            }}
          >
            <Text>Zurück</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.scanText}>Barcode scannen</Text>

        {loading ? <ActivityIndicator /> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {scanned && !loading && !product ? (
          <Pressable
            style={styles.button}
            onPress={() => {
              setScanned(false);
              setError("");
            }}
          >
            <Text style={styles.buttonText}>Erneut scannen</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text>Zurück</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  camera: {
    flex: 1,
  },

  overlay: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 40,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },

  scanText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

  center: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f7f7",
  },

  text: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },

  resultContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f7f7f7",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },

  productName: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },

  brand: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 18,
  },

  inputCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    backgroundColor: "#fff",
  },

  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  amountButton: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  amountButtonActive: {
    backgroundColor: "#111",
  },

  amountButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  amountButtonTextActive: {
    color: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  bigResult: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
  },

  row: {
    fontSize: 16,
    marginBottom: 8,
  },

  button: {
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 6,
  },

  error: {
    color: "red",
    marginVertical: 8,
    textAlign: "center",
  },
});
