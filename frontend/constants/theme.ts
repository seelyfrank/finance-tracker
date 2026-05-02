/**
 * File: react/project/constants/theme.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Theme constants used by app UI components for colors and spacing.
 */


import { Platform } from 'react-native';

const tintColorLight = '#468189';
const tintColorDark = '#9dbebb';

export const Colors = {
  light: {
    text: '#1a2f38',
    background: '#f4e9cd',
    tint: tintColorLight,
    icon: '#6f8f8b',
    tabIconDefault: '#6f8f8b',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f4e9cd',
    background: '#031926',
    tint: tintColorDark,
    icon: '#77aca2',
    tabIconDefault: '#77aca2',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
