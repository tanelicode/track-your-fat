import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
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

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

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

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.title}>Produkt erkannt</Text>

        <Text style={styles.productName}>
          {product.product_name || "Unbekanntes Produkt"}
        </Text>

        {product.brands ? (
          <Text style={styles.brand}>{product.brands}</Text>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.row}>
            Kalorien: {nutriments["energy-kcal_100g"] ?? "?"} kcal / 100g
          </Text>

          <Text style={styles.row}>
            Eiweiß: {nutriments.proteins_100g ?? "?"} g / 100g
          </Text>

          <Text style={styles.row}>
            Kohlenhydrate: {nutriments.carbohydrates_100g ?? "?"} g / 100g
          </Text>

          <Text style={styles.row}>
            Fett: {nutriments.fat_100g ?? "?"} g / 100g
          </Text>
        </View>

        <Pressable
          style={styles.button}
          onPress={() => {
            setProduct(null);
            setScanned(false);
            setError("");
          }}
        >
          <Text style={styles.buttonText}>Neues Produkt scannen</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text>Zurück</Text>
        </Pressable>
      </View>
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
    marginBottom: 24,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginVertical: 24,
  },

  row: {
    fontSize: 16,
    marginBottom: 10,
  },

  button: {
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },

  error: {
    color: "red",
    marginVertical: 8,
    textAlign: "center",
  },
});
