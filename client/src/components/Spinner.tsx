export function Spinner({ size = 16, borderWidth = 2 }: { size?: number; borderWidth?: number }) {
  return <span className="spinner" style={{ width: size, height: size, borderWidth }} />;
}
