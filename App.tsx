import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase.config";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "./screens/HomeScreen";
import * as ScreenOrientation from "expo-screen-orientation";
import { GCashInfoScreen } from "./screens/GCashInfoScreen";
import SecurityScreen from "./screens/SecurityScreen";
import { QRCodeScreen } from "./screens/QRCodeScreen";

interface LoginFormData {
  email: string;
  password: string;
}

// Add navigation type definitions
type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  GCashInfo: undefined;
  Security: undefined;
  QRCode: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Rename your current component to LoginScreen
function LoginScreen({ navigation }: any) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add orientation lock effect
  useEffect(() => {
    async function lockOrientation() {
      await ScreenOrientation.unlockAsync(); // Allow both orientations
    }
    lockOrientation();
  }, []);

  async function handleLogin() {
    setIsLoading(true);
    setError(null);
    try {
      const { email, password } = formData;
      await signInWithEmailAndPassword(auth, email, password);

      console.log("Login successful");
      navigation.replace("Home"); // Replace login screen with home screen
    } catch (error: any) {
      setError(
        error.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : "An error occurred during login"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Update styles for portrait mode
  const portraitStyles = !isLandscape
    ? {
        loginContainer: {
          justifyContent: "space-between" as const,
          paddingVertical: 20,
        },
        logoContainer: {
          marginBottom: 30,
        },
        logo: {
          width: Math.min(width * 0.6, 220), // Responsive logo size
          height: Math.min(width * 0.6, 220),
        },
      }
    : {};

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[
            styles.content,
            isLandscape && styles.landscapeContent,
            !isLandscape && styles.portraitContent,
          ]}
        >
          <View
            style={[
              styles.loginContainer,
              isLandscape && styles.landscapeLoginContainer,
              portraitStyles.loginContainer,
            ]}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require("./assets/logo.png")}
                style={[
                  styles.logo,
                  isLandscape && styles.landscapeLogo,
                  portraitStyles.logo,
                ]}
                resizeMode="contain"
              />
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Welcome Back</Text>
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                />

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Text>
                </TouchableOpacity>

                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// New App component with navigation
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Auth"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Auth" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="GCashInfo"
            component={GCashInfoScreen}
            options={{
              title: "GCash Information",
              headerBackTitle: "Back",
            }}
          />
          <Stack.Screen
            name="Security"
            component={SecurityScreen}
            options={{
              title: "Security",
              headerBackTitle: "Back",
            }}
          />
          <Stack.Screen
            name="QRCode"
            component={QRCodeScreen}
            options={{
              title: "QR Code",
              headerBackTitle: "Back",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  landscapeContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  portraitContent: {
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  loginContainer: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
  },
  landscapeLoginContainer: {
    flexDirection: "row",
    maxWidth: 900,
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logo: {
    width: 220,
    height: 220,
  },
  landscapeLogo: {
    width: 300,
    height: 300,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#FF6B00",
  },
  form: {
    gap: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#FFB27F",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    height: 48,
    backgroundColor: "#FF6B00",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#FFB27F",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 10,
  },
});
