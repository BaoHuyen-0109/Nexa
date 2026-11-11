import { TextStyle } from 'react-native';

export interface FontSizeScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface FontWeightScale {
  regular: TextStyle['fontWeight'];
  medium: TextStyle['fontWeight'];
  semibold: TextStyle['fontWeight'];
  bold: TextStyle['fontWeight'];
}

export interface TypographyVariants {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  subtitle: TextStyle;
  body: TextStyle;
  bodySmall: TextStyle;
  caption: TextStyle;
  button: TextStyle;
  label: TextStyle;
}

export const fontSizes: FontSizeScale = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const fontWeights: FontWeightScale = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const typography: TypographyVariants = {
  h1: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: 32,
  },
  h2: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: 28,
  },
  h3: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: 22,
  },
  body: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: 16,
  },
  button: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: 20,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: 18,
  },
};

