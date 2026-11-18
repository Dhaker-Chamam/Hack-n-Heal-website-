import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-small text-danger">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
      <span>{message}</span>
    </p>
  );
}

/** Label above, hint below the label, error under the control. */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-semibold text-ink">
        {label}
        {optional && <span className="ml-2 font-normal text-small text-graphite">facultatif</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-small text-graphite">
          {hint}
        </p>
      )}
      <div className="mt-2">{children}</div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function describedBy(id: string, hint?: unknown, error?: unknown) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function Checkbox({
  name,
  id,
  children,
  defaultChecked,
  required,
  error,
  value = "on",
  disabled,
}: {
  name: string;
  id?: string;
  children: ReactNode;
  defaultChecked?: boolean;
  required?: boolean;
  error?: string;
  value?: string;
  disabled?: boolean;
}) {
  const cid = id ?? name;
  return (
    <div>
      <label htmlFor={cid} className="flex cursor-pointer items-start gap-3 py-1">
        <input
          type="checkbox"
          id={cid}
          name={name}
          value={value}
          defaultChecked={defaultChecked}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${cid}-error` : undefined}
          className="mt-1 size-5 shrink-0 cursor-pointer"
        />
        <span className="text-ink">{children}</span>
      </label>
      <FieldError id={`${cid}-error`} message={error} />
    </div>
  );
}
