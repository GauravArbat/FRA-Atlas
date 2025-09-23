import { createTheme, ThemeOptions } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// India.gov.in-inspired palette
const brand = {
  // Primary Teal (60%)
  tealMain: '#00695c',
  tealLight: '#4db6ac',
  tealDark: '#004d40',
  // Secondary Amber (25%)
  amberMain: '#ffc107',
  amberLight: '#ffecb3',
  amberDark: '#ff8f00',
  // Accent Purple (15%)
  purpleMain: '#7b1fa2',
  purpleLight: '#ba68c8',
  purpleDark: '#4a148c',
  textPrimary: '#1b1b27',
  headerGray: '#f7f7f7',
  black: '#000000',
};

const neutral = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

const typography = {
  fontFamily: [
    'Inter',
    'Roboto',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.25 },
  h2: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3 },
  h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
  h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.35 },
  h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
  h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
  subtitle1: { fontSize: '0.95rem', fontWeight: 500 },
  subtitle2: { fontSize: '0.85rem', fontWeight: 500 },
  body1: { fontSize: '0.95rem', lineHeight: 1.6 },
  body2: { fontSize: '0.85rem', lineHeight: 1.5 },
  button: { fontSize: '0.85rem', fontWeight: 600, textTransform: 'none' as const },
  caption: { fontSize: '0.75rem' },
  overline: { fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const },
};

const shadows = Array(25).fill('none') as any;
shadows[1] = '0 1px 0 rgba(0,0,0,0.06)';
shadows[2] = '0 1px 2px rgba(0,0,0,0.08)';

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: brand.tealMain,
      light: brand.tealLight,
      dark: brand.tealDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brand.amberMain,
      light: brand.amberLight,
      dark: brand.amberDark,
      contrastText: '#000000',
    },
    error: { main: '#c62828', light: '#ef9a9a', dark: '#b71c1c' },
    warning: { main: brand.amberMain, light: brand.amberLight, dark: brand.amberDark },
    info: { main: brand.purpleMain, light: brand.purpleLight, dark: brand.purpleDark },
    success: { main: brand.tealLight, light: '#80cbc4', dark: brand.tealMain },
    grey: neutral as any,
    background: { default: brand.headerGray, paper: '#ffffff' },
    text: { primary: brand.textPrimary, secondary: '#424242', disabled: neutral[500] },
    divider: alpha(brand.textPrimary, 0.12),
    action: {
      active: '#424242',
      hover: alpha(brand.tealMain, 0.04),
      selected: alpha(brand.tealMain, 0.08),
      disabled: neutral[400],
      disabledBackground: neutral[100],
    },
  },
  typography,
  shadows,
  shape: { borderRadius: 4 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${neutral[300]} ${neutral[100]}`,
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-track': { background: neutral[100] },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: neutral[300],
            borderRadius: 4,
            '&:hover': { backgroundColor: neutral[400] },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 4, textTransform: 'none', fontWeight: 600, padding: '8px 16px', boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        contained: { '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiCard: { styleOverrides: { root: { borderRadius: 4, boxShadow: 'none', border: `1px solid ${alpha(brand.textPrimary, 0.12)}` } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' }, elevation1: { boxShadow: shadows[1] }, elevation2: { boxShadow: shadows[2] }, elevation3: { boxShadow: shadows[2] } } },
    MuiAppBar: { styleOverrides: { root: { backgroundColor: '#ffffff', color: brand.textPrimary, boxShadow: 'none', borderBottom: `1px solid ${alpha(brand.textPrimary, 0.12)}` } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: '#ffffff', borderRight: `1px solid ${alpha(brand.textPrimary, 0.12)}`, marginTop: '24px', marginLeft: '8px' } } },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          margin: '2px 8px',
          '&:hover': { backgroundColor: alpha(brand.tealMain, 0.06) },
          '&.Mui-selected': { backgroundColor: alpha(brand.tealMain, 0.12), '&:hover': { backgroundColor: alpha(brand.tealMain, 0.16) } },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 2, fontWeight: 600 } } },
    MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } },
    MuiSelect: { styleOverrides: { root: { borderRadius: 2 } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 4, boxShadow: 'none', border: `1px solid ${alpha(brand.textPrimary, 0.12)}` } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 4, boxShadow: 'none', border: `1px solid ${alpha(brand.textPrimary, 0.12)}` } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: neutral[800], borderRadius: 2, fontSize: '0.75rem', fontWeight: 500 } } },
    MuiFab: { styleOverrides: { root: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } } } },
  },
};

export const professionalTheme = createTheme(themeOptions);

export const professionalDarkTheme = createTheme({
  ...themeOptions,
  palette: {
    ...themeOptions.palette,
    mode: 'dark',
    primary: { main: brand.tealLight, light: '#80cbc4', dark: brand.tealMain, contrastText: '#ffffff' },
    secondary: { main: brand.amberLight, light: '#fff3c4', dark: brand.amberMain, contrastText: '#000000' },
    background: { default: '#0f1419', paper: '#141a22' },
    text: { primary: '#e6e8eb', secondary: '#b0b8c1', disabled: '#7a8592' },
    divider: alpha('#e6e8eb', 0.12),
    action: { active: '#b0b8c1', hover: alpha(brand.tealLight, 0.08), selected: alpha(brand.tealLight, 0.12), disabled: '#7a8592', disabledBackground: '#1f2732' },
  },
  components: {
    ...themeOptions.components,
    MuiAppBar: { styleOverrides: { root: { backgroundColor: '#141a22', color: '#e6e8eb', boxShadow: 'none', borderBottom: `1px solid ${alpha('#e6e8eb', 0.12)}` } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: '#141a22', borderRight: `1px solid ${alpha('#e6e8eb', 0.12)}` } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 4, boxShadow: 'none', border: `1px solid ${alpha('#e6e8eb', 0.12)}`, backgroundColor: '#141a22' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#141a22' } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 4, boxShadow: 'none', border: `1px solid ${alpha('#e6e8eb', 0.12)}`, backgroundColor: '#141a22' } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 4, boxShadow: 'none', border: `1px solid ${alpha('#e6e8eb', 0.12)}`, backgroundColor: '#141a22' } } },
  },
});

export default professionalTheme;
