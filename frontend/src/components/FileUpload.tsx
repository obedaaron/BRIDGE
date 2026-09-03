import { useState } from "react";

export function FileUpload({ value, onChange, label }: { value: string; onChange: (dataUrl: string) => void; label: string }) {
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (file.size > 1024 * 1024) {
      setError("Please choose a file under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="text-xs bg-paper border-2 border-charcoal px-3 py-2 cursor-pointer hover:bg-charcoal hover:text-paper transition inline-block">
        {value ? "Change file" : label}
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
      </label>
      {value && <p className="text-xs text-charcoal/60 mt-1">File selected ✓</p>}
      {error && <p className="text-signal text-xs mt-1">{error}</p>}
    </div>
  );
}