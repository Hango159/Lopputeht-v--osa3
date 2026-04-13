import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddTaskIcon from '@mui/icons-material/AddTask';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Toolbar,
  Typography,
} from '@mui/material';
import DataTableCard from './DataTableCard';

const drawerWidth = 220;
const API_BASE = 'https://customer-rest-service-frontend-personaltrainer.2.rahtiapp.fi/api';

const navItems = [
  { key: 'customers', label: 'Customers', icon: <PeopleOutlinedIcon /> },
  { key: 'trainings', label: 'Trainings', icon: <DirectionsRunIcon /> },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: <CalendarTodayOutlinedIcon />,
  },
];

const customerColumns = [
  { key: 'firstname', label: 'First name' },
  { key: 'lastname', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'streetaddress', label: 'Address' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'city', label: 'City' },
  { key: 'actions', label: 'Actions', sortable: false },
];

const trainingColumns = [
  { key: 'date', label: 'Date' },
  { key: 'activity', label: 'Activity' },
  { key: 'duration', label: 'Duration' },
  { key: 'customer', label: 'Customer' },
  { key: 'email', label: 'Email' },
  { key: 'city', label: 'City' },
  { key: 'actions', label: 'Actions', sortable: false },
];

const emptyCustomerForm = {
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  streetaddress: '',
  postcode: '',
  city: '',
};

const emptyTrainingForm = {
  date: '',
  activity: '',
  duration: '',
};

function DashboardLayout({
  view,
  onViewChange,
  customers,
  trainings,
  loading,
  error,
  refresh,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const isTrainingsView = view === 'trainings';
  const isCalendarView = view === 'calendar';

  // Transformăm antrenamentele în formatul acceptat de FullCalendar
  const calendarEvents = trainings.map(t => ({
    title: `${t.activity} / ${getCustomerName(t.customer)}`,
    start: t.date,
    end: new Date(new Date(t.date).getTime() + t.duration * 60000).toISOString(),
  }));

  const handleOpenCustomer = (customer = null) => {
    setSelectedItem(customer);
    setFormData(customer || emptyCustomerForm);
    setCustomerDialogOpen(true);
  };

  const handleOpenTraining = (customer) => {
    setSelectedItem(customer);
    setFormData(emptyTrainingForm);
    setTrainingDialogOpen(true);
  };

  const handleOpenDelete = (item, type) => {
    setSelectedItem({ ...item, type });
    setDeleteConfirmOpen(true);
  };

  const handleFieldChange = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const toggleSidebar = () => {
    setSidebarOpen((open) => !open);
  };

  const closeCustomerDialog = () => setCustomerDialogOpen(false);
  const closeTrainingDialog = () => setTrainingDialogOpen(false);
  const closeDeleteDialog = () => setDeleteConfirmOpen(false);

  const runRequest = async (url, options, onSuccess) => {
    try {
      const response = await fetch(url, options);

      if (!response.ok) return;

      onSuccess();
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const saveCustomer = async () => {
    if (!formData.firstname || !formData.lastname || !formData.email) {
      alert('Please fill in the required fields (Name and Email).');
      return;
    }

    const url = selectedItem ? selectedItem._links.self.href : `${API_BASE}/customers`;
    const method = selectedItem ? 'PUT' : 'POST';

    await runRequest(
      url,
      {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      },
      closeCustomerDialog,
    );
  };

  const saveTraining = async () => {
    if (!formData.date || !formData.activity || !formData.duration) {
      alert('Please fill in all training details.');
      return;
    }

    const payload = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      customer: selectedItem._links.self.href,
    };

    await runRequest(
      `${API_BASE}/trainings`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      closeTrainingDialog,
    );
  };

  const deleteItem = async () => {
    if (!selectedItem) return;

    const isCustomer = selectedItem.type === 'customer';
    const url = isCustomer
      ? selectedItem._links.self.href
      : `${API_BASE}/trainings/${selectedItem.id}`;

    await runRequest(url, { method: 'DELETE' }, closeDeleteDialog);
  };

  const pageConfig =
    isTrainingsView
      ? {
          title: 'Trainings',
          columns: trainingColumns,
          onAdd: null, // Harjoitukset lisätään asiakkaan kautta
          rows: trainings.map((training) => ({
            id: training.id,
            date: formatDateTime(training.date),
            activity: training.activity,
            duration: `${training.duration} min`,
            customer: getCustomerName(training.customer),
            email: training.customer?.email || '',
            city: training.customer?.city || '',
            actions: (
              <IconButton size="small" color="error" onClick={() => handleOpenDelete(training, 'training')}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )
          })),
        }
      : {
          title: 'Customers',
          columns: customerColumns,
          onAdd: () => handleOpenCustomer(),
          rows: customers.map((customer) => ({
            id: customer._links?.self?.href || customer.email,
            ...customer,
            actions: (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Edit Customer">
                  <IconButton size="small" onClick={() => handleOpenCustomer(customer)}><EditIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Add Training">
                  <IconButton size="small" color="primary" onClick={() => handleOpenTraining(customer)}><AddTaskIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Delete Customer">
                  <IconButton size="small" color="error" onClick={() => handleOpenDelete(customer, 'customer')}><DeleteIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Stack>
            )
          })),
        };

  return (
    <Box className="dashboard-shell">
      {sidebarOpen && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
            },
          }}
          PaperProps={{ className: 'sidebar-paper' }}
        >
          <Toolbar className="sidebar-toolbar" />
          <List sx={{ pt: 2 }}>
            {navItems.map((item) => (
              <ListItemButton
                key={item.key}
                selected={view === item.key}
                onClick={() => !item.disabled && onViewChange(item.key)}
                disabled={item.disabled}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      )}

      <Box className="main-panel">
        <AppBar position="sticky" className="topbar">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              sx={{ mr: 1 }}
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Hide menu' : 'Show menu'}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">PersonalTrainer</Typography>
            <Box className="toolbar-spacer" />
            <IconButton color="inherit" onClick={refresh}>
              <RefreshRoundedIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box className="page-wrap">
          {isCalendarView ? (
            <Paper sx={{ p: 2, height: '80vh' }}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={calendarEvents}
                height="100%"
              />
            </Paper>
          ) : (
            <DataTableCard
              key={view}
              title={pageConfig.title}
              columns={pageConfig.columns}
              rows={pageConfig.rows}
              loading={loading}
              error={error}
              onAdd={pageConfig.onAdd}
            />
          )}
        </Box>
      </Box>

      {/* Customer Add/Edit Dialog */}
      <Dialog open={customerDialogOpen} onClose={closeCustomerDialog} fullWidth maxWidth="sm">
        <DialogTitle>{selectedItem ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="First Name" fullWidth value={formData.firstname || ''} onChange={handleFieldChange('firstname')} />
              <TextField label="Last Name" fullWidth value={formData.lastname || ''} onChange={handleFieldChange('lastname')} />
            </Stack>
            <TextField label="Email" fullWidth value={formData.email || ''} onChange={handleFieldChange('email')} />
            <TextField label="Phone" fullWidth value={formData.phone || ''} onChange={handleFieldChange('phone')} />
            <TextField label="Address" fullWidth value={formData.streetaddress || ''} onChange={handleFieldChange('streetaddress')} />
            <Stack direction="row" spacing={2}>
              <TextField label="Postcode" fullWidth value={formData.postcode || ''} onChange={handleFieldChange('postcode')} />
              <TextField label="City" fullWidth value={formData.city || ''} onChange={handleFieldChange('city')} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCustomerDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveCustomer}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Training Dialog */}
      <Dialog open={trainingDialogOpen} onClose={closeTrainingDialog} fullWidth maxWidth="xs">
        <DialogTitle>Add Training for {selectedItem ? `${selectedItem.firstname} ${selectedItem.lastname}` : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Date and Time"
              type="datetime-local"
              fullWidth
              variant="outlined"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              InputLabelProps={{ 
                shrink: true, // Forțează eticheta să stea sus mereu
              }}
              value={formData.date || ''}
              onChange={handleFieldChange('date')}
            />
            <TextField label="Activity" fullWidth value={formData.activity || ''} onChange={handleFieldChange('activity')} />
            <TextField label="Duration (min)" type="number" fullWidth value={formData.duration || ''} onChange={handleFieldChange('duration')} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTrainingDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveTraining}>Add Training</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {selectedItem?.type}? 
            {selectedItem?.type === 'customer' && " This will also delete all their training sessions."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteItem}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function getCustomerName(customer) {
  return `${customer?.firstname || ''} ${customer?.lastname || ''}`.trim();
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export default DashboardLayout;
