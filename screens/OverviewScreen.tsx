import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.config";
import { Ionicons } from "@expo/vector-icons";

interface Metrics {
  totalOrders: number;
  totalRevenue: number;
  uniqueUsers: number;
}

export default function OverviewScreen() {
  const { width } = useWindowDimensions();
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrders: 0,
    totalRevenue: 0,
    uniqueUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ordersQuery = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const uniqueDeviceIds = new Set();
        let revenue = 0;

        snapshot.forEach((doc) => {
          const order = doc.data();
          revenue += order.total || 0;
          if (order.deviceId) uniqueDeviceIds.add(order.deviceId);
        });

        setMetrics({
          totalOrders: snapshot.size,
          totalRevenue: revenue,
          uniqueUsers: uniqueDeviceIds.size,
        });
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching metrics:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const MetricCard = ({
    icon,
    title,
    value,
    cardWidth,
  }: {
    icon: string;
    title: string;
    value: string | number;
    cardWidth: number;
  }) => (
    <View style={[styles.card, { width: cardWidth }]}>
      <Ionicons name={icon as any} size={24} color="#FF8C00" />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );

  const getCardWidth = () => {
    if (width >= 768) return (width - 64 - 32) / 3; // Tablet: 3 cards per row
    return (width - 48 - 16) / 2; // Phone: 2 cards per row
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading metrics...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Dashboard Overview</Text>
        <View style={styles.cardsContainer}>
          <MetricCard
            icon="receipt"
            title="Total Orders"
            value={metrics.totalOrders}
            cardWidth={getCardWidth()}
          />
          <MetricCard
            icon="cash"
            title="Revenue"
            value={`₱${metrics.totalRevenue.toFixed(2)}`}
            cardWidth={getCardWidth()}
          />
          <MetricCard
            icon="people"
            title="Unique Users"
            value={metrics.uniqueUsers}
            cardWidth={getCardWidth()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    marginTop: 8,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#FF8C00",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#FFE0CC",
  },
  cardTitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF8C00",
    marginTop: 4,
  },
});
