import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SummaryCardProps {
  title: string;
  amount: string;
  count: number;
  variant: 'lent' | 'repaid' | 'overdue';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  count,
  variant,
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'repaid':
        return {
          container: styles.repaidContainer,
          title: styles.repaidTitle,
          amount: styles.repaidAmount,
          badge: styles.repaidBadge,
          badgeText: styles.repaidBadgeText,
        };
      case 'overdue':
        return {
          container: styles.overdueContainer,
          title: styles.overdueTitle,
          amount: styles.overdueAmount,
          badge: styles.overdueBadge,
          badgeText: styles.overdueBadgeText,
        };
      case 'lent':
      default:
        return {
          container: styles.lentContainer,
          title: styles.lentTitle,
          amount: styles.lentAmount,
          badge: styles.lentBadge,
          badgeText: styles.lentBadgeText,
        };
    }
  };

  const currentStyles = getCardStyle();

  return (
    <View style={[styles.card, currentStyles.container]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, currentStyles.title]}>{title}</Text>
        <View style={[styles.countBadge, currentStyles.badge]}>
          <Text style={[styles.countText, currentStyles.badgeText]}>
            {count} {count === 1 ? 'loan' : 'loans'}
          </Text>
        </View>
      </View>
      <Text style={[styles.amount, currentStyles.amount]} numberOfLines={1} adjustsFontSizeToFit>
        {amount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // Variant: Total Lent
  lentContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  lentTitle: {
    color: '#64748B',
  },
  lentAmount: {
    color: '#0F172A',
  },
  lentBadge: {
    backgroundColor: '#F1F5F9',
  },
  lentBadgeText: {
    color: '#475569',
  },
  // Variant: Total Repaid
  repaidContainer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  repaidTitle: {
    color: '#166534',
  },
  repaidAmount: {
    color: '#15803D',
  },
  repaidBadge: {
    backgroundColor: '#DCFCE7',
  },
  repaidBadgeText: {
    color: '#166534',
  },
  // Variant: Overdue Amount
  overdueContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  overdueTitle: {
    color: '#991B1B',
  },
  overdueAmount: {
    color: '#DC2626',
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
  },
  overdueBadgeText: {
    color: '#991B1B',
  },
});
