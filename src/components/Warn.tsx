interface WarnProps {
  children: React.ReactNode;
}

export function Warn({ children }: WarnProps) {
  return (
    <div role="alert" className="text-[var(--color-warn)] mt-2">
      {children}
    </div>
  );
}
