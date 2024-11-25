import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebase.config';
import { collection, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { MenuItemDetailsModal } from '../components/MenuItemDetailsModal';

interface Category {
  id: string;
  name: string;
}

interface MenuItemOption {
  id: string;
  name: string;
  isRequired?: boolean;
  maxSelections?: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  options?: MenuItemOption[];
  selectedOptions?: MenuItemOption[];
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function OrderingScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchData = async () => {
      try {
        const [categoriesSnapshot, menuItemsSnapshot] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'menuItems')),
        ]);

        if (!isMounted) return;

        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];

        const menuItemsData = menuItemsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MenuItem[];

        setCategories(categoriesData);
        setMenuItems(menuItemsData);
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to fetch menu data');
        console.error(err);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        // Increment quantity if item already exists
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Add new item to the cart with selected options
        return [...prevCart, { ...item, quantity: 1, selectedOptions: selectedItem?.options }];
      }
    });
  };

  const updateCartItemQuantity = (itemId: string, change: number) => {
    setCart((prevCart) => {
      return prevCart.map((cartItem) => {
        if (cartItem.id === itemId) {
          const newQuantity = cartItem.quantity + change;
          // Remove item if quantity becomes 0
          return newQuantity === 0 ? null : { ...cartItem, quantity: newQuantity };
        }
        return cartItem;
      }).filter((item): item is CartItem => item !== null); // Remove null items
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [categoriesSnapshot, menuItemsSnapshot] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'menuItems')),
      ]);

      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      const menuItemsData = menuItemsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];

      setCategories(categoriesData);
      setMenuItems(menuItemsData);
    } catch (err) {
      setError('Failed to refresh menu data');
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.selectedCategory,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedCategoryText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.menuItemsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#FF8C00']} // Android
            tintColor="#FF8C00" // iOS
          />
        }
      >
        <View style={styles.menuItemsGrid}>
          {menuItems
            .filter((item) => item.category === selectedCategory)
            .map((item) => (
              <View key={item.id} style={styles.menuItem}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedItem(item);
                    setIsModalVisible(true);
                  }}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.menuItemImage}
                    />
                  ) : (
                    <View style={styles.menuItemImagePlaceholder}>
                      <Ionicons name="image-outline" size={24} color="#ccc" />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemPrice}>₱{item.price.toFixed(2)}</Text>
                  {item.options && item.options.length > 0 && (
                    <Text style={styles.customizableText}>with options</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addToCart(item)}
                >
                  <Ionicons name="cart-outline" size={16} color="#fff" />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => setIsCartVisible(true)}
      >
        <Ionicons name="cart" size={24} color="#fff" />
        <Text style={styles.cartButtonText}>Cart ({cart.length})</Text>
      </TouchableOpacity>

      <Modal visible={isCartVisible} animationType="slide">
        <SafeAreaView style={styles.cartContainer}>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemText}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateCartItemQuantity(item.id, -1)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateCartItemQuantity(item.id, 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <TouchableOpacity
            style={styles.closeCartButton}
            onPress={() => setIsCartVisible(false)}
          >
            <Text style={styles.closeCartButtonText}>Close Cart</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      <MenuItemDetailsModal
        item={selectedItem}
        isVisible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedItem(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    padding: 16,
    textAlign: 'center',
  },
  categoriesContainer: {
    maxHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategory: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  menuItemsContainer: {
    flex: 1,
    padding: 8,
  },
  menuItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemInfo: {
    marginBottom: 8,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C00',
    marginBottom: 4,
  },
  customizableText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addIcon: {
    marginRight: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF8C00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  cartContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C00',
  },
  closeCartButton: {
    marginTop: 16,
    backgroundColor: '#FF8C00',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeCartButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 4,
  },
  quantityButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 4,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '500',
  },
}); 