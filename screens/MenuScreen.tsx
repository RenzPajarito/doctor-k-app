import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
} from "react-native";
import { db, auth } from "../firebase.config"; // Ensure you've exported Firestore and Auth
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons"; // Add this import
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.config";

// Add interfaces for better type safety
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
  category: string; // matches the categoryId
  createdBy: string;
  imageUrl?: string; // Changed from imageUri to imageUrl for Firebase Storage URLs
  options?: MenuItemOption[]; // Add options array
}

// MenuScreen component
export default function MenuScreen() {
  // Update state types and names for clarity
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
  });
  const [menuItemForm, setMenuItemForm] = useState({
    name: "",
    price: "",
    categoryId: "",
    imageUri: "", // Add image URI
    options: [] as MenuItemOption[], // Add options array to form
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Improved error handling and loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add new state for delete modal
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  // Add new state for editing
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [editItemForm, setEditItemForm] = useState({
    name: "",
    price: "",
    imageUri: "",
    options: [] as MenuItemOption[],
  });

  // Add new state for option input
  const [optionInput, setOptionInput] = useState({
    name: "",
    isRequired: false,
    maxSelections: 1,
  });

  // Fetch categories from Firestore when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [categoriesSnapshot, menuItemsSnapshot] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "menuItems")),
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
        setError("Failed to fetch data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Updated handlers with form state
  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, "categories"), categoryForm);
      // Add the new category to local state
      const newCategory: Category = {
        id: docRef.id,
        name: categoryForm.name,
      };
      setCategories((prev) => [...prev, newCategory]);
      setCategoryForm({ name: "" });
    } catch (err) {
      setError("Failed to create category");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the pickImage function to handle both create and edit forms
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      setError("Permission to access media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      // If we're editing, update editItemForm, otherwise update menuItemForm
      if (editingMenuItem) {
        setEditItemForm((prev) => ({
          ...prev,
          imageUri: result.assets[0].uri,
        }));
      } else {
        setMenuItemForm((prev) => ({
          ...prev,
          imageUri: result.assets[0].uri,
        }));
      }
    }
  };

  // Create a new menu item
  const handleCreateMenuItem = async () => {
    if (
      menuItemForm.name.trim() &&
      menuItemForm.price.trim() &&
      menuItemForm.categoryId
    ) {
      setIsLoading(true);
      try {
        let imageUrl = "";

        // Upload image to Firebase Storage if exists
        if (menuItemForm.imageUri) {
          const response = await fetch(menuItemForm.imageUri);
          const blob = await response.blob();

          // Create unique filename using timestamp and random string
          const filename = `menu-items/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;
          const storageRef = ref(storage, filename);

          // Upload image
          await uploadBytes(storageRef, blob);
          imageUrl = await getDownloadURL(storageRef);
        }

        const newItem = {
          name: menuItemForm.name,
          price: parseFloat(menuItemForm.price),
          category: menuItemForm.categoryId,
          createdBy: auth.currentUser?.uid,
          imageUrl, // Store the Firebase Storage URL
          options: menuItemForm.options, // Include options in the new item
        };

        const docRef = await addDoc(collection(db, "menuItems"), newItem);
        const newMenuItem: MenuItem = {
          id: docRef.id,
          ...newItem,
          createdBy: newItem.createdBy ?? "",
        };

        setMenuItems((prev) => [...prev, newMenuItem]);
        setMenuItemForm({
          name: "",
          price: "",
          categoryId: menuItemForm.categoryId, // Preserve the category selection
          imageUri: "", // Clear the image
          options: [], // Clear options
        });
        setShowCreateForm(false); // Close the modal
      } catch (error) {
        setError("Failed to create menu item");
        console.error("Error creating menu item:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const [showCreateForm, setShowCreateForm] = useState(false);

  // Add these new handlers
  const handleDeleteCategory = async (categoryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Delete the category document
      await deleteDoc(doc(db, "categories", categoryId));

      // Delete all menu items in this category
      const itemsToDelete = menuItems.filter(
        (item) => item.category === categoryId
      );
      await Promise.all(
        itemsToDelete.map((item) => deleteDoc(doc(db, "menuItems", item.id)))
      );

      // Update local state
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      setMenuItems((prev) =>
        prev.filter((item) => item.category !== categoryId)
      );

      // Reset category selection if the deleted category was selected
      if (menuItemForm.categoryId === categoryId) {
        setMenuItemForm((prev) => ({ ...prev, categoryId: "" }));
      }
    } catch (err) {
      setError("Failed to delete category");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "menuItems", itemId));
      setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError("Failed to delete menu item");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add confirmation modal component
  const DeleteCategoryModal = () => (
    <Modal
      visible={!!categoryToDelete}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setCategoryToDelete(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Delete Category</Text>
          <Text style={styles.modalText}>
            Are you sure you want to delete "{categoryToDelete?.name}"? This
            will also delete all menu items in this category.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setCategoryToDelete(null)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton]}
              onPress={() => {
                if (categoryToDelete) {
                  handleDeleteCategory(categoryToDelete.id);
                  setCategoryToDelete(null);
                }
              }}
            >
              <Text style={[styles.modalButtonText, styles.deleteButtonText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Add handler to open edit modal
  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setEditItemForm({
      name: item.name,
      price: item.price.toString(),
      imageUri: item.imageUrl || "",
      options: item.options || [],
    });
  };

  // Add handler to save edits
  const handleSaveEdit = async () => {
    if (!editingMenuItem) return;

    setIsLoading(true);
    try {
      let imageUrl = editingMenuItem.imageUrl;

      // Upload new image if changed
      if (
        editItemForm.imageUri &&
        editItemForm.imageUri !== editingMenuItem.imageUrl
      ) {
        const response = await fetch(editItemForm.imageUri);
        const blob = await response.blob();
        const filename = `menu-items/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      const updatedItem = {
        name: editItemForm.name,
        price: parseFloat(editItemForm.price),
        imageUrl,
        category: editingMenuItem.category,
        createdBy: editingMenuItem.createdBy,
        options: editItemForm.options,
      };

      await updateDoc(doc(db, "menuItems", editingMenuItem.id), updatedItem);

      // Update local state
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === editingMenuItem.id ? { ...item, ...updatedItem } : item
        )
      );

      // Reset the edit form and close the modal
      setEditItemForm({
        name: "",
        price: "",
        imageUri: "",
        options: [],
      });
      setEditingMenuItem(null);
    } catch (error) {
      setError("Failed to update menu item");
      console.error("Error updating menu item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a cleanup function when closing the create form modal
  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
    setMenuItemForm((prev) => ({
      ...prev,
      name: "",
      price: "",
      imageUri: "",
    }));
  };

  // Add a cleanup function when closing the edit form modal
  const handleCloseEditForm = () => {
    setEditingMenuItem(null);
    setEditItemForm({
      name: "",
      price: "",
      imageUri: "",
      options: [],
    });
  };

  // Add new handler for options
  const handleAddOption = () => {
    if (optionInput.name.trim()) {
      const newOption: MenuItemOption = {
        id: Math.random().toString(36).substr(2, 9),
        name: optionInput.name,
        isRequired: optionInput.isRequired,
        maxSelections: optionInput.maxSelections,
      };

      setMenuItemForm((prev) => ({
        ...prev,
        options: [...(prev.options || []), newOption],
      }));

      // Reset option input
      setOptionInput({
        name: "",
        isRequired: false,
        maxSelections: 1,
      });
    }
  };

  // Add option removal handler
  const handleRemoveOption = (optionId: string) => {
    setMenuItemForm((prev) => ({
      ...prev,
      options: prev.options?.filter((opt) => opt.id !== optionId) || [],
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.title}>Create Category</Text>
          <TextInput
            style={styles.input}
            placeholder="Category Name"
            value={categoryForm.name}
            onChangeText={(name) => setCategoryForm({ name })}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateCategory}
          >
            <Text style={styles.buttonText}>Create Category</Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>Categories:</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  menuItemForm.categoryId === category.id &&
                    styles.selectedCategory,
                ]}
                onPress={() =>
                  setMenuItemForm((prev) => ({
                    ...prev,
                    categoryId: category.id,
                  }))
                }
                onLongPress={() => setCategoryToDelete(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    menuItemForm.categoryId === category.id &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subtitle}>Menu Items:</Text>
          {menuItemForm.categoryId ? (
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>
                  {
                    categories.find((cat) => cat.id === menuItemForm.categoryId)
                      ?.name
                  }
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowCreateForm(!showCreateForm)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={showCreateForm ? "close" : "add-circle"}
                      size={32}
                      color="#FF8C00"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {menuItems
                .filter((item) => item.category === menuItemForm.categoryId)
                .map((item) => (
                  <View key={item.id} style={styles.menuItem}>
                    <View style={styles.menuItemLeft}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.menuItemImage}
                        />
                      ) : (
                        <View style={styles.menuItemImagePlaceholder}>
                          <Ionicons
                            name="image-outline"
                            size={24}
                            color="#ccc"
                          />
                        </View>
                      )}
                      <Text style={styles.menuItemName}>{item.name}</Text>
                    </View>
                    <View style={styles.menuItemRight}>
                      <Text style={styles.menuItemPrice}>
                        ₱{item.price.toFixed(2)}
                      </Text>
                      <TouchableOpacity
                        style={styles.editIconButton}
                        onPress={() => handleEditMenuItem(item)}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteIconButton}
                        onPress={() => handleDeleteMenuItem(item.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#FF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

              {showCreateForm && menuItemForm.categoryId && (
                <Modal
                  visible={showCreateForm}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={handleCloseCreateForm}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.title}>Create Menu Item</Text>
                        <TouchableOpacity
                          onPress={handleCloseCreateForm}
                          style={styles.closeButton}
                        >
                          <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                      </View>

                      <ScrollView showsVerticalScrollIndicator={false}>
                        <TouchableOpacity
                          style={styles.imagePickerButton}
                          onPress={pickImage}
                        >
                          <Text style={styles.buttonText}>
                            {menuItemForm.imageUri
                              ? "Change Image"
                              : "Add Image"}
                          </Text>
                        </TouchableOpacity>

                        {menuItemForm.imageUri && (
                          <Image
                            source={{ uri: menuItemForm.imageUri }}
                            style={styles.imagePreview}
                          />
                        )}

                        <TextInput
                          style={styles.input}
                          placeholder="Menu Item Name"
                          value={menuItemForm.name}
                          onChangeText={(name) =>
                            setMenuItemForm((prev) => ({ ...prev, name }))
                          }
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Menu Item Price"
                          value={menuItemForm.price}
                          onChangeText={(price) =>
                            setMenuItemForm((prev) => ({ ...prev, price }))
                          }
                          keyboardType="numeric"
                        />

                        <Text style={styles.sectionTitle}>Item Options</Text>
                        <View style={styles.optionInputContainer}>
                          <TextInput
                            style={[styles.input, styles.optionInput]}
                            placeholder="Option name (e.g., Rice)"
                            value={optionInput.name}
                            onChangeText={(name) =>
                              setOptionInput((prev) => ({ ...prev, name }))
                            }
                          />
                          <View style={styles.optionControls}>
                            <TouchableOpacity
                              style={[
                                styles.optionToggle,
                                optionInput.isRequired &&
                                  styles.optionToggleActive,
                              ]}
                              onPress={() =>
                                setOptionInput((prev) => ({
                                  ...prev,
                                  isRequired: !prev.isRequired,
                                }))
                              }
                            >
                              <Text style={styles.optionToggleText}>
                                Required
                              </Text>
                            </TouchableOpacity>
                            <TextInput
                              style={[styles.input, styles.maxSelectionsInput]}
                              placeholder="Max"
                              value={optionInput.maxSelections.toString()}
                              onChangeText={(value) =>
                                setOptionInput((prev) => ({
                                  ...prev,
                                  maxSelections: parseInt(value) || 1,
                                }))
                              }
                              keyboardType="numeric"
                            />
                          </View>
                          <TouchableOpacity
                            style={styles.addOptionButton}
                            onPress={handleAddOption}
                          >
                            <Text style={styles.buttonText}>Add Option</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Display added options */}
                        {menuItemForm.options?.map((option) => (
                          <View key={option.id} style={styles.optionItem}>
                            <View style={styles.optionItemInfo}>
                              <Text style={styles.optionItemName}>
                                {option.name}
                              </Text>
                              <Text style={styles.optionItemDetails}>
                                {option.isRequired ? "Required" : "Optional"} •
                                Max: {option.maxSelections}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.removeOptionButton}
                              onPress={() => handleRemoveOption(option.id)}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color="#FF4444"
                              />
                            </TouchableOpacity>
                          </View>
                        ))}

                        <TouchableOpacity
                          style={styles.button}
                          onPress={() => {
                            handleCreateMenuItem();
                            setShowCreateForm(false);
                          }}
                        >
                          <Text style={styles.buttonText}>
                            Create Menu Item
                          </Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              )}
            </View>
          ) : (
            <Text style={styles.helperText}>
              Select a category to view items
            </Text>
          )}
        </View>
      </ScrollView>
      <DeleteCategoryModal />
      {editingMenuItem && (
        <Modal
          visible={!!editingMenuItem}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseEditForm}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.title}>Edit Menu Item</Text>
                <TouchableOpacity
                  onPress={handleCloseEditForm}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImage}
                >
                  <Text style={styles.buttonText}>
                    {editItemForm.imageUri ? "Change Image" : "Add Image"}
                  </Text>
                </TouchableOpacity>

                {editItemForm.imageUri && (
                  <Image
                    source={{ uri: editItemForm.imageUri }}
                    style={styles.imagePreview}
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Menu Item Name"
                  value={editItemForm.name}
                  onChangeText={(name) =>
                    setEditItemForm((prev) => ({ ...prev, name }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Menu Item Price"
                  value={editItemForm.price}
                  onChangeText={(price) =>
                    setEditItemForm((prev) => ({ ...prev, price }))
                  }
                  keyboardType="numeric"
                />

                <Text style={styles.sectionTitle}>Item Options</Text>
                <View style={styles.optionInputContainer}>
                  <TextInput
                    style={[styles.input, styles.optionInput]}
                    placeholder="Option name (e.g., Rice)"
                    value={optionInput.name}
                    onChangeText={(name) =>
                      setOptionInput((prev) => ({ ...prev, name }))
                    }
                  />
                  <View style={styles.optionControls}>
                    <TouchableOpacity
                      style={[
                        styles.optionToggle,
                        optionInput.isRequired && styles.optionToggleActive,
                      ]}
                      onPress={() =>
                        setOptionInput((prev) => ({
                          ...prev,
                          isRequired: !prev.isRequired,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.optionToggleText,
                          optionInput.isRequired &&
                            styles.optionToggleTextActive,
                        ]}
                      >
                        Required
                      </Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.maxSelectionsInput]}
                      placeholder="Max"
                      value={optionInput.maxSelections.toString()}
                      onChangeText={(value) =>
                        setOptionInput((prev) => ({
                          ...prev,
                          maxSelections: parseInt(value) || 1,
                        }))
                      }
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.addOptionButton}
                    onPress={() => {
                      if (optionInput.name.trim()) {
                        const newOption: MenuItemOption = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: optionInput.name,
                          isRequired: optionInput.isRequired,
                          maxSelections: optionInput.maxSelections,
                        };
                        setEditItemForm((prev) => ({
                          ...prev,
                          options: [...(prev.options || []), newOption],
                        }));
                        setOptionInput({
                          name: "",
                          isRequired: false,
                          maxSelections: 1,
                        });
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>Add Option</Text>
                  </TouchableOpacity>
                </View>

                {/* Display existing options */}
                {editItemForm.options?.map((option) => (
                  <View key={option.id} style={styles.optionItem}>
                    <View style={styles.optionItemInfo}>
                      <Text style={styles.optionItemName}>{option.name}</Text>
                      <Text style={styles.optionItemDetails}>
                        {option.isRequired ? "Required" : "Optional"} • Max:{" "}
                        {option.maxSelections}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeOptionButton}
                      onPress={() =>
                        setEditItemForm((prev) => ({
                          ...prev,
                          options:
                            prev.options?.filter(
                              (opt) => opt.id !== option.id
                            ) || [],
                        }))
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#FF4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 8,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#FF8C00",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedCategory: {
    backgroundColor: "#FF8C00",
    borderColor: "#FF8C00",
  },
  categoryText: {
    fontSize: 14,
    color: "#333",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FF8C00",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  menuItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF8C00",
  },
  deleteIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFF1F1",
  },
  helperText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  imagePickerButton: {
    backgroundColor: "#666",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
    resizeMode: "cover",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  createFormContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 500,
    maxHeight: "95%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  categoryWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  deleteButton: {
    backgroundColor: "#FF4444",
  },
  menuItemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  categoryTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    color: "#666",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  deleteButtonText: {
    color: "#FFFFFF",
  },
  editIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
  },
  optionInputContainer: {
    marginBottom: 16,
  },
  optionInput: {
    flex: 1,
    marginBottom: 8,
  },
  optionControls: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  optionToggle: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  optionToggleActive: {
    backgroundColor: "#FF8C00",
  },
  optionToggleText: {
    color: "#666",
  },
  maxSelectionsInput: {
    width: 60,
    textAlign: "center",
    marginBottom: 0,
  },
  addOptionButton: {
    backgroundColor: "#666",
    padding: 8,
    borderRadius: 6,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionItemInfo: {
    flex: 1,
  },
  optionItemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionItemDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  removeOptionButton: {
    padding: 8,
  },
  optionToggleTextActive: {
    color: "#fff",
  },
});
