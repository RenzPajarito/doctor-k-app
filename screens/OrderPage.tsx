import { View } from "react-native";
import { WebView } from "react-native-webview";

export default function OrderPage() {
  return (
    <View style={{ flex: 1 }}>
      <WebView 
        source={{ uri: "https://doctor-k.vercel.app?table=0" }}
        style={{ flex: 1 }}
      />
    </View>
  );
}
