import { colors, ColorPalette } from './colors';
import {
  fontSizes,
  fontWeights,
  typography,
  FontSizeScale,
  FontWeightScale,
  TypographyVariants,
} from './typography';
import {
  spacing,
  borderRadius,
  SpacingScale,
  BorderRadiusScale,
} from './spacing';

export interface AppTheme {
  colors: ColorPalette;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  fontSizes: FontSizeScale;
  fontWeights: FontWeightScale;
  typography: TypographyVariants;
}

export const theme: AppTheme = {
  colors,
  spacing,
  borderRadius,
  fontSizes,
  fontWeights,
  typography,
};

export default theme;

