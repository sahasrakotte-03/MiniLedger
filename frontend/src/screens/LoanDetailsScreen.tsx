import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Loan } from '../types';
import { api } from '../services/api.client';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { getFullMediaUrl } from '../config/api';

interface LoanDetailsScreenProps {
  loan: Loan;
  onBack: () => void;
  onEdit: (loan: Loan) => void;
  onLoanUpdated: () => void;
}

export const LoanDetailsScreen: React.FC<LoanDetailsScreenProps> = ({
  loan: initialLoan,
  onBack,
  onEdit,
  onLoanUpdated,
}) => {
  const [loan, setLoan] = useState<Loan>(initialLoan);
  const [isRepaying, setIsRepaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const handleMarkAsRepaid = async () => {
    try {
      setIsRepaying(true);
      setErrorMessage(null);
      const res = await api.patch<{ success: boolean; data: Loan }>(
        `/api/loans/${loan.id}/repay`
      );
      setLoan(res.data);
      setShowRepayModal(false);
      onLoanUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark loan as repaid.');
      setShowRepayModal(false);
    } finally {
      setIsRepaying(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await api.delete(`/api/loans/${loan.id}`);
      setShowDeleteModal(false);
      onLoanUpdated();
      onBack();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete loan.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const isRepaid = loan.status === 'REPAID';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={() => onEdit(loan)}
          >
            <Text style={styles.editHeaderText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteHeaderBtn}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.deleteHeaderText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Hero Card with Amount and Status */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <StatusBadge
              status={loan.status}
              isOverdue={loan.isOverdue}
              size="medium"
            />
            {loan.isOverdue && !isRepaid && (
              <View style={styles.overdueAlertBadge}>
                <Text style={styles.overdueAlertText}>⚠️ Payment Overdue</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroAmount}>{loan.amountFormatted}</Text>
          <Text style={styles.heroFriendName}>Lent to {loan.friendName}</Text>
        </View>

        {/* Details Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Borrower</Text>
            <Text style={styles.infoValue}>{loan.friendName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text
              style={[
                styles.infoValue,
                loan.isOverdue && !isRepaid && styles.overdueValue,
              ]}
            >
              {loan.dueDateFormatted}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Loan Status</Text>
            <Text
              style={[
                styles.infoValue,
                isRepaid ? styles.repaidValue : styles.pendingValue,
              ]}
            >
              {isRepaid ? 'Repaid' : loan.isOverdue ? 'Overdue' : 'Pending'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date Lent</Text>
            <Text style={styles.infoValue}>
              {new Date(loan.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>

          {loan.notes && (
            <View style={styles.notesBlock}>
              <Text style={styles.infoLabel}>Notes / Purpose</Text>
              <Text style={styles.notesContent}>{loan.notes}</Text>
            </View>
          )}
        </View>

        {/* Receipt Attachment Section */}
        {loan.receiptUrl ? (
          <View style={styles.receiptCard}>
            <Text style={styles.cardSectionTitle}>Attached Receipt</Text>
            <TouchableOpacity
              onPress={() => setShowReceiptModal(true)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: getFullMediaUrl(loan.receiptUrl)! }}
                style={styles.receiptThumbnail}
                resizeMode="cover"
              />
              <Text style={styles.expandReceiptText}>
                🔍 Tap to view full size
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Primary Action: Mark as Repaid */}
        <View style={styles.actionsSection}>
          {isRepaid ? (
            <View style={styles.repaidBanner}>
              <Text style={styles.repaidBannerIcon}>✓</Text>
              <View>
                <Text style={styles.repaidBannerTitle}>Loan Settled</Text>
                <Text style={styles.repaidBannerSubtitle}>
                  This loan has been fully marked as repaid.
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.repayButton,
                isRepaying && styles.buttonDisabled,
              ]}
              onPress={() => setShowRepayModal(true)}
              disabled={isRepaying}
              activeOpacity={0.8}
            >
              {isRepaying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.repayButtonText}>✓ Mark as Repaid</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Repay Confirmation Modal */}
      <ConfirmModal
        visible={showRepayModal}
        title="Mark as Repaid?"
        message={`Confirm that ${loan.friendName} has repaid the amount of ${loan.amountFormatted}. This will update your total repaid calculation.`}
        confirmText="Confirm Repayment"
        isLoading={isRepaying}
        onConfirm={handleMarkAsRepaid}
        onCancel={() => setShowRepayModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Loan Record?"
        message={`Are you sure you want to delete this loan of ${loan.amountFormatted} to ${loan.friendName}? This action cannot be undone.`}
        confirmText="Delete Loan"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Full-size Receipt Modal */}
      <Modal
        visible={showReceiptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <TouchableOpacity
          style={styles.fullImageOverlay}
          activeOpacity={1}
          onPress={() => setShowReceiptModal(false)}
        >
          <View style={styles.fullImageContainer}>
            <Image
              source={{ uri: getFullMediaUrl(loan.receiptUrl)! }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeFullImageBtn}
              onPress={() => setShowReceiptModal(false)}
            >
              <Text style={styles.closeFullImageText}>✕ Close Preview</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editHeaderBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  deleteHeaderBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
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
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  overdueAlertBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overdueAlertText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroFriendName: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  overdueValue: {
    color: '#DC2626',
  },
  repaidValue: {
    color: '#059669',
  },
  pendingValue: {
    color: '#D97706',
  },
  notesBlock: {
    paddingTop: 14,
  },
  notesContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginTop: 6,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  receiptThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  expandReceiptText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsSection: {
    marginTop: 8,
  },
  repayButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  repayButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  repaidBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  repaidBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
  },
  repaidBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
  },
  repaidBannerSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullImageContainer: {
    width: '100%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  closeFullImageBtn: {
    marginTop: 16,
    backgroundColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closeFullImageText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
