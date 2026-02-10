import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { TemplateField } from "@/types/template";

interface Props {
  field: TemplateField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  preview?: boolean;
}

export function TemplateFieldRenderer({
  field,
  value,
  onChange,
  error,
  preview = false,
}: Props) {
  const label = field.label || "";
  const options = Array.isArray(field.options) ? field.options : [];
  const rows = field.rows ?? 1;
  const type = field.type ?? "text";
  const required = field.required;

  if (type === "info") {
    return (
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    );
  }

  if (type === "select") {
    return (
      <FormControl fullWidth error={Boolean(error)} disabled={preview}>
        <InputLabel>{label} {required && "*"}</InputLabel>
        <Select
          value={(value as string) || ""}
          label={`${label} ${required ? "*" : ""}`}
          onChange={(e) => !preview && onChange(e.target.value)}
        >
          {options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
        {error && <Typography variant="caption" color="error">{error}</Typography>}
      </FormControl>
    );
  }

  if (type === "radio") {
    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {label} {required && "*"}
        </Typography>
        <RadioGroup
          row
          name={field.id}
          value={(value as string) || ""}
          onChange={(e) => !preview && onChange(e.target.value)}
        >
          {options.map((opt) => (
            <FormControlLabel
              key={opt}
              value={opt}
              control={<Radio size="small" disabled={preview} />}
              label={opt}
              sx={{ mr: 2 }}
            />
          ))}
        </RadioGroup>
        {error && <Typography variant="caption" color="error">{error}</Typography>}
      </Box>
    );
  }

  if (type === "checkbox") {
    const selected = Array.isArray(value)
      ? value
      : value != null && value !== ""
        ? [value]
        : [];
    if (options.length > 0) {
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {label} {required && "*"}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {options.map((opt) => (
              <FormControlLabel
                key={opt}
                control={
                  <Checkbox
                    size="small"
                    checked={(selected as string[]).includes(opt)}
                    onChange={(_, checked) => {
                      if (preview) return;
                      const next = checked
                        ? [...(selected as string[]), opt]
                        : (selected as string[]).filter((v) => v !== opt);
                      onChange(next);
                    }}
                    disabled={preview}
                  />
                }
                label={opt}
              />
            ))}
          </Box>
          {error && <Typography variant="caption" color="error">{error}</Typography>}
        </Box>
      );
    }
    return (
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={!!value}
            onChange={(_, checked) => !preview && onChange(checked)}
            disabled={preview}
          />
        }
        label={label}
      />
    );
  }

  if (type === "number") {
    return (
      <TextField
        label={`${label} ${required ? "*" : ""}`}
        type="number"
        value={(value as string) || ""}
        onChange={(e) => !preview && onChange(e.target.value)}
        disabled={preview}
        error={Boolean(error)}
        helperText={error}
        fullWidth
      />
    );
  }

  if (type === "file" || type === "image") {
    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {label} {required && "*"}
        </Typography>
        <Button variant="outlined" component="label" disabled={preview}>
          Escolher arquivo
          <input
            type="file"
            hidden
            accept={type === "image" ? "image/*" : "*"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              onChange(file ? file.name : "");
            }}
          />
        </Button>
        {value != null && value !== "" && !preview && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {String(value as string)}
          </Typography>
        )}
        {error && <Typography variant="caption" color="error">{error}</Typography>}
      </Box>
    );
  }

  const textRows = Math.max(1, Math.min(20, rows));
  if (textRows > 1) {
    return (
      <TextField
        label={`${label} ${required ? "*" : ""}`}
        multiline
        rows={textRows}
        value={(value as string) || ""}
        onChange={(e) => !preview && onChange(e.target.value)}
        disabled={preview}
        error={Boolean(error)}
        helperText={error}
        fullWidth
      />
    );
  }

  return (
    <TextField
      label={`${label} ${required ? "*" : ""}`}
      value={(value as string) || ""}
      onChange={(e) => !preview && onChange(e.target.value)}
      disabled={preview}
      error={Boolean(error)}
      helperText={error}
      fullWidth
    />
  );
}
