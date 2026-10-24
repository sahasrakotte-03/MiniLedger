import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  StatusBar as RNStatusBar,
  Keyboard,
} from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { ServerConfigModal } from '../components/ServerConfigModal';
import { getApiBaseUrl } from '../config/api';

export const LoginScreen: React.FC = () => {
  const { sendOtp, verifyOtp } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 380;
  const isMobile = width < 640;

  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Safe area top padding:
  // - Web (mobile): calc(max(env(safe-area-inset-top, 0px), 10px) + 12px)
  // - Android Native: (RNStatusBar.currentHeight || Constants.statusBarHeight || 24) + 12px
  // - iOS Native: (Constants.statusBarHeight || 44) + 12px
  const safeTopPadding = Platform.select({
    web: (isMobile ? 'calc(max(env(safe-area-inset-top, 0px), 10px) + 12px)' : 20) as any,
    android: (RNStatusBar.currentHeight || Constants.statusBarHeight || 24) + 12,
    ios: (Constants.statusBarHeight || 44) + 12,
    default: 16,
  });

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(300); // 5 minutes
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [showServerModal, setShowServerModal] = useState(false);

  // Dynamic keyboard listeners for both Native (iOS/Android) and Web
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    let onVvResize: (() => void) | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.visualViewport) {
      onVvResize = () => {
        const vv = window.visualViewport;
        if (vv) {
          const diff = window.innerHeight - vv.height;
          if (diff > 80) {
            setKeyboardHeight(diff);
          } else {
            setKeyboardHeight(0);
          }
        }
      };
      window.visualViewport.addEventListener('resize', onVvResize);
    }

    return () => {
      showSub.remove();
      hideSub.remove();
      if (onVvResize && typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onVvResize);
      }
    };
  }, []);

  const dynamicBottomPadding = isMobile
    ? Math.max(keyboardHeight + 60, 260)
    : 90;

  const handleInputFocus = () => {
    if (isMobile) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 80, animated: true });
      }, 250);
    }
  };

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSendOtp = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
    if (!cleaned) {
      setErrorMessage('Please enter your 10-digit mobile number.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await sendOtp(cleaned);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
      setSuccessNotice('OTP generated! Check backend server terminal or use the Auto-Fill button below.');
      setTimer(300);
      setStep('OTP');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);

    if (otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    try {
      setIsLoading(true);
      await verifyOtp(phoneNumber, otp.trim());
      // On success, AuthContext automatically transitions user to authenticated state
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: safeTopPadding, paddingBottom: dynamicBottomPadding },
            isMobile && styles.scrollContentMobile,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          alwaysBounceVertical={true}
          scrollEnabled={true}
        >
          <View style={styles.formContainer}>
            {/* Top Server Host Indicator - Compact & Subtle */}
            <View style={styles.topHostBar}>
              <TouchableOpacity
                style={styles.hostChip}
                onPress={() => setShowServerModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.hostDot} />
                <Text style={styles.hostText} numberOfLines={1}>
                  {getApiBaseUrl().replace('http://', '')}
                </Text>
                <Text style={styles.hostChangeText}>⚙️</Text>
              </TouchableOpacity>
            </View>

            {/* MiniLedger Branding Header - Compact */}
            <View style={[styles.brandHeader, isMobile && styles.brandHeaderCompact]}>
              <View style={[styles.logoBadge, isMobile && styles.logoBadgeMobile]}>
                <Text style={[styles.logoIcon, isMobile && styles.logoIconMobile]}>₹</Text>
              </View>
              <Text style={[styles.brandName, isMobile && styles.brandNameMobile]}>
                MiniLedger
              </Text>
              <Text style={styles.brandTagline}>
                Track money lent to friends effortlessly
              </Text>
            </View>

            {/* Form Card */}
            <View style={[styles.card, isMobile && styles.cardCompact]}>
            {step === 'PHONE' ? (
              <>
                <Text style={styles.cardTitle}>Sign In with Phone</Text>
                <Text style={styles.cardSubtitle}>
                  Enter your mobile number to receive a verification OTP.
                </Text>

                {/* Error Banner */}
                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryFlag}>🇮🇳</Text>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="98765 43210"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={14}
                    value={phoneNumber}
                    onChangeText={(val) => {
                      setPhoneNumber(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoFocus={!isMobile}
                    onFocus={handleInputFocus}
                  />
                </View>

                {/* Developer / Internship Notice */}
                <View style={styles.mockNoticeBox}>
                  <Text style={styles.mockNoticeTitle}>ℹ️ Mock OTP Authentication</Text>
                  <Text style={styles.mockNoticeDesc}>
                    SMS delivery is mocked in this MVP. When you tap "Send OTP", the 6-digit code will be printed to your backend server terminal console.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.otpHeaderRow}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setStep('PHONE');
                      setOtp('');
                      setErrorMessage(null);
                    }}
                  >
                    <Text style={styles.backButtonText}>← Change Number</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.cardTitle}>Verify OTP</Text>
                <Text style={styles.cardSubtitle}>
                  Enter the 6-digit verification code for{' '}
                  <Text style={styles.boldText}>+91 {phoneNumber}</Text>
                </Text>

                {/* Success Notice */}
                {successNotice && (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>{successNotice}</Text>
                  </View>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <Text style={styles.label}>6-Digit OTP</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  inputMode="numeric"
                  autoComplete={Platform.OS === 'web' ? ('one-time-code' as any) : 'sms-otp'}
                  maxLength={6}
                  value={otp}
                  onChangeText={(val) => {
                    setOtp(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoFocus
                  onFocus={handleInputFocus}
                />

                {/* Development / Evaluation OTP Quick Helper */}
                {devOtp && (
                  <View style={styles.devOtpContainer}>
                    <View style={styles.devOtpBadge}>
                      <Text style={styles.devOtpLabel}>Backend Terminal OTP: </Text>
                      <Text style={styles.devOtpCode}>{devOtp}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.autoFillBtn}
                      onPress={() => {
                        setOtp(devOtp);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.autoFillText}>⚡ Tap to Auto-Fill</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.timerRow}>
                  <Text style={styles.timerLabel}>
                    Code expires in:{' '}
                    <Text style={styles.timerValue}>{formatTimer(timer)}</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={isLoading || timer > 240}
                  >
                    <Text
                      style={[
                        styles.resendText,
                        timer > 240 && styles.resendDisabled,
                      ]}
                    >
                      Resend Code
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <ServerConfigModal
        visible={showServerModal}
        onClose={() => setShowServerModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    width: '100%',
    ...Platform.select({
      web: {
        minHeight: '100dvh' as any,
      },
    }),
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    ...Platform.select({
      web: {
        minHeight: '100dvh' as any,
      },
    }),
  },
  scrollView: {
    flex: 1,
    width: '100%',
    ...Platform.select({
      web: {
        overflow: 'visible' as any,
        minHeight: '100dvh' as any,
      },
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 90,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        minHeight: '100dvh' as any,
      },
    }),
  },
  scrollContentMobile: {
    paddingBottom: 120,
    justifyContent: 'flex-start',
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  topHostBar: {
    alignItems: 'center',
    marginBottom: 10,
  },
  hostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  hostDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  hostText: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 200,
  },
  hostChangeText: {
    fontSize: 12,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandHeaderCompact: {
    marginBottom: 12,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  logoBadgeMobile: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginBottom: 6,
  },
  logoIcon: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoIconMobile: {
    fontSize: 20,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  brandNameMobile: {
    fontSize: 20,
  },
  brandTagline: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  cardCompact: {
    padding: 16,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    marginBottom: 16,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    color: '#0F172A',
    marginBottom: 14,
  },
  mockNoticeBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  mockNoticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  mockNoticeDesc: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 15,
  },
  primaryButton: {
    backgroundColor: '#059669', // Emerald Green fintech accent
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  otpHeaderRow: {
    marginBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  timerValue: {
    fontWeight: '700',
    color: '#0F172A',
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  resendDisabled: {
    color: '#94A3B8',
  },
  devOtpContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  devOtpLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  devOtpCode: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 1,
  },
  autoFillBtn: {
    backgroundColor: '#059669',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  autoFillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
