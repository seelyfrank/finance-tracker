/**
 * File: react/project/app/register.tsx
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Registration screen form and submission flow for creating new user accounts.
 */


import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { register } from '@/src/api';
import { commonStyles, spacing } from '@/src/theme';

/** renders registration form and creates a new account */
export default function RegisterScreen() {
  const router = useRouter(); // for easy page routing

  // state management
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [plannedIncome, setPlannedIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // vars calculated dependant on state
  const usernameError = !username.trim() ? 'Username is required.' : '';
  const passwordError = getPasswordError(password);
  const confirmPasswordError =
    confirmPassword !== password ? 'Passwords do not match.' : '';
  const plannedIncomeError = getMoneyError(plannedIncome, 'Fixed monthly income');
  const savingsGoalError = getMoneyError(savingsGoal, 'Monthly savings goal', true);
  const canSubmit =
    !usernameError &&
    !passwordError &&
    !confirmPasswordError &&
    !plannedIncomeError &&
    !savingsGoalError;

  const handleRegister = async () => {
    setAttemptedSubmit(true);
    setSubmitError('');
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      await register({
        username: username.trim(),
        email: email.trim() || undefined,
        password,
        fixed_income: normalizeMoney(plannedIncome),
        savings_goal: normalizeMoney(savingsGoal),
      });
      router.replace('/(tabs)/dashboard'); // Changes the screan after registration
    } catch {
      setSubmitError('Registration failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Set up your budget profile to get started.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={styles.input} />
          {attemptedSubmit && !!usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email (optional)</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fixed monthly income</Text>
          <TextInput
            value={plannedIncome}
            onChangeText={setPlannedIncome}
            keyboardType="decimal-pad"
            placeholder="e.g. 4200"
            style={styles.input}
          />
          {attemptedSubmit && !!plannedIncomeError ? (
            <Text style={styles.errorText}>{plannedIncomeError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Monthly savings goal</Text>
          <TextInput
            value={savingsGoal}
            onChangeText={setSavingsGoal}
            keyboardType="decimal-pad"
            placeholder="e.g. 800"
            style={styles.input}
          />
          {attemptedSubmit && !!savingsGoalError ? (
            <Text style={styles.errorText}>{savingsGoalError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          {attemptedSubmit && !!passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />
          {attemptedSubmit && !!confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={handleRegister}
          disabled={!canSubmit || isSubmitting}
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
            !canSubmit || isSubmitting ? styles.buttonDisabled : null,
          ]}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Creating account...' : 'Register'}</Text>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to sign in</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** checks password rules for registration */
function getPasswordError(value: string): string {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  return '';
}

/** validates money inputs for income and savings */
function getMoneyError(value: string, label: string, allowZero = false): string {
  if (!value.trim()) return `${label} is required.`;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `${label} must be a number.`;
  if (allowZero ? parsed < 0 : parsed <= 0) {
    return allowZero ? `${label} cannot be negative.` : `${label} must be greater than 0.`;
  }
  return '';
}

/** normalizes money input to two decimals */
function normalizeMoney(value: string): string {
  return Number(value).toFixed(2);
}

const styles = StyleSheet.create({
  screen: commonStyles.screen,
  card: {
    ...commonStyles.card,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  title: commonStyles.title,
  subtitle: commonStyles.subtitle,
  field: {
    gap: spacing.xs,
  },
  label: commonStyles.label,
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
