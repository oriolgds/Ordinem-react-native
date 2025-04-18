import React from 'react';
import { View, Modal, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FilterOptions {
  sortBy: 'name' | 'expiry' | 'category';
  categories: string[];
  expiryRange: 'all' | 'week' | 'month' | 'expired';
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  options: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
}

export function FilterModal({ visible, onClose, options, onApplyFilters }: FilterModalProps) {
  const [localOptions, setLocalOptions] = React.useState<FilterOptions>(options);

  const handleSortByChange = (sortBy: FilterOptions['sortBy']) => {
    setLocalOptions(prev => ({ ...prev, sortBy }));
  };

  const handleExpiryRangeChange = (expiryRange: FilterOptions['expiryRange']) => {
    setLocalOptions(prev => ({ ...prev, expiryRange }));
  };

  const handleApply = () => {
    onApplyFilters(localOptions);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1F1F3C" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ordenar por</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    localOptions.sortBy === 'name' && styles.selectedOption
                  ]}
                  onPress={() => handleSortByChange('name')}
                >
                  <Text style={[
                    styles.optionText,
                    localOptions.sortBy === 'name' && styles.selectedOptionText
                  ]}>Nombre</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.option,
                    localOptions.sortBy === 'expiry' && styles.selectedOption
                  ]}
                  onPress={() => handleSortByChange('expiry')}
                >
                  <Text style={[
                    styles.optionText,
                    localOptions.sortBy === 'expiry' && styles.selectedOptionText
                  ]}>Fecha de caducidad</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.option,
                    localOptions.sortBy === 'category' && styles.selectedOption
                  ]}
                  onPress={() => handleSortByChange('category')}
                >
                  <Text style={[
                    styles.optionText,
                    localOptions.sortBy === 'category' && styles.selectedOptionText
                  ]}>Categoría</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Caducidad</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    localOptions.expiryRange === 'all' && styles.selectedOption
                  ]}
                  onPress={() => handleExpiryRangeChange('all')}
                >
                  <Text style={[
                    styles.optionText,
                    localOptions.expiryRange === 'all' && styles.selectedOptionText
                  ]}>Todos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.option,
                    localOptions.expiryRange === 'week' && styles.selectedOption
                  ]}
                  onPress={() => handleExpiryRangeChange('week')}
                >
                  <Text style={[
                    styles.optionText,
                    localOptions.expiryRange === 'week' && styles.selectedOptionText
                  ]}>Esta semana</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.option,
                    localOptions.expiryRange === 'month' && styles.selectedOption
                  ]}
                  onPress={() => handleExpiryRangeChange('month')}
                >
                  <Text style={[
                    styles.optionText,
                    localOptions.expiryRange === 'month' && styles.selectedOptionText
                  ]}>Este mes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.option,
                    localOptions.expiryRange === 'expired' && styles.selectedOption
                  ]}
                  onPress={() => handleExpiryRangeChange('expired')}
                >
                  <Text style={[
                    styles.optionText,
                    localOptions.expiryRange === 'expired' && styles.selectedOptionText
                  ]}>Caducados</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F1F3C',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1F3C',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#6D9EBE',
  },
  optionText: {
    color: '#1F1F3C',
    fontSize: 14,
  },
  selectedOptionText: {
    color: 'white',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  applyButton: {
    backgroundColor: '#6D9EBE',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 