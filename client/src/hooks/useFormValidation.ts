import { useId, useState } from 'react';

/** Keep feedback quiet until a field is blurred or the form is submitted. */
export function useFormValidation<Field extends string>(errors: Record<Field, string | null>) {
  const id = useId();
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  function error(field: Field) {
    return submitted || touched[field] ? errors[field] : null;
  }

  function touch(field: Field) {
    setTouched((previous) => ({ ...previous, [field]: true }));
  }

  return {
    error,
    touch,
    errorId: (field: Field) => `${id}-${field}-error`,
    fieldProps: (field: Field) => ({
      onBlur: () => touch(field),
      'aria-invalid': !!error(field),
      'aria-describedby': error(field) ? `${id}-${field}-error` : undefined,
    }),
    validate: () => {
      setSubmitted(true);
      return Object.values(errors).every((value) => value === null);
    },
    reset: () => {
      setTouched({});
      setSubmitted(false);
    },
  };
}
