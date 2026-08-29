import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { Alert } from 'react-native';

type DemoModeValue = { isDemo: boolean; session: number; enterDemo: () => void; exitDemo: () => Promise<boolean> };
const Context = createContext<DemoModeValue | null>(null);

async function authenticateExit() {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    if (!hasHardware || !isEnrolled) {
      Alert.alert('Fingerprint unavailable', 'Set up fingerprint unlock in your phone settings first.');
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock personal data',
      promptDescription: 'Verify your fingerprint to exit Demo Mode.',
      cancelLabel: 'Stay in Demo Mode',
      disableDeviceFallback: true,
      biometricsSecurityLevel: 'strong',
    });
    return result.success;
  } catch {
    Alert.alert('Unable to verify fingerprint', 'Please try again.');
    return false;
  }
}

export function DemoModeProvider({ children }: PropsWithChildren) {
  const [isDemo, setIsDemo] = useState(false);
  const [session, setSession] = useState(0);
  const value = useMemo(() => ({
    isDemo,
    session,
    enterDemo: () => { setSession((current) => current + 1); setIsDemo(true); },
    exitDemo: async () => {
      if (!(await authenticateExit())) return false;
      setIsDemo(false);
      return true;
    },
  }), [isDemo, session]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDemoMode() {
  const value = useContext(Context);
  if (!value) throw new Error('useDemoMode must be used inside DemoModeProvider');
  return value;
}
