/**
 * File: react/project/app/(tabs)/_layout.tsx
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Bottom-tab navigator layout and tab icon wiring for the primary app screens.
 */


import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const tabBarItemEqualWidth: ViewStyle = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 0,
  minWidth: 0,
  justifyContent: 'center',
  ...(Platform.OS === 'web' ? ({ maxWidth: 'none' } as unknown as ViewStyle) : {}),
};

/** sets up the bottom tab navigator and icons */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const tabBottomPadding = Math.max(insets.bottom - 6, 4);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.text,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        headerShown: false,
        tabBarItemStyle: [
          tabBarItemEqualWidth,
          {
            paddingTop: 2,
            paddingBottom: tabBottomPadding,
            marginBottom: -tabBottomPadding,
          },
        ],
        tabBarStyle: {
          width: '100%',
          maxWidth: '100%',
          height: 50 + tabBottomPadding,
          paddingTop: 0,
          paddingBottom: 0,
          backgroundColor: Colors.dark.background,
          borderTopColor: '#0f2d3b',
        },
        tabBarLabelStyle: {
          textAlign: 'center',
          fontSize: 12,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarActiveBackgroundColor: '#0b2533',
        tabBarBadgeStyle: {
          backgroundColor: theme.tint,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={23} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color }) => <IconSymbol size={23} name="list.bullet.rectangle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={23} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
