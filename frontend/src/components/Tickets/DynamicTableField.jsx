import React from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const DynamicTableField = ({ headers = [], value = [], onChange, required, error, helperText, label }) => {
  const rows = Array.isArray(value) ? value : [];
  const safeHeaders = Array.isArray(headers) ? headers : [];

  const handleCellChange = (rowIndex, colKey, cellValue) => {
    const next = rows.map((row, i) =>
      i === rowIndex ? { ...row, [colKey]: cellValue } : row
    );
    onChange(next);
  };

  const handleAddRow = () => {
    const newRow = {};
    safeHeaders.forEach((h) => (newRow[h] = ''));
    onChange([...rows, newRow]);
  };

  const handleRemoveRow = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body2" sx={{ mb: 1 }} required={required}>
          {label}
        </Typography>
      )}
      <Paper variant="outlined" sx={{ overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {safeHeaders.map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
              <TableCell width={80}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {safeHeaders.map((col) => (
                  <TableCell key={col}>
                    <TextField
                      size="small"
                      fullWidth
                      value={row[col] ?? ''}
                      onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                      variant="standard"
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <IconButton size="small" onClick={() => handleRemoveRow(rowIndex)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Button size="small" startIcon={<AddIcon />} onClick={handleAddRow} sx={{ mt: 1 }}>
        Adicionar linha
      </Button>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {error}
        </Typography>
      )}
      {helperText && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default DynamicTableField;
