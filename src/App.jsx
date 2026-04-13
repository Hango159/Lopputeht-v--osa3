import { useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import DashboardLayout from './components/DashboardLayout';
import useTrainerData from './hooks/useTrainerData';
import { trainerTheme } from './theme';
import './App.css';

function App() {
  const [view, setView] = useState('customers');
  const trainerData = useTrainerData();

  return (
    <ThemeProvider theme={trainerTheme}>
      <CssBaseline />
      <DashboardLayout
        view={view}
        onViewChange={setView}
        {...trainerData}
      />
    </ThemeProvider>
  );
}

export default App;
