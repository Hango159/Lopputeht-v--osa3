import { createTheme } from '@mui/material/styles';

export const trainerTheme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    background: {
      default: '#f4f6fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#263238',
      secondary: '#607d8b',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Segoe UI", sans-serif',
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxSizing: 'border-box',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          margin: '4px 12px',
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#fbfcff',
          color: '#455a64',
        },
      },
    },
  },
});
