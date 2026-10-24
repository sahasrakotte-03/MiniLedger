import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddEditLoanScreen } from './src/screens/AddEditLoanScreen';
import { LoanDetailsScreen } from './src/screens/LoanDetailsScreen';
import { Loan } from './src/types';

// Inject global web aesthetics, viewport meta & safe area typography
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Ensure viewport meta tag includes viewport-fit=cover for proper mobile safe area calculation
  let metaViewport = document.querySelector('meta[name="viewport"]');
  if (!metaViewport) {
    metaViewport = document.createElement('meta');
    metaViewport.setAttribute('name', 'viewport');
    document.head.appendChild(metaViewport);
  }
  metaViewport.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content'
  );

  const styleId = 'miniledger-web-globals';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      *, *::before, *::after {
        box-sizing: border-box;
      }
      :root {
        --sat: env(safe-area-inset-top, 0px);
        --sar: env(safe-area-inset-right, 0px);
        --sab: env(safe-area-inset-bottom, 0px);
        --sal: env(safe-area-inset-left, 0px);
      }
      html {
        min-height: 100%;
        min-height: 100dvh;
        overflow-x: hidden;
        -webkit-text-size-adjust: 100%;
      }
      body {
        min-height: 100%;
        min-height: 100dvh;
        width: 100%;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        scroll-padding-top: calc(env(safe-area-inset-top, 0px) + 20px);
        scroll-padding-bottom: 90px;
        background-color: #F8FAFC;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      #root {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        min-height: 100dvh;
        width: 100%;
        max-width: 100vw;
        overflow-y: visible;
        background-color: #F8FAFC;
        flex: 1;
      }
      input, button, select, textarea {
        font-family: inherit;
        scroll-margin: 20px 0;
      }
      ::selection {
        background-color: #059669;
        color: #ffffff;
      }
      /* Custom modern scrollbars */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: #CBD5E1;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94A3B8;
      }
    `;
    document.head.appendChild(style);
  }

  // Smooth keyboard-aware centering on mobile browsers when focusing inputs
  if (typeof window !== 'undefined' && !(window as any).__miniledger_focus_listener__) {
    (window as any).__miniledger_focus_listener__ = true;
    let lastFocusedElement: HTMLElement | null = null;
    let focusScrollTimer: any = null;

    window.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        // Prevent typing interruptions if already focused on this element
        if (lastFocusedElement === target) return;
        lastFocusedElement = target;

        if (focusScrollTimer) clearTimeout(focusScrollTimer);
        focusScrollTimer = setTimeout(() => {
          try {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (err) {
            // graceful fallback
          }
        }, 250);
      }
    });

    window.addEventListener('focusout', () => {
      lastFocusedElement = null;
    });
  }
}

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
