import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddEditLoanScreen } from './src/screens/AddEditLoanScreen';
import { LoanDetailsScreen } from './src/screens/LoanDetailsScreen';
import { Loan } from './src/types';

type AppScreen = 'HOME' | 'ADD_LOAN' | 'EDIT_LOAN' | 'LOAN_DETAILS';

const MainNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('HOME');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashBadge}>
          <Text style={styles.splashIcon}>₹</Text>
        </View>
        <Text style={styles.splashTitle}>MiniLedger</Text>
        <ActivityIndicator size="small" color="#059669" style={styles.splashSpinner} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  switch (currentScreen) {
    case 'ADD_LOAN':
      return (
        <AddEditLoanScreen
          loanToEdit={null}
          onSaveSuccess={() => {
            setCurrentScreen('HOME');
          }}
          onCancel={() => {
            setCurrentScreen('HOME');
          }}
        />
      );

    case 'EDIT_LOAN':
      return (
        <AddEditLoanScreen
          loanToEdit={selectedLoan}
          onSaveSuccess={() => {
            setCurrentScreen('HOME');
            setSelectedLoan(null);
          }}
          onCancel={() => {
            setCurrentScreen('LOAN_DETAILS');
          }}
        />
      );

    case 'LOAN_DETAILS':
      if (!selectedLoan) {
        setCurrentScreen('HOME');
        return null;
      }
      return (
        <LoanDetailsScreen
          loan={selectedLoan}
          onBack={() => {
            setCurrentScreen('HOME');
            setSelectedLoan(null);
          }}
          onEdit={(loan) => {
            setSelectedLoan(loan);
            setCurrentScreen('EDIT_LOAN');
          }}
          onLoanUpdated={() => {
            // Updated loan, returning to home will refresh
          }}
        />
      );

    case 'HOME':
    default:
      return (
        <HomeScreen
          onAddLoan={() => {
            setSelectedLoan(null);
            setCurrentScreen('ADD_LOAN');
          }}
          onSelectLoan={(loan) => {
            setSelectedLoan(loan);
            setCurrentScreen('LOAN_DETAILS');
          }}
        />
      );
  }
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  splashIcon: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  splashSpinner: {
    marginTop: 24,
  },
});
