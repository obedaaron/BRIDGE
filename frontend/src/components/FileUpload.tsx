import { useState } from "react";
import { apiUpload } from "../lib/api";

export function FileUpload({ value, onChange, label, uploadPath, accept = "image/*,.pdf" }: { value: string; onChange: (dataUrl: string) => void; label: string; uploadPath?: string; accept?: string }) {
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (file.size > (uploadPath ? 5 : 1) * 1024 * 1024) {
      setError(`Please choose a file under ${uploadPath ? 5 : 1}MB.`);
      return;
    }
    if (uploadPath) {
      const data = new FormData(); data.append("file", file);
      apiUpload(uploadPath, data).then((response) => onChange(response.documentKey)).catch((err) => setError(err.message));
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
        <input type="file" accept={accept} className="hidden" onChange={handleFile} />
      </label>
      {value && <p className="text-xs text-charcoal/60 mt-1">File selected ✓</p>}
      {error && <p className="text-signal text-xs mt-1">{error}</p>}
    </div>
  );
}
