/**
 * File: react/project/app/(tabs)/index.tsx
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Home tab entry screen and redirect/landing behavior for authenticated users.
 */


import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { login } from '@/src/api';
import { commonStyles, spacing } from '@/src/theme';

/** renders login form and signs user in */
export default function LoginScreen() {
  // state management
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameError = getUsernameError(username);
  const passwordError = getPasswordError(password);
  const canSubmit = !usernameError && !passwordError;

  const handleSignIn = async () => {
    setAttemptedSubmit(true);
    setSubmitError('');
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      await login(username.trim(), password);
      router.replace('/(tabs)/dashboard'); // routes to this endpoint
    } catch {
      setSubmitError('Login failed. Check username/password and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Use your account to continue.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            autoCapitalize="none"
            style={styles.input}
          />
          <Text style={styles.helperText}>Use the username you registered with.</Text>
          {attemptedSubmit && !!usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            style={styles.input}
          />
          <Text style={styles.helperText}>Must be at least 8 characters.</Text>
          {attemptedSubmit && !!passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </View>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={handleSignIn}
          disabled={!canSubmit || isSubmitting}
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
            !canSubmit || isSubmitting ? styles.buttonDisabled : null,
          ]}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/register')}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Create account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** validates required username field */
function getUsernameError(value: string): string {
  if (!value.trim()) return 'Username is required.';
  return '';
}

/** validates required password field */
function getPasswordError(value: string): string {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  return '';
}

const styles = StyleSheet.create({
  screen: commonStyles.screen,
  card: {
    ...commonStyles.card,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: commonStyles.title,
  subtitle: commonStyles.subtitle,
  field: {
    gap: spacing.xs,
  },
  label: commonStyles.label,
  helperText: commonStyles.helperText,
  errorText: commonStyles.errorText,
  input: commonStyles.input,
  button: commonStyles.button,
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: commonStyles.buttonDisabled,
  buttonText: commonStyles.buttonText,
  secondaryButton: commonStyles.secondaryButton,
  secondaryButtonText: commonStyles.secondaryButtonText,
});
