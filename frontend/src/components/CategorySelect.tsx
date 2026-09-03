import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface Category { id: string; name: string; }

export function CategorySelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiFetch("/categories").then((data) => setCategories(data.categories));
  }, []);

  return (
    <select
      className="border-2 border-charcoal p-3 bg-paper focus:outline-none focus:ring-2 focus:ring-gold"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select a category</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}