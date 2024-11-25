import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../firebase.config"; // assuming you have firebase setup
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

// Order interface (adjust as per your data structure)
interface SelectedOption {
  id: string;
  name: string;
  price?: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
  selectedOptions?: SelectedOption[];
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "completed" | "cancelled";
  paymentMethod: "cash" | "gcash";
  paymentProof: string;
  tableNumber: number;
  createdAt: number;
}

// Add these helper functions before the main component
function getStatusColor(status: Order["status"]): string {
  switch (status) {
    case "completed":
      return "#4CAF50"; // green
    case "cancelled":
      return "#FF4444"; // red
    default:
      return "#FF8C00"; // orange for pending
  }
}

function StatusButton({
  status,
  onPress,
  label,
}: {
  status: Order["status"];
  onPress: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.statusButton,
        {
          backgroundColor:
            status === label.toLowerCase() ? "#FFE0CC" : "#FF8C00",
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.statusButtonText,
          { color: status === label.toLowerCase() ? "#FF8C00" : "#fff" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Update useResponsiveLayout to consider orientation
function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  return {
    isTablet: width >= 768,
    isPortrait,
    contentWidth: width >= 1024 ? 800 : width >= 768 ? width * 0.8 : width,
  };
}

// Add OrderDetailsModal component before OrdersScreen
function OrderDetailsModal({
  order,
  isVisible,
  onClose,
}: {
  order: Order | null;
  isVisible: boolean;
  onClose: () => void;
}) {
  const { isTablet, contentWidth } = useResponsiveLayout();

  if (!order) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              width: isTablet ? contentWidth : "100%",
              maxHeight: isTablet ? "95%" : "100%",
              marginHorizontal: isTablet ? 24 : 0,
            },
          ]}
        >
          <Text style={styles.modalHeader}>Order Details</Text>
          <Text style={styles.orderId}>Order ID: {order.id}</Text>
          <Text
            style={[styles.orderInfo, { color: getStatusColor(order.status) }]}
          >
            Status: {order.status}
          </Text>
          <Text style={styles.orderInfo}>
            Payment Method: {order.paymentMethod}
          </Text>
          {order.paymentProof && (
            <Text
              style={[
                styles.orderInfo,
                { backgroundColor: "#FFE0CC", padding: 2, borderRadius: 4 },
              ]}
            >
              Payment Proof: {order.paymentProof}
            </Text>
          )}
          <Text style={styles.orderInfo}>
            Table Number: {order.tableNumber}
          </Text>

          <Text style={styles.itemsHeader}>Items:</Text>
          <FlatList
            data={order.items}
            keyExtractor={(item, index) => `order-item-${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <Text style={styles.itemOptions}>
                      {item.selectedOptions.map((opt) => opt.name).join(", ")}
                    </Text>
                  )}
                  <Text style={styles.itemInfo}>Qty: {item.quantity}</Text>
                  <Text style={styles.itemInfo}>₱{item.price.toFixed(2)}</Text>
                </View>
              </View>
            )}
          />

          <Text style={styles.totalText}>Total: ₱{order.total.toFixed(2)}</Text>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Add this type for filter options
type FilterStatus = "all" | Order["status"];

// Add FilterBar component
function FilterBar({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}) {
  return (
    <View style={styles.filterContainer}>
      {["all", "pending", "completed", "cancelled"].map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            activeFilter === status && styles.filterButtonActive,
          ]}
          onPress={() => onFilterChange(status as FilterStatus)}
        >
          <Text
            style={[
              styles.filterButtonText,
              activeFilter === status && styles.filterButtonTextActive,
            ]}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const { isTablet, isPortrait, contentWidth } = useResponsiveLayout();
  const numColumns = isTablet && !isPortrait ? 2 : 1;

  // Replace fetchOrders function with real-time listener
  useEffect(() => {
    setIsLoading(true);
    const ordersRef = collection(db, "orders");

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        const ordersList: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(ordersList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to orders:", error);
        setError("Failed to load orders.");
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Add this function to handle status updates
  const handleStatusUpdate = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("Failed to update order status.");
    }
  };

  // Add this function to filter orders
  const filteredOrders = orders.filter((order) =>
    activeFilter === "all" ? true : order.status === activeFilter
  );

  // Render Order item
  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderItem}>
      <Text style={styles.orderId}>Order ID: {item.id}</Text>
      <Text style={{ color: getStatusColor(item.status) }}>
        Status: {item.status}
      </Text>
      <Text>Total: ₱{item.total.toFixed(2)}</Text>
      <Text>Date: {new Date(item.createdAt).toLocaleString()}</Text>
      <View style={styles.statusButtons}>
        <StatusButton
          status={item.status}
          onPress={() => handleStatusUpdate(item.id, "completed")}
          label="Complete"
        />
        <StatusButton
          status={item.status}
          onPress={() => handleStatusUpdate(item.id, "cancelled")}
          label="Cancel"
        />
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => {
            setSelectedOrder(item);
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.viewDetailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={[styles.contentContainer, { maxWidth: contentWidth }]}>
        <Text style={styles.header}>Customer Orders</Text>
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <FlatList
          key={`orders-list-${numColumns}`}
          data={filteredOrders}
          keyExtractor={(item, index) => `order-${item.id}-${index}`}
          renderItem={renderOrderItem}
          contentContainerStyle={[
            styles.listContainer,
            isTablet && !isPortrait && { paddingHorizontal: 24 },
          ]}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 && styles.gridContainer}
        />
        <OrderDetailsModal
          order={selectedOrder}
          isVisible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setSelectedOrder(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center", // Center content horizontally
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    alignItems: "stretch",
  },
  header: {
    fontSize: 28, // Increased font size for tablets
    fontWeight: "bold",
    marginVertical: 24,
    paddingHorizontal: 24,
    textAlign: "center",
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    width: "100%",
  },
  gridContainer: {
    justifyContent: "space-between",
    gap: 16,
  },
  orderItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    flex: 1,
    shadowColor: "#FF8C00",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#FFE0CC",
  },
  orderId: {
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "#FF4500",
    fontSize: 16,
  },
  statusButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  statusButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 0,
  },
  statusButtonText: {
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignSelf: "center",
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  orderInfo: {
    fontSize: 16,
    marginBottom: 5,
  },
  itemsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemInfo: {
    fontSize: 14,
    color: "#666",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: "#FF8C00",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: "#FF8C00",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 0,
  },
  viewDetailsButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  itemOptions: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    marginBottom: 4,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#FF8C00",
  },
  filterButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
});
