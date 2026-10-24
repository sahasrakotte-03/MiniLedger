import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

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
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 380;
  const isMobile = width < 640;

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

  // On mobile, show shorter title and compact count pill
  const displayTitle = isMobile
    ? title.replace('Total ', '')
    : title;

  return (
    <View
      style={[
        styles.card,
        currentStyles.container,
        isMobile && styles.cardMobile,
        isSmallMobile && styles.cardSmallMobile,
      ]}
    >
      <View style={styles.topRow}>
        <Text
          style={[styles.title, currentStyles.title, isMobile && styles.titleMobile]}
          numberOfLines={1}
        >
          {displayTitle}
        </Text>
        <View style={[styles.countBadge, currentStyles.badge, isMobile && styles.countBadgeMobile]}>
          <Text style={[styles.countText, currentStyles.badgeText, isMobile && styles.countTextMobile]}>
            {isMobile ? count : `${count} ${count === 1 ? 'loan' : 'loans'}`}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.amount,
          currentStyles.amount,
          isMobile && styles.amountMobile,
          isSmallMobile && styles.amountSmallMobile,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {amount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardMobile: {
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  cardSmallMobile: {
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    gap: 2,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  titleMobile: {
    fontSize: 8.5,
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    flexShrink: 0,
  },
  countBadgeMobile: {
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    borderRadius: 6,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  countTextMobile: {
    fontSize: 8.5,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  amountMobile: {
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  amountSmallMobile: {
    fontSize: 13,
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
    color: '#334155',
  },
  // Variant: Total Repaid
  repaidContainer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  repaidTitle: {
    color: '#15803D',
  },
  repaidAmount: {
    color: '#047857',
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
    color: '#B91C1C',
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
