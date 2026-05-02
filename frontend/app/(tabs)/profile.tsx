/**
 * File: react/project/app/(tabs)/profile.tsx
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Profile tab screen for viewing and editing user budgeting preferences and account defaults.
 */


import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  createAccount,
  createCategory,
  createProfile,
  deleteAccount,
  deleteCategory,
  getAccounts,
  getCategories,
  getProfiles,
  getTransactions,
  logout,
  updateAccount,
  updateCategory,
  updateProfile,
} from '@/src/api';
import type { Account, Category, Profile } from '@/src/api/types';
import { commonStyles } from '@/src/theme';

// for the toggle between what we are adding/deleting/editing in our settings
type ManagerMode = 'categories' | 'accounts';
type AccountKind = 'checking' | 'savings' | 'credit' | 'cash' | 'other';

const ACCOUNT_KIND_OPTIONS: { value: AccountKind; label: string }[] = [
  { value: 'checking', label: 'Checking and Debit' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit card' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

/** converts account kind code into label text */
function accountKindLabel(kind: string) {
  return ACCOUNT_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? 'Other';
}

/** returns singular text for current manager mode */
function singularEntity(mode: ManagerMode): 'category' | 'account' {
  return mode === 'categories' ? 'category' : 'account';
}

/** renders profile settings plus account/category management */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const manageDataSectionY = useRef(0);

  // state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<ManagerMode>('categories');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthIncomeReceived, setMonthIncomeReceived] = useState('0.00');

  const [plannedIncome, setPlannedIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [defaultAccountId, setDefaultAccountId] = useState<string>('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [nameField, setNameField] = useState('');
  const [kindField, setKindField] = useState<AccountKind>('checking');
  const [needOrWantField, setNeedOrWantField] = useState<'need' | 'want'>('want');
  const [spendGoalField, setSpendGoalField] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEntity, setSavingEntity] = useState(false);
  const [kindMenuOpen, setKindMenuOpen] = useState(false);

  // calculated from state 
  const parsedIncomeReceived = Number(monthIncomeReceived || '0') || 0;
  const parsedPlannedIncome = Number(plannedIncome || profile?.fixed_income || '0') || 0;
  const effectiveIncome = parsedPlannedIncome + parsedIncomeReceived;
  const parsedSavings = Number(savingsGoal || profile?.savings_goal || '0') || 0;
  const availableForSpending = effectiveIncome - parsedSavings;
  const allocatedExisting = categories
    .filter((category) => category.id !== editingId)
    .filter((category) => String(category.name).trim().toLowerCase() !== 'income')
    .reduce((sum, category) => sum + (Number(category.spend_goal || '0') || 0), 0);
  const allocatedLockedExcludingOtherAndEditing = categories
    .filter((category) => category.id !== editingId)
    .filter((category) => {
      const normalized = String(category.name).trim().toLowerCase();
      return normalized !== 'income' && normalized !== 'other';
    })
    .reduce((sum, category) => sum + (Number(category.spend_goal || '0') || 0), 0);
  const isEditingIncomeCategory = mode === 'categories' && nameField.trim().toLowerCase() === 'income';
  const isProtectedEditingCategory =
    mode === 'categories' &&
    ['income', 'other'].includes(nameField.trim().toLowerCase());
  const currentCategoryGoal = Number(spendGoalField || '0') || 0;
  // In edit mode, "Other" and the currently edited category are both released into free pool.
  const potentialToSpend = availableForSpending - allocatedLockedExcludingOtherAndEditing;
  const remainingAllocated = potentialToSpend - (isEditingIncomeCategory ? 0 : currentCategoryGoal);
  const categoryBudgetExceeded =
    mode === 'categories' &&
    !isEditingIncomeCategory &&
    currentCategoryGoal > potentialToSpend &&
    currentCategoryGoal > 0;

  /** loads profile accounts categories and month income data */
  const loadAll = async () => {
    // will call helper functions to get relevant data and apply setters to 
    // make those changes

    try {
      setLoading(true);
      setError('');
      const [profilesRes, accountsRes, categoriesRes] = await Promise.all([
        getProfiles(),
        getAccounts(),
        getCategories(),
      ]);
      const firstProfile = profilesRes[0] ?? null;
      setProfile(firstProfile);
      setAccounts(accountsRes);
      setCategories(categoriesRes);
      setPlannedIncome(firstProfile?.fixed_income ?? '');
      setSavingsGoal(firstProfile?.savings_goal ?? '');
      setDefaultAccountId(firstProfile?.default_account ? String(firstProfile.default_account) : '');

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const savingsAccountIds = new Set(
        accountsRes
          .filter((account) => String(account.kind).trim().toLowerCase() === 'savings')
          .map((account) => account.id),
      );
      const incomeCategoryIds = new Set(
        categoriesRes
          .filter((category) => String(category.name).trim().toLowerCase() === 'income')
          .map((category) => category.id),
      );

      let page = 1;
      let accumulatedIncomeReceived = 0;
      let hasNext = true;
      while (hasNext) {
        const receivedPage = await getTransactions({
          page,
          page_size: 100,
          transaction_type: 'received',
          date_from: formatDateForApi(monthStart),
          date_to: formatDateForApi(monthEnd),
        });
        for (const txn of receivedPage.results) {
          if (
            !savingsAccountIds.has(txn.account) &&
            incomeCategoryIds.has(txn.category)
          ) {
            accumulatedIncomeReceived += Number(txn.amount) || 0;
          }
        }
        hasNext = Boolean(receivedPage.next);
        page += 1;
      }

      if (!Number.isFinite(accumulatedIncomeReceived)) {
        setMonthIncomeReceived('0.00');
      } else {
        setMonthIncomeReceived(accumulatedIncomeReceived.toFixed(2));
      }
    } catch {
      setError('Could not load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // runs loadAll() every time the screen comes into focus 
  // useFocusEffect is for when we are navigating active screens
  // callback just memoizes/saves the focus callback
  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, []),
  );

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(''), 2200);
    return () => clearTimeout(timeout);
  }, [success]);

  // upon hitting save button
  /** saves profile budget settings */
  const saveProfileBudget = async () => {
    if (!plannedIncome.trim() || !savingsGoal.trim()) {
      setError('Fixed income and savings goal are required.');
      return;
    }
    try {
      setSavingProfile(true);
      setError('');
      setSuccess('');
      const payload = {
        fixed_income: normalizeMoney(plannedIncome),
        savings_goal: normalizeMoney(savingsGoal),
        default_account: defaultAccountId ? Number(defaultAccountId) : null,
      };
      const updated = profile
        ? await updateProfile(profile.id, payload)
        : await createProfile(payload);
      setProfile(updated);
      setSuccess('Profile settings saved.');
    } catch {
      setError('Could not save profile budget values.');
    } finally {
      setSavingProfile(false);
    }
  };

  /** resets category/account form state */
  const resetEntityForm = () => {
    setEditingId(null);
    setNameField('');
    setKindField('checking');
    setNeedOrWantField('want');
    setSpendGoalField('');
    setKindMenuOpen(false);
  };

  // calls relevant endpoint from the frontend api/ logic
  /** creates or updates the current category/account */
  const saveEntity = async () => {
    if (!nameField.trim()) {
      setError('Name is required.');
      return;
    }
    if (mode === 'categories' && isProtectedEditingCategory) {
      setError('Income and Other are default categories and cannot be edited.');
      return;
    }
    if (mode === 'categories' && categoryBudgetExceeded) {
      setError(
        `Category goals exceed available budget. Remaining allocatable amount: $${Math.max(
          potentialToSpend,
          0
        ).toFixed(2)}`
      );
      return;
    }
    try {
      setSavingEntity(true);
      setError('');
      setSuccess('');

      if (mode === 'accounts') {
        if (editingId) {
          await updateAccount(editingId, { name: nameField.trim(), kind: kindField });
        } else {
          await createAccount({ name: nameField.trim(), kind: kindField });
        }
      } else {
        const payload = {
          name: nameField.trim(),
          need_or_want: needOrWantField,
          spend_goal: normalizeMoney(spendGoalField || '0'),
        };
        if (editingId) {
          await updateCategory(editingId, payload);
        } else {
          await createCategory(payload);
        }
      }

      await loadAll();
      resetEntityForm();
      setSuccess(
        editingId
          ? `${singularEntity(mode)} updated.`
          : `${singularEntity(mode)} created.`,
      );
    } catch {
      setError(`Could not ${editingId ? 'update' : 'create'} ${singularEntity(mode)}.`);
    } finally {
      setSavingEntity(false);
    }
  };

  /** preloads account data into edit mode */
  const startEditAccount = (item: Account) => {
    setMode('accounts');
    setEditingId(item.id);
    setNameField(item.name);
    if (item.kind === 'checking' || item.kind === 'savings' || item.kind === 'credit' || item.kind === 'cash' || item.kind === 'other') {
      setKindField(item.kind);
    } else {
      setKindField('other');
    }
    setKindMenuOpen(false);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(manageDataSectionY.current - 12, 0),
        animated: true,
      });
    });
  };

  /** preloads category data into edit mode */
  const startEditCategory = (item: Category) => {
    setMode('categories');
    setEditingId(item.id);
    setNameField(item.name);
    setNeedOrWantField(item.need_or_want);
    setSpendGoalField(item.spend_goal ?? '');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(manageDataSectionY.current - 12, 0),
        animated: true,
      });
    });
  };

  /** deletes selected account/category and reloads state */
  const removeEntity = async (id: number) => {
    try {
      setError('');
      if (mode === 'accounts') {
        await deleteAccount(id);
      } else {
        await deleteCategory(id);
      }
      await loadAll();
      if (editingId === id) resetEntityForm();
    } catch {
      setError(`Could not delete ${singularEntity(mode)}.`);
    }
  };

  /** logs out and returns to auth route */
  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={commonStyles.screen} edges={['top', 'left', 'right']}>
      {success ? (
        <View style={[commonStyles.toastSuccess, { top: insets.top + 12 }]}>
          <Text style={commonStyles.toastSuccessText}>{success}</Text>
        </View>
      ) : null}
      <ScrollView ref={scrollRef} contentContainerStyle={commonStyles.scrollScreenContent}>
        <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard900]}>
          <Text style={commonStyles.title}>Profile & Settings</Text>
          <Text style={commonStyles.subtitle}>Manage budget goals plus category/account setup.</Text>
          {loading ? <Text style={commonStyles.helperText}>Loading...</Text> : null}
          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}
        </View>

        <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard900]}>
          <Text style={commonStyles.sectionHeading}>Budget Targets</Text>
          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Fixed monthly income</Text>
            <TextInput
              value={plannedIncome}
              onChangeText={setPlannedIncome}
              keyboardType="decimal-pad"
              style={commonStyles.input}
              placeholder="e.g. 4200"
            />
          </View>
          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Monthly savings goal</Text>
            <TextInput
              value={savingsGoal}
              onChangeText={setSavingsGoal}
              keyboardType="decimal-pad"
              style={commonStyles.input}
              placeholder="e.g. 800"
            />
          </View>
          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Default account</Text>
            <View style={[commonStyles.pillRow, commonStyles.pillRowBottomMargin]}>
              <Pressable
                style={[
                  commonStyles.pill,
                  defaultAccountId === '' ? commonStyles.pillActive : null,
                ]}
                onPress={() => setDefaultAccountId('')}
              >
                <Text
                  style={[
                    commonStyles.pillText,
                    defaultAccountId === '' ? commonStyles.pillTextActive : null,
                  ]}
                >
                  None
                </Text>
              </Pressable>
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  style={[
                    commonStyles.pill,
                    defaultAccountId === String(account.id) ? commonStyles.pillActive : null,
                  ]}
                  onPress={() => setDefaultAccountId(String(account.id))}
                >
                  <Text
                    style={[
                      commonStyles.pillText,
                      defaultAccountId === String(account.id) ? commonStyles.pillTextActive : null,
                    ]}
                  >
                    {account.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={commonStyles.helperText}>
              New transactions default to this account in the Transactions tab.
            </Text>
          </View>

          <Pressable
            onPress={saveProfileBudget}
            disabled={savingProfile}
            style={({ pressed }) => [
              commonStyles.button,
              pressed ? commonStyles.buttonPressed : null,
              savingProfile ? commonStyles.buttonDisabled : null,
            ]}
          >
            <Text style={commonStyles.buttonText}>{savingProfile ? 'Saving...' : 'Save budget settings'}</Text>
          </Pressable>
        </View>

        <View
          style={[commonStyles.surfaceCard, commonStyles.surfaceCard900]}
          onLayout={(event) => {
            manageDataSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={commonStyles.sectionHeading}>Manage Data</Text>
          <View style={commonStyles.pillRow}>
            <Pressable
              style={[commonStyles.pill, mode === 'categories' ? commonStyles.pillActive : null]}
              onPress={() => {
                setMode('categories');
                resetEntityForm();
              }}
            >
              <Text style={[commonStyles.pillText, mode === 'categories' ? commonStyles.pillTextActive : null]}>
                Categories
              </Text>
            </Pressable>
            <Pressable
              style={[commonStyles.pill, mode === 'accounts' ? commonStyles.pillActive : null]}
              onPress={() => {
                setMode('accounts');
                resetEntityForm();
              }}
            >
              <Text style={[commonStyles.pillText, mode === 'accounts' ? commonStyles.pillTextActive : null]}>
                Accounts
              </Text>
            </Pressable>
          </View>

          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>{mode === 'accounts' ? 'Account name' : 'Category name'}</Text>
            <TextInput value={nameField} onChangeText={setNameField} style={commonStyles.input} />
          </View>

          {mode === 'accounts' ? (
            <View style={commonStyles.formField}>
              <Text style={commonStyles.label}>Kind</Text>
              <View>
                <Pressable
                  onPress={() => setKindMenuOpen((current) => !current)}
                  style={commonStyles.input}
                >
                  <Text style={commonStyles.label}>{accountKindLabel(kindField)}</Text>
                  <Text style={commonStyles.helperText}>Tap to choose account type</Text>
                </Pressable>
                {kindMenuOpen ? (
                  <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard900]}>
                    {ACCOUNT_KIND_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setKindField(option.value);
                          setKindMenuOpen(false);
                        }}
                        style={[
                          commonStyles.listRow,
                          kindField === option.value ? commonStyles.pillActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            commonStyles.label,
                            kindField === option.value ? commonStyles.pillTextActive : null,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={commonStyles.formField}>
              <Text style={commonStyles.label}>Need or want</Text>
              <View style={commonStyles.pillRow}>
                <Pressable
                  style={[
                    commonStyles.pill,
                    needOrWantField === 'need' ? commonStyles.pillActive : null,
                  ]}
                  onPress={() => setNeedOrWantField('need')}
                >
                  <Text
                    style={[
                      commonStyles.pillText,
                      needOrWantField === 'need' ? commonStyles.pillTextActive : null,
                    ]}
                  >
                    Need
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    commonStyles.pill,
                    needOrWantField === 'want' ? commonStyles.pillActive : null,
                  ]}
                  onPress={() => setNeedOrWantField('want')}
                >
                  <Text
                    style={[
                      commonStyles.pillText,
                      needOrWantField === 'want' ? commonStyles.pillTextActive : null,
                    ]}
                  >
                    Want
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {mode === 'categories' ? (
            <View style={commonStyles.formField}>
              {!isEditingIncomeCategory ? (
                <>
                  <Text style={commonStyles.label}>Spend goal</Text>
                  <TextInput
                    value={spendGoalField}
                    onChangeText={setSpendGoalField}
                    keyboardType="decimal-pad"
                    style={commonStyles.input}
                    placeholder="e.g. 500"
                  />
                </>
              ) : (
                <Text style={commonStyles.helperText}>
                  Income is an inflow-only default category and does not use a spend goal.
                </Text>
              )}
              <Text style={commonStyles.helperText}>
                Potential to spend now: ${potentialToSpend.toFixed(2)}
              </Text>
              <Text style={commonStyles.helperText}>
                Remaining after this goal: ${remainingAllocated.toFixed(2)}
              </Text>
              <Text style={commonStyles.helperText}>
                Effective income uses fixed monthly income plus this month&apos;s Income-category
                received transactions (excluding savings accounts).
              </Text>
              {isEditingIncomeCategory ? (
                <Text style={commonStyles.helperText}>
                  Income is treated separately from needs/wants and should use a 0 spend goal.
                </Text>
              ) : null}
              {isProtectedEditingCategory ? (
                <Text style={commonStyles.helperText}>
                  Default categories cannot be edited.
                </Text>
              ) : null}
              {categoryBudgetExceeded ? (
                <Text style={commonStyles.errorText}>
                  This change exceeds available spending budget for your monthly targets.
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={commonStyles.actionRow}>
            <Pressable
              onPress={saveEntity}
              style={({ pressed }) => [
                commonStyles.buttonFlex,
                pressed ? commonStyles.buttonPressed : null,
                savingEntity || categoryBudgetExceeded || isProtectedEditingCategory
                  ? commonStyles.buttonDisabled
                  : null,
              ]}
              disabled={savingEntity || categoryBudgetExceeded || isProtectedEditingCategory}
            >
              <Text style={commonStyles.buttonText}>
                {savingEntity
                  ? 'Saving...'
                  : editingId
                    ? `Update ${singularEntity(mode)}`
                    : `Add ${singularEntity(mode)}`}
              </Text>
            </Pressable>
            {editingId ? (
              <Pressable onPress={resetEntityForm} style={commonStyles.secondaryButtonCompact}>
                <Text style={commonStyles.secondaryButtonText}>Cancel edit</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard900]}>
          <Text style={commonStyles.sectionHeading}>
            {mode === 'accounts' ? `Accounts (${accounts.length})` : `Categories (${categories.length})`}
          </Text>
          {(mode === 'accounts'
            ? accounts
            : [...categories].sort((a, b) => {
                const aName = (a.name || '').trim().toLowerCase();
                const bName = (b.name || '').trim().toLowerCase();
                const rank = (name: string) => {
                  if (name === 'other') return 1;
                  if (name === 'income') return 2; // income below other
                  return 0;
                };
                const byRank = rank(aName) - rank(bName);
                if (byRank !== 0) return byRank;
                return aName.localeCompare(bName);
              })
          ).map((item) => {
            const isProtectedDefaultCategory =
              mode === 'categories' &&
              ['income', 'other'].includes(((item as Category).name || '').trim().toLowerCase());
            return (
            <View key={item.id} style={commonStyles.listRow}>
              <View style={commonStyles.listRowMain}>
                <Text style={commonStyles.label}>{item.name}</Text>
                <Text style={commonStyles.helperText}>
                  {'kind' in item
                    ? item.kind
                    : `${item.need_or_want.toUpperCase()} - Spend goal: $${Number(item.spend_goal || '0').toFixed(2)}`}
                </Text>
                {isProtectedDefaultCategory ? (
                  <Text style={commonStyles.helperText}>Default category (non-removable)</Text>
                ) : null}
              </View>
              <View style={commonStyles.listRowActions}>
                {!isProtectedDefaultCategory ? (
                  <Pressable
                    onPress={() =>
                      mode === 'accounts'
                        ? startEditAccount(item as Account)
                        : startEditCategory(item as Category)
                    }
                    style={commonStyles.secondaryButtonCompact}
                  >
                    <Text style={commonStyles.secondaryButtonText}>Edit</Text>
                  </Pressable>
                ) : null}
                {!isProtectedDefaultCategory ? (
                  <Pressable
                    onPress={() => removeEntity(item.id)}
                    style={commonStyles.secondaryButtonCompact}
                  >
                    <Text style={commonStyles.secondaryButtonText}>Delete</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            );
          })}
          {mode === 'accounts' && !accounts.length ? (
            <Text style={commonStyles.helperText}>No accounts yet.</Text>
          ) : null}
          {mode === 'categories' && !categories.length ? (
            <Text style={commonStyles.helperText}>No categories yet.</Text>
          ) : null}
        </View>

        <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard900]}>
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            style={({ pressed }) => [
              commonStyles.secondaryButton,
              pressed ? commonStyles.buttonPressed : null,
            ]}
          >
            <Text style={commonStyles.secondaryButtonText}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** normalizes money input into two decimal places */
function normalizeMoney(value: string): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return '0.00';
  return parsed.toFixed(2);
}

/** formats a js date as yyyy-mm-dd */
function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
