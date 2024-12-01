import { View } from "react-native";
import { WebView } from "react-native-webview";
import { useMemo } from "react";

export default function OrderPage() {
  const webViewSource = useMemo(
    () => ({ uri: "https://doctor-k.vercel.app?table=0" }),
    []
  );

  return (
    <View style={styles.container}>
      <WebView source={webViewSource} style={styles.webView} />
    </View>
  );
}

const styles = {
  container: { flex: 1 },
  webView: { flex: 1 },
};
