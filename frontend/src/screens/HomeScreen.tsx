import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api.client';
import { Loan, LoanSummary, LoanFilter, LoanSortField, LoanSortOrder } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { LoanCard } from '../components/LoanCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { ServerConfigModal } from '../components/ServerConfigModal';

interface HomeScreenProps {
  onAddLoan: () => void;
  onSelectLoan: (loan: Loan) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onAddLoan,
  onSelectLoan,
}) => {
  const { user, logout } = useAuth();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<LoanFilter>('ALL');
  const [sortField, setSortField] = useState<LoanSortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<LoanSortOrder>('asc');

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showSortModal, setShowSortModal] = useState<boolean>(false);
  const [showServerModal, setShowServerModal] = useState<boolean>(false);

  // Fetch Summary and Loans concurrently from PostgreSQL
  const fetchData = useCallback(async () => {
    try {
      setErrorMessage(null);

      // Build query string
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (activeFilter !== 'ALL') {
        params.append('status', activeFilter);
      }
      params.append('sortBy', sortField);
      params.append('order', sortOrder);

      const [summaryRes, loansRes] = await Promise.all([
        api.get<{ success: boolean; data: LoanSummary }>('/api/loans/summary'),
        api.get<{ success: boolean; data: Loan[] }>(`/api/loans?${params.toString()}`),
      ]);

      setSummary(summaryRes.data);
      setLoans(loansRes.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, activeFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.userGreetingSection}>
          <TouchableOpacity
            style={styles.logoBadgeSmall}
            onPress={() => setShowServerModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.logoIconSmall}>₹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingTitle}>MiniLedger</Text>
            <Text style={styles.greetingPhone}>
              {user?.phoneNumber || 'Welcome back'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.addButtonHeader}
            onPress={onAddLoan}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonHeaderText}>+ New Loan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#059669']}
            tintColor="#059669"
          />
        }
      >
        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
            <TouchableOpacity onPress={fetchData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 1. Dynamic Financial Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.liveBadgeText}>• Real-time Postgres</Text>
          </View>

          {summary ? (
            <View style={styles.summaryGrid}>
              <SummaryCard
                title="Total Lent"
                amount={summary.totalLentFormatted}
                count={summary.totalLoansCount}
                variant="lent"
              />
              <SummaryCard
                title="Total Repaid"
                amount={summary.totalRepaidFormatted}
                count={summary.repaidCount}
                variant="repaid"
              />
              <SummaryCard
                title="Overdue"
                amount={summary.overdueAmountFormatted}
                count={summary.overdueCount}
                variant="overdue"
              />
            </View>
          ) : (
            <View style={styles.summaryLoadingBox}>
              <ActivityIndicator color="#059669" />
            </View>
          )}
        </View>

        {/* 2. Search & Controls */}
        <View style={styles.controlsSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search friend's name..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.sortButtonText}>Sort ▾</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            {(['ALL', 'PENDING', 'OVERDUE', 'REPAID'] as LoanFilter[]).map((filter) => {
              const isActive = activeFilter === filter;
              let count = summary?.totalLoansCount ?? 0;
              if (filter === 'PENDING') count = summary?.pendingCount ?? 0;
              if (filter === 'OVERDUE') count = summary?.overdueCount ?? 0;
              if (filter === 'REPAID') count = summary?.repaidCount ?? 0;

              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive && styles.filterPillTextActive,
                    ]}
                  >
                    {filter === 'ALL'
                      ? 'All'
                      : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </Text>
                  <View
                    style={[
                      styles.filterBadge,
                      isActive && styles.filterBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        isActive && styles.filterBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Loan Records List */}
        <View style={styles.listSection}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listSectionTitle}>
              Loans ({loans.length})
            </Text>
            <Text style={styles.listSubText}>
              Sorted by {sortField === 'dueDate' ? 'Due Date' : 'Amount'} (
              {sortOrder === 'asc' ? 'Asc' : 'Desc'})
            </Text>
          </View>

          {isLoading && !isRefreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Fetching loans from database...</Text>
            </View>
          ) : loans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>📝</Text>
              </View>
              <Text style={styles.emptyTitle}>No loans found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || activeFilter !== 'ALL'
                  ? 'Try adjusting your search query or filter settings.'
                  : 'You have not added any loans yet. Tap "+ New Loan" to track money lent to a friend.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={onAddLoan}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionText}>+ Add First Loan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            loans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onPress={onSelectLoan}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Sort Options Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortModalCard}>
            <Text style={styles.sortModalTitle}>Sort Loans By</Text>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === 'dueDate' && sortOrder === 'asc' && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortField('dueDate');
                setSortOrder('asc');
                setShowSortModal(false);
              }}
            >
              <Text style={styles.sortOptionText}>Due Date: Soonest First</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === 'dueDate' && sortOrder === 'desc' && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortField('dueDate');
                setSortOrder('desc');
                setShowSortModal(false);
              }}
            >
              <Text style={styles.sortOptionText}>Due Date: Furthest First</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === 'amount' && sortOrder === 'desc' && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortField('amount');
                setSortOrder('desc');
                setShowSortModal(false);
              }}
            >
              <Text style={styles.sortOptionText}>Amount: Highest to Lowest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === 'amount' && sortOrder === 'asc' && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortField('amount');
                setSortOrder('asc');
                setShowSortModal(false);
              }}
            >
              <Text style={styles.sortOptionText}>Amount: Lowest to Highest</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of MiniLedger?"
        confirmText="Sign Out"
        isDestructive
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Server Config Modal */}
      <ServerConfigModal
        visible={showServerModal}
        onClose={() => {
          setShowServerModal(false);
          fetchData();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  userGreetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadgeSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIconSmall: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  greetingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  greetingPhone: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonHeader: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addButtonHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  logoutText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  retryText: {
    color: '#059669',
    fontWeight: '700',
    marginLeft: 8,
  },
  summarySection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  liveBadgeText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryLoadingBox: {
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  controlsSection: {
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  sortButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  listSection: {
    marginTop: 4,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  listSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  emptyActionButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sortModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    gap: 8,
  },
  sortModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  sortOptionActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
});
