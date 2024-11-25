import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SvgQRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';

export function QRCodeScreen() {
    const navigation = useNavigation();
    const [tableNumber, setTableNumber] = useState<number | string>(1);

    const baseURL = "https://yourappurl.com"; // Replace with your app's base URL

    const qrCodeURL = `${baseURL}?table=${tableNumber}`;

    const handleInputChange = (value: string) => {
      const parsedValue = parseInt(value, 10);
      setTableNumber(value ? parsedValue : '');
    };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Generator</Text>
      </View>

      <View style={styles.qrContainer}>
        <Text style={styles.qrLabel}>Generated QR Code:</Text>
        <SvgQRCode value={qrCodeURL} size={200} />
        <TouchableOpacity onPress={() => Linking.openURL(qrCodeURL)}>
          <Text style={styles.link}>URL: {qrCodeURL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Enter Table Number:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={tableNumber.toString()}
          onChangeText={handleInputChange}
        />
      </View>
      
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FF6B00",
  },
  inputContainer: {
    padding: 20,
    paddingTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  qrContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  link: {
    color: "#FF6B00",
    marginTop: 10,
  },
});