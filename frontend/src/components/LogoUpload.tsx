import { useState } from "react";

export function LogoUpload({ value, onChange }: { value: string; onChange: (dataUrl: string) => void }) {
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (file.size > 1024 * 1024) {
      setError("Please choose an image under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => setError("Failed to read image.");
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Store logo</label>
      <div className="flex items-center gap-4">
        {value ? (
          <img src={value} alt="Logo" className="w-16 h-16 object-cover border-2 border-charcoal" />
        ) : (
          <div className="w-16 h-16 border-2 border-dashed border-charcoal/40 flex items-center justify-center text-xs text-charcoal/40">
            No logo
          </div>
        )}
        <label className="text-sm bg-paper border-2 border-charcoal px-3 py-2 cursor-pointer hover:bg-charcoal hover:text-paper transition">
          Choose image
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
      {error && <p className="text-signal text-sm mt-1">{error}</p>}
    </div>
  );
}