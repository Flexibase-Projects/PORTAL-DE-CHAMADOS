import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Button,
  Typography,
} from '@mui/material';

/**
 * Renders a single template field. Used in:
 * - TemplateEditor list (preview=true): same look as form, disabled, empty value.
 * - CreateTicket form (preview=false): real value/onChange/error.
 */
const TemplateFieldRenderer = ({ field, value, onChange, error, preview = false }) => {
  const label = field?.label ?? '';
  const required = !!field?.required;
  const options = Array.isArray(field?.options) ? field.options : [];
  const rows = field?.rows ?? 1;
  const type = field?.type ?? 'text';

  const displayValue = preview ? '' : (value ?? '');
  const handleChange = preview ? () => {} : onChange;

  if (type === 'info') {
    return (
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    );
  }

  if (type === 'table') {
    return (
      <Typography variant="body2" color="text.secondary">
        Campo de tabela não suportado.
      </Typography>
    );
  }

  if (type === 'select') {
    return (
      <FormControl fullWidth error={!!error && !preview} disabled={preview}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={preview ? '' : (value ?? '')}
          label={label}
          onChange={(e) => handleChange(e.target.value)}
        >
          <MenuItem value="">
            <em>Selecione</em>
          </MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
        {error && !preview && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
            {error}
          </Typography>
        )}
      </FormControl>
    );
  }

  if (type === 'radio') {
    return (
      <FormControl component="fieldset" error={!!error && !preview} disabled={preview}>
        <Typography variant="body2" sx={{ mb: 1 }} required={required}>
          {label}
        </Typography>
        <RadioGroup value={preview ? '' : (value ?? '')} onChange={(e) => handleChange(e.target.value)} row>
          {options.map((opt) => (
            <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
          ))}
        </RadioGroup>
        {error && !preview && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </FormControl>
    );
  }

  if (type === 'checkbox') {
    const selectedValues = Array.isArray(value) ? value : (value != null && value !== '' ? [value] : []);
    if (options.length > 0) {
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }} required={required}>
            {label}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {options.map((opt) => (
              <FormControlLabel
                key={opt}
                control={
                  <Checkbox
                    checked={preview ? false : selectedValues.includes(opt)}
                    onChange={(e) => {
                      if (preview) return;
                      const next = e.target.checked
                        ? [...selectedValues, opt]
                        : selectedValues.filter((v) => v !== opt);
                      handleChange(next);
                    }}
                    disabled={preview}
                  />
                }
                label={opt}
              />
            ))}
          </Box>
          {error && !preview && (
            <Typography variant="caption" color="error" display="block">
              {error}
            </Typography>
          )}
        </Box>
      );
    }
    return (
      <Box>
        <FormControlLabel
          control={
            <Checkbox checked={preview ? false : !!value} onChange={(e) => handleChange(e.target.checked)} disabled={preview} />
          }
          label={label}
        />
        {error && !preview && (
          <Typography variant="caption" color="error" display="block">
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  if (type === 'number') {
    return (
      <TextField
        fullWidth
        type="number"
        label={label}
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        error={!!error && !preview}
        helperText={preview ? undefined : error}
        required={required}
        disabled={preview}
      />
    );
  }

  if (type === 'file' || type === 'image') {
    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 1 }} required={required}>
          {label}
        </Typography>
        <Button variant="outlined" component="label" disabled={preview}>
          Escolher arquivo
          {!preview && (
            <input
              type="file"
              hidden
              accept={type === 'image' ? 'image/*' : '*'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleChange(file ? file.name : '');
              }}
            />
          )}
        </Button>
        {value && !preview && (
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        )}
        {error && !preview && (
          <Typography variant="caption" color="error" display="block">
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  const textRows = Math.max(1, Math.min(20, rows ?? 1));
  return (
    <TextField
      fullWidth
      label={label}
      value={displayValue}
      onChange={(e) => handleChange(e.target.value)}
      multiline={textRows > 1}
      rows={textRows > 1 ? textRows : undefined}
      error={!!error && !preview}
      helperText={preview ? undefined : error}
      required={required}
      disabled={preview}
    />
  );
};

export default TemplateFieldRenderer;
