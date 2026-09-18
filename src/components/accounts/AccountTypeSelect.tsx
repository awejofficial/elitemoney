const OPTIONS: { value: string; label: string }[] = [
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Cash" },
  { value: "wallet", label: "Wallet" },
  { value: "custom", label: "Custom" },
];

export default function AccountTypeSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? "bank"}
      className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
