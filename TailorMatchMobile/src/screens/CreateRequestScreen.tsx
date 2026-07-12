import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface Measurement {
  name: string;
  value: string;
  unit: 'cm' | 'inches';
  body_part: string;
}

const CreateRequestScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_type: '',
    description: '',
    tailor_id: '',
  });
  const [measurements, setMeasurements] = useState<Measurement[]>([
    { name: 'Chest', value: '', unit: 'cm', body_part: 'chest' },
    { name: 'Waist', value: '', unit: 'cm', body_part: 'waist' },
    { name: 'Hip', value: '', unit: 'cm', body_part: 'hip' },
    { name: 'Shoulder', value: '', unit: 'cm', body_part: 'shoulder' },
    { name: 'Sleeve Length', value: '', unit: 'cm', body_part: 'arm' },
  ]);
  const [serviceTypes] = useState([
    'Suit',
    'Dress',
    'Shirt',
    'Pants',
    'Blouse',
    'Jacket',
    'Skirt',
    'Coat',
    'Other'
  ]);
  const [photos, setPhotos] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMeasurementChange = (index: number, field: keyof Measurement, value: string) => {
    setMeasurements(prev => 
      prev.map((measurement, i) => 
        i === index ? { ...measurement, [field]: value } : measurement
      )
    );
  };

  const addMeasurement = () => {
    setMeasurements(prev => [
      ...prev,
      { name: '', value: '', unit: 'cm', body_part: '' }
    ]);
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.service_type.trim()) {
      Alert.alert('Error', 'Please select a service type');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return false;
    }
    if (measurements.every(m => !m.value.trim())) {
      Alert.alert('Error', 'Please provide at least one measurement');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const requestData = {
        service_type: formData.service_type,
        description: formData.description,
        measurements: measurements
          .filter(m => m.value.trim())
          .map(m => ({
            name: m.name,
            value: parseFloat(m.value),
            unit: m.unit,
            body_part: m.body_part,
          })),
        photos: photos,
        tailor_id: formData.tailor_id || undefined,
      };

      const response = await apiService.createRequest(requestData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Your tailoring request has been created successfully!',
          [{ text: 'OK', onPress: () => {
            // Reset form
            setFormData({ service_type: '', description: '', tailor_id: '' });
            setMeasurements([
              { name: 'Chest', value: '', unit: 'cm', body_part: 'chest' },
              { name: 'Waist', value: '', unit: 'cm', body_part: 'waist' },
              { name: 'Hip', value: '', unit: 'cm', body_part: 'hip' },
              { name: 'Shoulder', value: '', unit: 'cm', body_part: 'shoulder' },
              { name: 'Sleeve Length', value: '', unit: 'cm', body_part: 'arm' },
            ]);
            setPhotos([]);
          }}]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create request');
      }
    } catch (error) {
      console.error('Create request error:', error);
      Alert.alert('Error', 'Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Tailoring Request</Text>
          <Text style={styles.subtitle}>
            Provide details about your tailoring needs
          </Text>
        </View>

        <View style={styles.form}>
          {/* Service Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceTypeContainer}>
              {serviceTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.serviceTypeButton,
                    formData.service_type === type && styles.serviceTypeButtonSelected
                  ]}
                  onPress={() => handleInputChange('service_type', type)}
                >
                  <Text style={[
                    styles.serviceTypeButtonText,
                    formData.service_type === type && styles.serviceTypeButtonTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Or enter custom service type"
              value={formData.service_type}
              onChangeText={(value) => handleInputChange('service_type', value)}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what you need tailored..."
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Tailor ID (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Tailor ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter tailor ID if you have a preference"
              value={formData.tailor_id}
              onChangeText={(value) => handleInputChange('tailor_id', value)}
            />
          </View>

          {/* Measurements */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Measurements *</Text>
            {measurements.map((measurement, index) => (
              <View key={index} style={styles.measurementRow}>
                <TextInput
                  style={[styles.input, styles.measurementInput]}
                  placeholder="Measurement name"
                  value={measurement.name}
                  onChangeText={(value) => handleMeasurementChange(index, 'name', value)}
                />
                <TextInput
                  style={[styles.input, styles.measurementInput]}
                  placeholder="Value"
                  value={measurement.value}
                  onChangeText={(value) => handleMeasurementChange(index, 'value', value)}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMeasurement(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addMeasurement}>
              <Text style={styles.addButtonText}>+ Add Measurement</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Create Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  measurementInput: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  serviceTypeContainer: {
    marginBottom: 10,
  },
  serviceTypeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  serviceTypeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  serviceTypeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  serviceTypeButtonTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
});

export default CreateRequestScreen;
