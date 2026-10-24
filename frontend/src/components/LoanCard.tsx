import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
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
}) => {
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 380;
  const isMobile = width < 640;

  // Get friend's initials
  const initials = loan.friendName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <TouchableOpacity
      style={[styles.card, isMobile && styles.cardMobile]}
      onPress={() => onPress(loan)}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.avatar, isSmallMobile && styles.avatarSmall]}>
          <Text style={[styles.avatarText, isSmallMobile && styles.avatarTextSmall]}>
            {initials || '?'}
          </Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.friendName, isSmallMobile && styles.friendNameSmall]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
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
              numberOfLines={1}
            >
              {loan.dueDateFormatted}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text
          style={[styles.amount, isSmallMobile && styles.amountSmall]}
          numberOfLines={1}
        >
          {loan.amountFormatted}
        </Text>
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    width: '100%',
    minWidth: 0,
  },
  cardMobile: {
    paddingHorizontal: 9,
    paddingVertical: 7.5,
    marginBottom: 5,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  avatarTextSmall: {
    fontSize: 11,
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
    minWidth: 0,
  },
  friendName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  friendNameSmall: {
    fontSize: 12.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  dateLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  overdueDate: {
    color: '#DC2626',
    fontWeight: '700',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 6,
  },
  amount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.3,
    textAlign: 'right',
  },
  amountSmall: {
    fontSize: 13,
  },
  badgeWrapper: {
    alignItems: 'flex-end',
  },
});
