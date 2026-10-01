import type { InputHTMLAttributes } from "react";

/**
 * One labelled field in the shared form layout (form.css). The requirement rides inside the
 * label, so it is read out with the field's name; an invalid field points at the form's error.
 */
export default function Field({
  id,
  label,
  requirement,
  hint,
  invalid,
  errorId,
  multiline,
  ...input
}: {
  id: string;
  label: string;
  /** The translated "required" or "optional" marker. */
  requirement: { text: string; required: boolean };
  hint?: string;
  invalid?: boolean;
  errorId?: string;
  multiline?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
  const described = invalid ? { "aria-invalid": true, "aria-describedby": errorId } : {};
  return (
    <p className="form__field">
      <label htmlFor={id}>
        {label}{" "}
        <span className={requirement.required ? "form__req" : "form__opt"}>{requirement.text}</span>
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={input.name}
          rows={4}
          defaultValue={input.defaultValue}
          {...described}
        />
      ) : (
        <input id={id} type="text" required={requirement.required} {...described} {...input} />
      )}
      {hint ? <span className="form__hint">{hint}</span> : null}
    </p>
  );
}
