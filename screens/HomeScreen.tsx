import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import MenuScreen from "./MenuScreen";
import AccountScreen from "./AccountScreen";
import { OrdersScreen } from "./OrdersScreen";
import OverviewScreen from "./OverviewScreen";
import OrderPage from "./OrderPage";

const Tab = createBottomTabNavigator();

export function HomeScreen() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Overview") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Orders") {
            iconName = focused ? "receipt" : "receipt-outline";
          } else if (route.name === "Menu") {
            iconName = focused ? "restaurant" : "restaurant-outline";
          } else if (route.name === "Account") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Order Now") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "New Tab") {
            iconName = focused ? "add" : "add-outline";
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#FF8C00",
        tabBarInactiveTintColor: "#808080",
        tabBarStyle: {
          backgroundColor: "white",
        },
      })}
    >
      <Tab.Screen name="Overview" component={OverviewScreen} />
      <Tab.Screen name="Order Now" component={OrderPage} />
      {/* <Tab.Screen name="Order Now" component={OrderingScreen} /> */}
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
