import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputBase,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';

function isSearchable(value) {
  return typeof value === 'string' || typeof value === 'number';
}

function compareValues(leftValue, rightValue, order) {
  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return order === 'asc' ? leftValue - rightValue : rightValue - leftValue;
  }

  const result = String(leftValue ?? '').localeCompare(
    String(rightValue ?? ''),
    'en',
    { numeric: true, sensitivity: 'base' },
  );

  return order === 'asc' ? result : -result;
}

function getRowKey(row) {
  return row.id || `${row.firstname}-${row.lastname}`;
}

function DataTableCard({ title, columns, rows, loading, error, onAdd }) {
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState(columns[0]?.key || '');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const normalizedSearch = search.toLowerCase();
  const startIndex = page * rowsPerPage;

  const handleExport = () => {
    // Filtrăm coloanele pentru a exclude butoanele (actions)
    const exportCols = columns.filter(col => col.key !== 'actions');
    
    // Generăm capul de tabel
    const headers = exportCols.map(col => col.label).join(',');
    
    // Generăm rândurile de date (escapăm ghilimelele pentru siguranță)
    const csvRows = rows.map(row => 
      exportCols.map(col => `"${String(row[col.key] || '').replace(/"/g, '""')}"`).join(',')
    );

    const blob = new Blob([[headers, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase()}_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRows = rows.filter((row) =>
    columns.some(({ key }) => {
      const value = row[key];

      return isSearchable(value) && String(value).toLowerCase().includes(normalizedSearch);
    }),
  );

  const sortedRows = [...filteredRows].sort((leftRow, rightRow) => {
    if (orderBy === 'actions') return 0;

    const leftValue = leftRow[orderBy];
    const rightValue = rightRow[orderBy];

    return compareValues(leftValue, rightValue, order);
  });

  const pagedRows = sortedRows.slice(startIndex, startIndex + rowsPerPage);

  function handleSort(key) {
    const column = columns.find((item) => item.key === key);
    if (column?.sortable === false) return;

    if (orderBy === key) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setOrderBy(key);
    setOrder('asc');
  }

  function handleSearch(value) {
    setSearch(value);
    setPage(0);
  }

  function handleRowsPerPageChange(event) {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  }

  return (
    <Paper className="table-card">
      <Box className="card-header">
        <Typography variant="h5">{title}</Typography>

        <Box sx={{ flexGrow: 1 }} />
        
        {onAdd && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ mr: 2 }}>
            Add New
          </Button>
        )}

        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} sx={{ mr: 2 }}>
          Export CSV
        </Button>

        <Box className="search-box">
          <SearchIcon color="action" />
          <InputBase
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search"
            className="search-input"
          />
          {search ? (
            <IconButton size="small" onClick={() => handleSearch('')}>
              <ClearIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Box className="loading-box">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer className="table-scroll">
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.sortable !== false ? (
                        <TableSortLabel
                          active={orderBy === column.key}
                          direction={orderBy === column.key ? order : 'asc'}
                          onClick={() => handleSort(column.key)}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {pagedRows.length ? (
                  pagedRows.map((row) => (
                    <TableRow key={getRowKey(row)}>
                      {columns.map((column) => (
                        <TableCell key={`${row.id}-${column.key}`}>
                          {row[column.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <Box className="empty-box">
                        <Typography color="text.secondary">
                          No matching rows.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={sortedRows.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </>
      )}
    </Paper>
  );
}

export default DataTableCard;
