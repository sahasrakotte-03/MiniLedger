import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Loan } from '../types';
import { StatusBadge } from './StatusBadge';

interface LoanCardProps {
  loan: Loan;
  onPress: (loan: Loan) => void;
  onRepayPress?: (loan: Loan) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onPress,
  onRepayPress,
}) => {
  // Get friend's initials
  const initials = loan.friendName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(loan)}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.friendName} numberOfLines={1}>
              {loan.friendName}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Due: </Text>
            <Text
              style={[
                styles.dateValue,
                loan.isOverdue && loan.status === 'PENDING' && styles.overdueDate,
              ]}
            >
              {loan.dueDateFormatted}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.amount}>{loan.amountFormatted}</Text>
        <View style={styles.badgeWrapper}>
          <StatusBadge
            status={loan.status}
            isOverdue={loan.isOverdue}
            size="small"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284C7',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  overdueDate: {
    color: '#DC2626',
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  badgeWrapper: {
    marginTop: 2,
  },
});
