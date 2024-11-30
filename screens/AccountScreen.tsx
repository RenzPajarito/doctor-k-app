import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { auth } from "../firebase.config";
import { signOut } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface RootStackParamList extends Record<string, undefined | object> {
  Auth: undefined;
  Account: undefined;
  GCashInfo: undefined;
  Security: undefined;
  // ... add other screens as needed
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <Ionicons
        name={icon as any}
        size={24}
        color="#666"
        style={styles.settingsIcon}
      />
      <View style={styles.settingsText}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const navigation = useNavigation<NavigationProp>();
  const userEmail = auth.currentUser?.email;

  const settingsItems = [
    {
      icon: "wallet-outline",
      title: "GCash Information",
      subtitle: "Manage your GCash account",
      navigateTo: "GCashInfo",
    },
    {
      icon: "lock-closed-outline",
      title: "Security",
      subtitle: "Password",
      navigateTo: "Security",
    },
    {
      icon: "qr-code-outline",
      title: "QR Code",
      subtitle: "Generate QR code",
      navigateTo: "QRCode",
    },
  ];

  async function handleLogout() {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
      console.log("Logged out");
    } catch (error) {
      Alert.alert("Logout Error", "Failed to logout. Please try again.", [
        { text: "OK" },
      ]);
      console.error("Error signing out:", error);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userEmail?.[0].toUpperCase() || "?"}
            </Text>
          </View>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          {settingsItems.map(({ icon, title, subtitle, navigateTo }) => (
            <SettingsItem
              key={title}
              icon={icon}
              title={title}
              subtitle={subtitle}
              onPress={() => navigation.navigate(navigateTo)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e1e1e1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#666",
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    marginTop: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 16,
    marginVertical: 8,
    textTransform: "uppercase",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingsIcon: {
    marginRight: 16,
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    color: "#000",
  },
  settingsSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  logoutButton: {
    margin: 20,
    backgroundColor: "#ff4444",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
