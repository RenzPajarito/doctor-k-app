import { View, Text, Modal, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuItem, MenuItemOption } from '../types';



interface MenuItemDetailsModalProps {
  item: MenuItem | null;
  isVisible: boolean;
  onClose: () => void;
}

export function MenuItemDetailsModal({ item, isVisible, onClose }: MenuItemDetailsModalProps) {
  if (!item) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#ccc" />
            </View>
          )}

          <ScrollView style={styles.detailsContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>₱{item.price.toFixed(2)}</Text>

            {item.options && item.options.length > 0 && (
              <View style={styles.optionsContainer}>
                <Text style={styles.optionsTitle}>Options</Text>
                {item.options.map((option: MenuItemOption) => (
                  <View key={option.id} style={styles.optionItem}>
                    <Text style={styles.optionName}>{option.name}</Text>
                    {option.isRequired && (
                      <Text style={styles.requiredBadge}>Required</Text>
                    )}
                    {option.maxSelections && (
                      <Text style={styles.selectionLimit}>
                        Max selections: {option.maxSelections}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  detailsContainer: {
    padding: 16,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 20,
    color: '#FF8C00',
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsContainer: {
    marginTop: 16,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionName: {
    fontSize: 16,
    marginBottom: 4,
  },
  requiredBadge: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  selectionLimit: {
    color: '#666',
    fontSize: 12,
  },
}); 