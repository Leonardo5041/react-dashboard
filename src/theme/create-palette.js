import { common } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import { error, indigo, info, neutral, success, warning } from './colors';

export function createPalette(darkMode) {
  return {
    action: {
      active: neutral[500],
      disabled: alpha(neutral[900], 0.38),
      disabledBackground: alpha(neutral[900], 0.12),
      focus: alpha(neutral[900], 0.16),
      hover: alpha(neutral[900], 0.04),
      selected: alpha(neutral[900], 0.12)
    },
    background: {
      default: (darkMode) ? neutral[700] : common.white,
      paper: (darkMode) ? neutral[900] : common.white,
    },
    divider: (darkMode) ? alpha(neutral[300], 0.12) : '#F2F4F7',
    error,
    info,
    mode: (darkMode) ? 'dark' : 'light',
    neutral: (darkMode) ? neutral[500] : neutral,
    primary: indigo,
    success,
    text: {
      primary: (darkMode) ? neutral[50] : neutral[900],
      secondary: (darkMode) ? neutral[100] : neutral[500],
      disabled: (darkMode )? alpha(neutral[300], 0.38) : alpha(neutral[900], 0.38),
    },
    warning
  };
}
