import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api.client';
import { Loan } from '../types';
import { getFullMediaUrl } from '../config/api';

interface AddEditLoanScreenProps {
  loanToEdit?: Loan | null;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export const AddEditLoanScreen: React.FC<AddEditLoanScreenProps> = ({
  loanToEdit,
  onSaveSuccess,
  onCancel,
}) => {
  const isEditing = !!loanToEdit;

  // Form states
  const [friendName, setFriendName] = useState(loanToEdit?.friendName || '');
  const [amount, setAmount] = useState(
    loanToEdit ? loanToEdit.amount.toString() : ''
  );

  // Due Date (Format: YYYY-MM-DD)
  const defaultDueDate = () => {
    if (loanToEdit?.dueDate) {
      return loanToEdit.dueDate.split('T')[0];
    }
    const future = new Date(Date.now() + 7 * 86400000); // 7 days ahead
    return future.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState<string>(defaultDueDate());
  const [notes, setNotes] = useState<string>(loanToEdit?.notes || '');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(
    loanToEdit?.receiptUrl || null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick helper dates
  const setQuickDate = (daysFromNow: number) => {
    const d = new Date(Date.now() + daysFromNow * 86400000);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handlePickReceipt = async () => {
    setErrorMessage(null);
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Camera roll permissions are required to select a receipt image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setIsUploadingImage(true);
        const uploaded = await api.uploadReceipt(
          result.assets[0].uri,
          result.assets[0].fileName || 'receipt.jpg'
        );
        setReceiptUrl(uploaded.url);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload receipt image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);

    // Validations
    if (!friendName.trim()) {
      setErrorMessage('Please enter the friend’s name.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid loan amount greater than ₹0.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dueDate) || isNaN(new Date(dueDate).getTime())) {
      setErrorMessage('Please provide a valid due date in YYYY-MM-DD format.');
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        friendName: friendName.trim(),
        amount: numAmount,
        dueDate,
        notes: notes.trim() || null,
        receiptUrl: receiptUrl || null,
      };

      if (isEditing && loanToEdit) {
        await api.patch(`/api/loans/${loanToEdit.id}`, payload);
      } else {
        await api.post('/api/loans', payload);
      }

      onSaveSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save loan. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel}>
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Loan' : 'Add New Loan'}
        </Text>
        <TouchableOpacity
          style={[styles.saveHeaderButton, isLoading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* 1. Friend Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Friend's Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahul Sharma"
            placeholderTextColor="#94A3B8"
            value={friendName}
            onChangeText={(val) => {
              setFriendName(val);
              if (errorMessage) setErrorMessage(null);
            }}
            autoFocus={!isEditing}
          />
        </View>

        {/* 2. Loan Amount */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Loan Amount (INR) *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(val) => {
                setAmount(val);
                if (errorMessage) setErrorMessage(null);
              }}
            />
          </View>
        </View>

        {/* 3. Due Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Due Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            value={dueDate}
            onChangeText={setDueDate}
          />

          {/* Quick presets */}
          <View style={styles.quickDateRow}>
            <TouchableOpacity
              style={styles.quickDateBtn}
              onPress={() => setQuickDate(7)}
            >
              <Text style={styles.quickDateBtnText}>In 7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickDateBtn}
              onPress={() => setQuickDate(14)}
            >
              <Text style={styles.quickDateBtnText}>In 14 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickDateBtn}
              onPress={() => setQuickDate(30)}
            >
              <Text style={styles.quickDateBtnText}>In 1 Month</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Notes / Reason */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notes or Purpose (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Dinner bill split, concert tickets, rent advance"
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 5. Receipt Attachment */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Receipt or Screenshot (Optional)</Text>

          {receiptUrl ? (
            <View style={styles.receiptPreviewContainer}>
              <Image
                source={{ uri: getFullMediaUrl(receiptUrl)! }}
                style={styles.receiptImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeReceiptBtn}
                onPress={() => setReceiptUrl(null)}
              >
                <Text style={styles.removeReceiptText}>✕ Remove Attachment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={handlePickReceipt}
              disabled={isUploadingImage}
              activeOpacity={0.7}
            >
              {isUploadingImage ? (
                <ActivityIndicator color="#059669" />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadTitle}>Attach Receipt Photo</Text>
                  <Text style={styles.uploadSubtitle}>
                    Upload payment screenshot or bill (JPG, PNG, max 5MB)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Save Changes' : 'Confirm & Add Loan'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  saveHeaderButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickDateBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  quickDateBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  uploadBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  receiptPreviewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  removeReceiptBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeReceiptText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
