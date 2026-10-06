import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useBridgeTheme } from "../lib/theme";

type Notice = { id: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string };
export function NotificationCenter() {
  const { theme } = useBridgeTheme(); const dark = theme === "dark";
  const [items, setItems] = useState<Notice[]>([]); const [open, setOpen] = useState(false); const [toast, setToast] = useState<Notice | null>(null); const [ready, setReady] = useState(false);
  async function load() {
    try {
      const data = await apiFetch("/notifications/mine"); const notices: Notice[] = data.notifications || [];
      if (ready && notices[0] && notices[0].id !== items[0]?.id) setToast(notices[0]);
      setItems(notices); setReady(true);
    } catch { /* Show the app shell while the notification service is unavailable. */ }
  }
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 20000); return () => window.clearInterval(timer); }, [ready, items]);
  async function markRead(id: string) { await apiFetch(`/notifications/${id}/read`, { method: "PATCH" }).catch(() => undefined); setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item)); }
  const unread = items.filter((item) => !item.read_at).length;
  return <div className="relative">
    <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); setToast(null); }} className={`relative grid h-10 w-10 place-items-center rounded-full border ${dark ? "border-white/15 text-white hover:bg-white/10" : "border-black/15 text-[#171714] hover:bg-black/5"}`}><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#d6ff57] px-1 text-[10px] font-bold text-[#11110f]">{unread > 9 ? "9+" : unread}</span>}</button>
    {toast && !open && <div role="status" className={`absolute right-0 top-12 z-50 w-[min(88vw,22rem)] rounded-2xl border p-4 shadow-2xl ${dark ? "border-white/15 bg-[#20201c] text-white" : "border-black/10 bg-white text-[#171714]"}`}><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{toast.title}</p><p className={`mt-1 text-xs leading-relaxed ${dark ? "text-white/70" : "text-[#171714]/70"}`}>{toast.body}</p></div><button onClick={() => setToast(null)} aria-label="Dismiss notification"><X className="h-4 w-4" /></button></div></div>}
    {open && <section aria-label="Notifications" className={`absolute right-0 top-12 z-50 max-h-[min(70vh,32rem)] w-[min(92vw,24rem)] overflow-y-auto rounded-2xl border p-2 shadow-2xl ${dark ? "border-white/15 bg-[#20201c] text-white" : "border-black/10 bg-white text-[#171714]"}`}><header className="flex items-center justify-between px-3 py-2"><h2 className="text-sm font-semibold">Notifications</h2>{unread > 0 && <button onClick={async () => { await apiFetch("/notifications/read-all", { method: "PATCH" }); setItems((all) => all.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))); }} className="inline-flex items-center gap-1 text-xs font-medium text-[#206653]"><CheckCheck className="h-3.5 w-3.5" />Mark all read</button>}</header>{items.length ? items.map((item) => <Link key={item.id} to={item.href || "/orders"} onClick={() => { void markRead(item.id); setOpen(false); }} className={`block rounded-xl px-3 py-3 ${dark ? "hover:bg-white/5" : "hover:bg-black/5"} ${item.read_at ? "opacity-70" : dark ? "bg-white/[.04]" : "bg-black/[.025]"}`}><p className="text-sm font-semibold">{item.title}</p><p className={`mt-1 text-xs leading-relaxed ${dark ? "text-white/70" : "text-[#171714]/70"}`}>{item.body}</p><time className={`mt-2 block text-[10px] ${dark ? "text-white/55" : "text-[#171714]/55"}`}>{new Date(item.created_at).toLocaleString()}</time></Link>) : <p className={`px-3 py-8 text-center text-sm ${dark ? "text-white/65" : "text-[#171714]/65"}`}>You’re all caught up.</p>}</section>}
  </div>;
}
