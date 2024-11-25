import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase.config";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface GCashInfo {
  fullName: string;
  phoneNumber: string;
}

export function GCashInfoScreen() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGCashInfo();
  }, []);

  async function loadGCashInfo() {
    if (!auth.currentUser?.uid) return;

    try {
      const docRef = doc(db, "admin", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as { gcashInfo?: GCashInfo };
        if (data.gcashInfo) {
          setFullName(data.gcashInfo.fullName);
          setPhoneNumber(data.gcashInfo.phoneNumber);
        }
      }
    } catch (error) {
      console.error("Error loading GCash info:", error);
      Alert.alert("Error", "Failed to load GCash information");
    }
  }

  async function handleSave() {
    if (!auth.currentUser?.uid) return;

    if (!fullName.trim() || !phoneNumber.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!/^09\d{9}$/.test(phoneNumber)) {
      Alert.alert(
        "Error",
        "Please enter a valid Philippine mobile number (e.g., 09123456789)"
      );
      return;
    }

    setIsLoading(true);

    try {
      const docRef = doc(db, "admin", auth.currentUser.uid);
      await setDoc(
        docRef,
        {
          gcashInfo: {
            fullName,
            phoneNumber,
          },
        },
        { merge: true }
      );

      Alert.alert("Success", "GCash information saved successfully");
    } catch (error) {
      console.error("Error saving GCash info:", error);
      Alert.alert("Error", "Failed to save GCash information");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GCash Information</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>GCash Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter your GCash number"
            keyboardType="phone-pad"
            maxLength={11}
          />
          <Text style={styles.hint}>Format: 09123456789</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
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
  content: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
