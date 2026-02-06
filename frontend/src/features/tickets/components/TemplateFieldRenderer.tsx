import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
      <p className="text-sm text-muted-foreground">{label}</p>
    );
  }

  if (type === "select") {
    return (
      <div className="space-y-2">
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={(value as string) || ""}
          onValueChange={(v) => !preview && onChange(v)}
          disabled={preview}
        >
          <SelectTrigger className={error ? "border-destructive" : ""}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  if (type === "radio") {
    return (
      <div className="space-y-2">
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={value === opt}
                onChange={() => !preview && onChange(opt)}
                disabled={preview}
                className="accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
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
        <div className="space-y-2">
          <Label>
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={(selected as string[]).includes(opt)}
                  onCheckedChange={(checked) => {
                    if (preview) return;
                    const next = checked
                      ? [...(selected as string[]), opt]
                      : (selected as string[]).filter((v) => v !== opt);
                    onChange(next);
                  }}
                  disabled={preview}
                />
                {opt}
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => !preview && onChange(checked)}
            disabled={preview}
          />
          {label}
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  if (type === "number") {
    return (
      <div className="space-y-2">
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          type="number"
          value={(value as string) || ""}
          onChange={(e) => !preview && onChange(e.target.value)}
          disabled={preview}
          className={error ? "border-destructive" : ""}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  if (type === "file" || type === "image") {
    return (
      <div className="space-y-2">
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Button variant="outline" asChild disabled={preview}>
          <label className="cursor-pointer">
            Escolher arquivo
            {!preview && (
              <input
                type="file"
                className="hidden"
                accept={type === "image" ? "image/*" : "*"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  onChange(file ? file.name : "");
                }}
              />
            )}
          </label>
        </Button>
        {value != null && value !== "" && !preview && (
          <p className="text-xs text-muted-foreground">{String(value as string)}</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  // text / textarea
  const textRows = Math.max(1, Math.min(20, rows));
  if (textRows > 1) {
    return (
      <div className="space-y-2">
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Textarea
          value={(value as string) || ""}
          onChange={(e) => !preview && onChange(e.target.value)}
          rows={textRows}
          disabled={preview}
          className={error ? "border-destructive" : ""}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        value={(value as string) || ""}
        onChange={(e) => !preview && onChange(e.target.value)}
        disabled={preview}
        className={error ? "border-destructive" : ""}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
