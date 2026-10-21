import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoanStatus } from '../types';

interface StatusBadgeProps {
  status: LoanStatus;
  isOverdue?: boolean;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isOverdue = false,
  size = 'medium',
}) => {
  let badgeStyle = styles.pendingBadge;
  let textStyle = styles.pendingText;
  let dotStyle = styles.pendingDot;
  let label = 'Pending';

  if (status === 'REPAID') {
    badgeStyle = styles.repaidBadge;
    textStyle = styles.repaidText;
    dotStyle = styles.repaidDot;
    label = 'Repaid';
  } else if (isOverdue) {
    badgeStyle = styles.overdueBadge;
    textStyle = styles.overdueText;
    dotStyle = styles.overdueDot;
    label = 'Overdue';
  }

  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, badgeStyle, isSmall && styles.badgeSmall]}>
      <View style={[styles.dot, dotStyle, isSmall && styles.dotSmall]} />
      <Text style={[styles.text, textStyle, isSmall && styles.textSmall]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotSmall: {
    width: 5,
    height: 5,
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 11,
  },
  // Repaid: Soft emerald green
  repaidBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  repaidText: {
    color: '#059669',
  },
  repaidDot: {
    backgroundColor: '#10B981',
  },
  // Overdue: Soft ruby red
  overdueBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  overdueText: {
    color: '#DC2626',
  },
  overdueDot: {
    backgroundColor: '#EF4444',
  },
  // Pending: Warm amber
  pendingBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  pendingText: {
    color: '#D97706',
  },
  pendingDot: {
    backgroundColor: '#F59E0B',
  },
});
