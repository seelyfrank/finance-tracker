/**
 * File: react/project/app/(tabs)/transactions.tsx
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Transactions tab screen for listing, filtering, creating, and editing transaction records.
 */


import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import {
  createTransaction,
  deleteTransaction,
  getAccounts,
  getCategories,
  getProfiles,
  getTransactions,
  updateTransaction,
} from '@/src/api';
import type { Account, Category, Transaction } from '@/src/api/types';
import { formatMoney } from '@/src/formatMoney';
import { commonStyles, colors } from '@/src/theme';

const LOG_PAGE_SIZE = 20;

/** removes time so date comparisons stay day-based */
function stripTime(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** returns a new date offset by n days */
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** renders transaction form, filters, and log list */
export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logResults, setLogResults] = useState<Transaction[]>([]);
  const [logCount, setLogCount] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [filterTotalSent, setFilterTotalSent] = useState('0.00');
  const [filterTotalReceived, setFilterTotalReceived] = useState('0.00');
  const [filterNet, setFilterNet] = useState('0.00');

  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'sent' | 'received'>('sent');
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [webDateValue, setWebDateValue] = useState(formatDateForApi(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [comment, setComment] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [listMode, setListMode] = useState<'recent' | 'scheduled'>('recent');

  const [filterLogCategory, setFilterLogCategory] = useState('');
  const [filterLogAccount, setFilterLogAccount] = useState('');
  const [filterLogType, setFilterLogType] = useState<'' | 'sent' | 'received'>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState(() => formatDateForApi(stripTime(new Date())));
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  const [filterDateField, setFilterDateField] = useState<'from' | 'to'>('from');
  const [filterPickerDate, setFilterPickerDate] = useState<Date>(stripTime(new Date()));
  const [filterLogAccountOpen, setFilterLogAccountOpen] = useState(false);
  const [filterLogCategoryOpen, setFilterLogCategoryOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const logFiltersRef = useRef({
    filterLogCategory: '',
    filterLogAccount: '',
    filterLogType: '' as '' | 'sent' | 'received',
    filterDateFrom: '',
    filterDateTo: formatDateForApi(stripTime(new Date())),
  });
  logFiltersRef.current = {
    filterLogCategory,
    filterLogAccount,
    filterLogType,
    filterDateFrom,
    filterDateTo,
  };

  // remembering where we were when switching back to the tab
  const logPageRef = useRef(logPage);
  logPageRef.current = logPage;

  const selectedAccountLabel = useMemo(() => {
    const selected = accounts.find((account) => account.id === Number(accountId));
    return selected ? selected.name : 'Select account';
  }, [accounts, accountId]);

  const selectedCategoryLabel = useMemo(() => {
    const selected = categories.find((category) => category.id === Number(categoryId));
    return selected ? selected.name : 'Select category';
  }, [categories, categoryId]);

  const totalLogPages = useMemo(
    () => Math.max(1, Math.ceil(logCount / LOG_PAGE_SIZE)),
    [logCount],
  );

  const filterNetLabel = useMemo(() => formatSignedNetValue(filterNet), [filterNet]);

  const filterLogLabel = useMemo(() => {
    if (!filterLogCategory) return 'All categories';
    return categories.find((c) => c.id === Number(filterLogCategory))?.name ?? 'All categories';
  }, [categories, filterLogCategory]);
  const filterAccountLabel = useMemo(() => {
    if (!filterLogAccount) return 'All accounts';
    return accounts.find((a) => a.id === Number(filterLogAccount))?.name ?? 'All accounts';
  }, [accounts, filterLogAccount]);

  const fetchLog = useCallback(async (page: number) => {
    const f = logFiltersRef.current;
    setLogLoading(true);
    try {
      const res = await getTransactions({
        page,
        page_size: LOG_PAGE_SIZE,
        ...(f.filterLogCategory && { category: Number(f.filterLogCategory) }),
        ...(f.filterLogAccount && { account: Number(f.filterLogAccount) }),
        ...(f.filterLogType && { transaction_type: f.filterLogType }),
        ...(f.filterDateFrom && { date_from: f.filterDateFrom }),
        ...(f.filterDateTo && { date_to: f.filterDateTo }),
      });
      setLogResults(res.results);
      setLogCount(res.count);
      setLogPage(page);
      setFilterTotalSent(res.filter_total_sent);
      setFilterTotalReceived(res.filter_total_received);
      setFilterNet(res.filter_net);
    } finally {
      setLogLoading(false);
    }
  }, []);

  const loadFormData = useCallback(async () => {
    const [profilesRes, accountsRes, categoriesRes] = await Promise.all([
      getProfiles(),
      getAccounts(),
      getCategories(),
    ]);
    setAccounts(accountsRes);
    setCategories(categoriesRes);

    const profile = profilesRes[0] ?? null;
    if (profile?.default_account) {
      setAccountId(String(profile.default_account));
    } else if (accountsRes[0]) {
      setAccountId(String(accountsRes[0].id));
    }
    if (categoriesRes[0]) {
      setCategoryId(String(categoriesRes[0].id));
    }
  }, []);

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(''), 2200);
    return () => clearTimeout(timeout);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(''), 2600);
    return () => clearTimeout(timeout);
  }, [error]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          setError('');
          setLoading(true);
          await loadFormData();
          await fetchLog(logPageRef.current);
        } catch {
          setError('Could not load transaction form data.');
        } finally {
          setLoading(false);
        }
      })();
    }, [loadFormData, fetchLog]),
  );

/** resets form state back to add mode defaults */
  const resetForm = () => {
    setAmount('');
    setTransactionType('sent');
    const now = new Date();
    setSelectedDate(now);
    setWebDateValue(formatDateForApi(now));
    setShowDatePicker(false);
    setComment('');
    setEditingTransactionId(null);
  };

/** handles native date picker changes */
  const handleDateChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') return;
    if (nextDate) {
      setSelectedDate(nextDate);
      setWebDateValue(formatDateForApi(nextDate));
    }
  };

/** handles date input changes on web */
  const handleWebDateChange = (value: string) => {
    setWebDateValue(value);
    const parsed = parseDateFromApi(value);
    if (parsed) {
      setSelectedDate(parsed);
    }
  };

  const handleSubmit = async () => {
    if (!amount.trim()) {
      setError('Amount is required.');
      return;
    }
    if (!accountId) {
      setError('Account is required.');
      return;
    }
    if (!categoryId) {
      setError('Category is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        amount: normalizeMoney(amount),
        transaction_type: transactionType,
        account: Number(accountId),
        category: Number(categoryId),
        date: formatDateForApi(selectedDate),
        comment: comment.trim(),
      };

      if (editingTransactionId) {
        await updateTransaction(editingTransactionId, payload);
      } else {
        await createTransaction(payload);
      }

      if (editingTransactionId) {
        await fetchLog(logPage);
      } else {
        await fetchLog(1);
      }
      setSuccess(editingTransactionId ? 'Transaction updated.' : 'Transaction added.');
      resetForm();
    } catch {
      setError(
        `Could not ${editingTransactionId ? 'update' : 'add'} transaction. Check your values and try again.`,
      );
    } finally {
      setSaving(false);
    }
  };

/** fills the form with an existing transaction for edit */
  const startEditTransaction = (txn: Transaction) => {
    setEditingTransactionId(txn.id);
    setAmount(txn.amount);
    setTransactionType(txn.transaction_type);
    setAccountId(String(txn.account));
    setCategoryId(String(txn.category));
    const parsedDate = parseDateFromApi(txn.date) ?? new Date();
    setSelectedDate(parsedDate);
    setWebDateValue(formatDateForApi(parsedDate));
    setComment(txn.comment ?? '');
    setSuccess('');
    setError('');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

/** applies a quick preset for recent or scheduled lists */
  const applyListMode = (mode: 'recent' | 'scheduled') => {
    setListMode(mode);
    const today = stripTime(new Date());
    if (mode === 'recent') {
      setFilterDateFrom('');
      setFilterDateTo(formatDateForApi(today));
    } else {
      setFilterDateFrom(formatDateForApi(addDays(today, 1)));
      setFilterDateTo('');
    }
  };

/** validates log filters and reloads page one */
  const handleApplyFilters = () => {
    const fromRaw = filterDateFrom.trim();
    const toRaw = filterDateTo.trim();

    if (fromRaw) {
      if (!parseDateFromApi(fromRaw)) {
        setError('Log filter "From" date must be a valid YYYY-MM-DD date.');
        return;
      }
      if (fromRaw !== filterDateFrom) setFilterDateFrom(fromRaw);
    }

    if (toRaw) {
      if (!parseDateFromApi(toRaw)) {
        setError('Log filter "To" date must be a valid YYYY-MM-DD date.');
        return;
      }
      if (toRaw !== filterDateTo) setFilterDateTo(toRaw);
    }

    if (fromRaw && toRaw) {
      const fromDate = parseDateFromApi(fromRaw);
      const toDate = parseDateFromApi(toRaw);
      if (fromDate && toDate && fromDate > toDate) {
        setError('Log filter dates are invalid: "From" cannot be after "To".');
        return;
      }
    }

    setError('');
    void fetchLog(1);
  };

/** opens filter date picker for from/to field */
  const openFilterDatePicker = (field: 'from' | 'to') => {
    const currentValue = field === 'from' ? filterDateFrom : filterDateTo;
    const parsed = parseDateFromApi(currentValue);
    setFilterDateField(field);
    setFilterPickerDate(parsed ?? stripTime(new Date()));
    setShowFilterDatePicker(true);
  };

/** handles filter date picker changes */
  const handleFilterDateChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowFilterDatePicker(false);
    }
    if (event.type === 'dismissed' || !nextDate) return;
    setFilterPickerDate(nextDate);
    const formatted = formatDateForApi(nextDate);
    if (filterDateField === 'from') {
      setFilterDateFrom(formatted);
    } else {
      setFilterDateTo(formatted);
    }
  };

  const handleDeleteTransaction = async (txnId: number) => {
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('Are you sure you want to delete this transaction?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Delete transaction?',
              'Are you sure you want to delete this transaction?',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
              ],
              { cancelable: true },
            );
          });

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      const wasOnlyOnPage = logResults.length === 1;
      const pageBefore = logPage;
      await deleteTransaction(txnId);
      if (wasOnlyOnPage && pageBefore > 1) {
        await fetchLog(pageBefore - 1);
      } else {
        await fetchLog(logPage);
      }
      if (editingTransactionId === txnId) {
        resetForm();
      }
      setSuccess('Transaction deleted.');
    } catch {
      setError('Could not delete transaction.');
    }
  };

  return (
    <SafeAreaView style={commonStyles.screen} edges={['top', 'left', 'right']}>
      {success ? (
        <View style={[commonStyles.toastSuccess, { top: insets.top + 12 }]}>
          <Text style={commonStyles.toastSuccessText}>{success}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={[commonStyles.toastError, { top: insets.top + 12 }]}>
          <Text style={commonStyles.toastErrorText}>{error}</Text>
        </View>
      ) : null}
      <ScrollView ref={scrollRef} contentContainerStyle={commonStyles.scrollScreenContent}>
        <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard700, commonStyles.surfaceCardForm]}>
          <Text style={commonStyles.title}>{editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}</Text>
          <Text style={commonStyles.subtitle}>
            {editingTransactionId
              ? 'Update the selected transaction.'
              : 'Quickly log spending or incoming money.'}
          </Text>
          {loading ? <Text style={commonStyles.helperText}>Loading form data...</Text> : null}

          <View style={commonStyles.formAmountBlock}>
            <Text style={commonStyles.label}>Amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={commonStyles.formAmountInput}
              placeholder="0.00"
              placeholderTextColor={colors.textHelper}
            />
          </View>

          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Type</Text>
            <View style={commonStyles.pillRow}>
              <Pressable
                style={[
                  commonStyles.pill,
                  transactionType === 'sent' ? commonStyles.pillActive : null,
                ]}
                onPress={() => setTransactionType('sent')}
              >
                <Text
                  style={[
                    commonStyles.pillText,
                    transactionType === 'sent' ? commonStyles.pillTextActive : null,
                  ]}
                >
                  Sent
                </Text>
              </Pressable>
              <Pressable
                style={[
                  commonStyles.pill,
                  transactionType === 'received' ? commonStyles.pillActive : null,
                ]}
                onPress={() => setTransactionType('received')}
              >
                <Text
                  style={[
                    commonStyles.pillText,
                    transactionType === 'received' ? commonStyles.pillTextActive : null,
                  ]}
                >
                  Received
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Account</Text>
            <Pressable
              style={commonStyles.selectTrigger}
              onPress={() => setAccountMenuOpen((prev) => !prev)}
            >
              <Text style={commonStyles.selectTriggerText}>{selectedAccountLabel}</Text>
            </Pressable>
            {accountMenuOpen ? (
              <View style={commonStyles.borderedSurface}>
                {accounts.map((account) => (
                  <Pressable
                    key={account.id}
                    style={[
                      commonStyles.inlineMenuItem,
                      accountId === String(account.id) ? commonStyles.inlineMenuItemActive : null,
                    ]}
                    onPress={() => {
                      setAccountId(String(account.id));
                      setAccountMenuOpen(false);
                    }}
                  >
                    <Text style={commonStyles.inlineMenuItemText}>{account.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Category</Text>
            <Pressable
              style={commonStyles.selectTrigger}
              onPress={() => setCategoryMenuOpen((prev) => !prev)}
            >
              <Text style={commonStyles.selectTriggerText}>{selectedCategoryLabel}</Text>
            </Pressable>
            {categoryMenuOpen ? (
              <View style={commonStyles.borderedSurface}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[
                      commonStyles.inlineMenuItem,
                      categoryId === String(category.id) ? commonStyles.inlineMenuItemActive : null,
                    ]}
                    onPress={() => {
                      setCategoryId(String(category.id));
                      setCategoryMenuOpen(false);
                    }}
                  >
                    <Text style={commonStyles.inlineMenuItemText}>{category.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Date</Text>
            {Platform.OS === 'web' ? (
              <>
                <TextInput
                  value={webDateValue}
                  onChangeText={handleWebDateChange}
                  style={commonStyles.selectTrigger}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textHelper}
                  autoCapitalize="none"
                  autoCorrect={false}
                  cursorColor={colors.textPrimary}
                />
                <Text style={commonStyles.helperText}>Use YYYY-MM-DD format on web.</Text>
              </>
            ) : (
              <>
                <Pressable style={commonStyles.selectTrigger} onPress={() => setShowDatePicker(true)}>
                  <Text style={commonStyles.selectTriggerText}>{formatDateForApi(selectedDate)}</Text>
                </Pressable>
                {showDatePicker ? (
                  <View style={commonStyles.borderedSurfacePadded}>
                    <DateTimePicker
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      value={selectedDate}
                      onChange={handleDateChange}
                      maximumDate={new Date(2100, 11, 31)}
                      minimumDate={new Date(2000, 0, 1)}
                      textColor={colors.textPrimary}
                      themeVariant="dark"
                    />
                    {Platform.OS === 'ios' ? (
                      <Pressable
                        style={commonStyles.secondaryButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={commonStyles.secondaryButtonText}>Done</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                <Text style={commonStyles.helperText}>Defaults to today.</Text>
              </>
            )}
          </View>

          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Comment (optional)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              style={commonStyles.multilineInput}
              multiline
              placeholder="Add details (optional)"
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={saving || loading}
            style={({ pressed }) => [
              commonStyles.button,
              pressed ? commonStyles.buttonPressed : null,
              saving || loading ? commonStyles.buttonDisabled : null,
            ]}
          >
            <Text style={commonStyles.buttonText}>
              {saving
                ? editingTransactionId
                  ? 'Saving...'
                  : 'Adding...'
                : editingTransactionId
                  ? 'Save changes'
                  : 'Add transaction'}
            </Text>
          </Pressable>
          {editingTransactionId ? (
            <Pressable onPress={resetForm} style={commonStyles.secondaryButton}>
              <Text style={commonStyles.secondaryButtonText}>Cancel edit</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard700, commonStyles.surfaceCardForm]}>
          <Text style={commonStyles.sectionHeading}>Transaction log</Text>
          <Text style={commonStyles.helperText}>
            Presets: Recent is through today. Scheduled is from tomorrow onward. Adjust the date
            fields for a custom range.
          </Text>
          <View style={commonStyles.pillRow}>
            <Pressable
              style={[commonStyles.pill, listMode === 'recent' ? commonStyles.pillActive : null]}
              onPress={() => applyListMode('recent')}
            >
              <Text style={[commonStyles.pillText, listMode === 'recent' ? commonStyles.pillTextActive : null]}>
                Recent
              </Text>
            </Pressable>
            <Pressable
              style={[commonStyles.pill, listMode === 'scheduled' ? commonStyles.pillActive : null]}
              onPress={() => applyListMode('scheduled')}
            >
              <Text style={[commonStyles.pillText, listMode === 'scheduled' ? commonStyles.pillTextActive : null]}>
                Scheduled
              </Text>
            </Pressable>
          </View>

          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Log filter — account</Text>
            <Pressable
              style={commonStyles.selectTrigger}
              onPress={() => setFilterLogAccountOpen((prev) => !prev)}
            >
              <Text style={commonStyles.selectTriggerText}>{filterAccountLabel}</Text>
            </Pressable>
            {filterLogAccountOpen ? (
              <View style={commonStyles.borderedSurface}>
                <Pressable
                  style={[commonStyles.inlineMenuItem, !filterLogAccount ? commonStyles.inlineMenuItemActive : null]}
                  onPress={() => {
                    setFilterLogAccount('');
                    setFilterLogAccountOpen(false);
                  }}
                >
                  <Text style={commonStyles.inlineMenuItemText}>All accounts</Text>
                </Pressable>
                {accounts.map((account) => (
                  <Pressable
                    key={account.id}
                    style={[
                      commonStyles.inlineMenuItem,
                      filterLogAccount === String(account.id) ? commonStyles.inlineMenuItemActive : null,
                    ]}
                    onPress={() => {
                      setFilterLogAccount(String(account.id));
                      setFilterLogAccountOpen(false);
                    }}
                  >
                    <Text style={commonStyles.inlineMenuItemText}>{account.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Log filter — category</Text>
            <Pressable
              style={commonStyles.selectTrigger}
              onPress={() => setFilterLogCategoryOpen((prev) => !prev)}
            >
              <Text style={commonStyles.selectTriggerText}>{filterLogLabel}</Text>
            </Pressable>
            {filterLogCategoryOpen ? (
              <View style={commonStyles.borderedSurface}>
                <Pressable
                  style={[commonStyles.inlineMenuItem, !filterLogCategory ? commonStyles.inlineMenuItemActive : null]}
                  onPress={() => {
                    setFilterLogCategory('');
                    setFilterLogCategoryOpen(false);
                  }}
                >
                  <Text style={commonStyles.inlineMenuItemText}>All categories</Text>
                </Pressable>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[
                      commonStyles.inlineMenuItem,
                      filterLogCategory === String(category.id) ? commonStyles.inlineMenuItemActive : null,
                    ]}
                    onPress={() => {
                      setFilterLogCategory(String(category.id));
                      setFilterLogCategoryOpen(false);
                    }}
                  >
                    <Text style={commonStyles.inlineMenuItemText}>{category.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={commonStyles.formField}>
            <Text style={commonStyles.label}>Log filter — type</Text>
            <View style={commonStyles.pillRow}>
              <Pressable
                style={[
                  commonStyles.pill,
                  !filterLogType ? commonStyles.pillActive : null,
                ]}
                onPress={() => setFilterLogType('')}
              >
                <Text
                  style={[commonStyles.pillText, !filterLogType ? commonStyles.pillTextActive : null]}
                >
                  All
                </Text>
              </Pressable>
              <Pressable
                style={[
                  commonStyles.pill,
                  filterLogType === 'sent' ? commonStyles.pillActive : null,
                ]}
                onPress={() => setFilterLogType('sent')}
              >
                <Text
                  style={[
                    commonStyles.pillText,
                    filterLogType === 'sent' ? commonStyles.pillTextActive : null,
                  ]}
                >
                  Sent
                </Text>
              </Pressable>
              <Pressable
                style={[
                  commonStyles.pill,
                  filterLogType === 'received' ? commonStyles.pillActive : null,
                ]}
                onPress={() => setFilterLogType('received')}
              >
                <Text
                  style={[
                    commonStyles.pillText,
                    filterLogType === 'received' ? commonStyles.pillTextActive : null,
                  ]}
                >
                  Received
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={commonStyles.logFiltersRow}>
            <View style={commonStyles.logFilterField}>
              <Text style={commonStyles.label}>From</Text>
              {Platform.OS === 'web' ? (
                <TextInput
                  value={filterDateFrom}
                  onChangeText={setFilterDateFrom}
                  style={commonStyles.logFilterDateInput}
                  placeholder="YYYY-MM-DD (optional)"
                  placeholderTextColor={colors.textHelper}
                  autoCapitalize="none"
                  autoCorrect={false}
                  cursorColor={colors.textPrimary}
                />
              ) : (
                <Pressable
                  style={commonStyles.selectTrigger}
                  onPress={() => openFilterDatePicker('from')}
                >
                  <Text style={commonStyles.selectTriggerText}>
                    {filterDateFrom || 'Select date (optional)'}
                  </Text>
                </Pressable>
              )}
            </View>
            <View style={commonStyles.logFilterField}>
              <Text style={commonStyles.label}>To</Text>
              {Platform.OS === 'web' ? (
                <TextInput
                  value={filterDateTo}
                  onChangeText={setFilterDateTo}
                  style={commonStyles.logFilterDateInput}
                  placeholder="YYYY-MM-DD (optional)"
                  placeholderTextColor={colors.textHelper}
                  autoCapitalize="none"
                  autoCorrect={false}
                  cursorColor={colors.textPrimary}
                />
              ) : (
                <Pressable
                  style={commonStyles.selectTrigger}
                  onPress={() => openFilterDatePicker('to')}
                >
                  <Text style={commonStyles.selectTriggerText}>
                    {filterDateTo || 'Select date (optional)'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
          {Platform.OS !== 'web' && showFilterDatePicker ? (
            <View style={commonStyles.borderedSurfacePadded}>
              <DateTimePicker
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                value={filterPickerDate}
                onChange={handleFilterDateChange}
                maximumDate={new Date(2100, 11, 31)}
                minimumDate={new Date(2000, 0, 1)}
                textColor={colors.textPrimary}
                themeVariant="dark"
              />
              <View style={commonStyles.actionRow}>
                <Pressable
                  style={[commonStyles.secondaryButtonCompact, { flex: 1 }]}
                  onPress={() => {
                    if (filterDateField === 'from') {
                      setFilterDateFrom('');
                    } else {
                      setFilterDateTo('');
                    }
                    setShowFilterDatePicker(false);
                  }}
                >
                  <Text style={commonStyles.secondaryButtonText}>Clear</Text>
                </Pressable>
                {Platform.OS === 'ios' ? (
                  <Pressable
                    style={[commonStyles.secondaryButtonCompact, { flex: 1 }]}
                    onPress={() => setShowFilterDatePicker(false)}
                  >
                    <Text style={commonStyles.secondaryButtonText}>Done</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}
          <Pressable
            onPress={handleApplyFilters}
            disabled={logLoading}
            style={({ pressed }) => [
              commonStyles.secondaryButton,
              pressed ? commonStyles.buttonPressed : null,
              logLoading ? commonStyles.buttonDisabled : null,
            ]}
          >
            <Text style={commonStyles.secondaryButtonText}>
              {logLoading ? 'Applying...' : 'Apply filters'}
            </Text>
          </Pressable>

          <View style={commonStyles.filterTotalsSection}>
            <Text style={commonStyles.filterTotalsTitle}>Filtered total (all pages)</Text>
            <Text style={commonStyles.filterNetValue}>{filterNetLabel}</Text>
            <Text style={commonStyles.helperText}>
              Net = received − sent. Received {formatMoney(filterTotalReceived)} · Sent{' '}
              {formatMoney(filterTotalSent)}
            </Text>
          </View>

          {logLoading ? <Text style={commonStyles.helperText}>Loading list…</Text> : null}
          {!logLoading && !logResults.length ? (
            <Text style={commonStyles.helperText}>No transactions for these filters.</Text>
          ) : null}
          {!logLoading && logResults.length > 0 ? (
            <>
              {logResults.map((txn) => {
                const accountName =
                  accounts.find((account) => account.id === txn.account)?.name ?? 'Unknown account';
                const categoryName =
                  categories.find((category) => category.id === txn.category)?.name ??
                  'Unknown category';
                const signedPrefix = txn.transaction_type === 'sent' ? '-' : '+';
                return (
                  <View key={txn.id} style={commonStyles.listRow}>
                    <View style={commonStyles.listRowMain}>
                      <Text style={commonStyles.label}>
                        {categoryName} - {accountName}
                      </Text>
                      <Text style={commonStyles.helperText}>
                        {txn.date} • {txn.transaction_type === 'sent' ? 'Sent' : 'Received'}
                      </Text>
                      {txn.comment ? <Text style={commonStyles.helperText}>{txn.comment}</Text> : null}
                    </View>
                    <Text style={commonStyles.valueEmphasis}>
                      {signedPrefix}
                      {formatMoney(txn.amount)}
                    </Text>
                    <View style={commonStyles.listRowActions}>
                      <Pressable
                        onPress={() => startEditTransaction(txn)}
                        style={commonStyles.secondaryButtonCompactDense}
                      >
                        <Text style={commonStyles.secondaryButtonText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void handleDeleteTransaction(txn.id)}
                        style={commonStyles.secondaryButtonCompactDense}
                      >
                        <Text style={commonStyles.secondaryButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              <View style={commonStyles.paginationRow}>
                <Pressable
                  style={({ pressed }) => [
                    commonStyles.paginationButton,
                    logPage <= 1 ? commonStyles.paginationButtonDisabled : null,
                    pressed && logPage > 1 ? commonStyles.buttonPressed : null,
                  ]}
                  disabled={logPage <= 1}
                  onPress={() => void fetchLog(logPage - 1)}
                >
                  <Text
                    style={[
                      commonStyles.paginationButtonText,
                      logPage <= 1 ? commonStyles.paginationButtonTextDisabled : null,
                    ]}
                  >
                    Previous
                  </Text>
                </Pressable>
                <Text style={commonStyles.paginationInfo}>
                  Page {logPage} of {totalLogPages} · {logCount} total
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    commonStyles.paginationButton,
                    logPage >= totalLogPages ? commonStyles.paginationButtonDisabled : null,
                    pressed && logPage < totalLogPages ? commonStyles.buttonPressed : null,
                  ]}
                  disabled={logPage >= totalLogPages}
                  onPress={() => void fetchLog(logPage + 1)}
                >
                  <Text
                    style={[
                      commonStyles.paginationButtonText,
                      logPage >= totalLogPages ? commonStyles.paginationButtonTextDisabled : null,
                    ]}
                  >
                    Next
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
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

/** show an explicit + for positive. */
/** formats net totals with explicit sign */
function formatSignedNetValue(value: string): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return '$0.00';
  const abs = `$${Math.abs(parsed).toFixed(2)}`;
  if (parsed > 0) return `+${abs}`;
  if (parsed < 0) return `-${abs}`;
  return abs;
}

/** parses a yyyy-mm-dd string into a valid date */
function parseDateFromApi(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}
