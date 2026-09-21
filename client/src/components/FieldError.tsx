export function FieldError({ id, error }: { id: string; error: string | null }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="text-xs text-red-400 mt-1.5">
      {error}
    </p>
  );
}
