import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Send } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  body: string;
}

export function Conversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const [vendorName, setVendorName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function load() {
    apiFetch(`/messages/conversations/${id}/messages`).then((data) => {
      setVendorName(data.conversation.vendor_name);
      setMessages(data.messages);
    });
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/messages/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) });
      setBody("");
      load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-body flex flex-col">
      <nav className="flex items-center gap-4 px-6 md:px-12 py-4 border-b border-ink/10">
        <Link to="/messages" className="text-ink/50 hover:text-ink"><ArrowLeft className="w-5 h-5" /></Link>
        <p className="font-display font-semibold text-ink">{vendorName || "Conversation"}</p>
      </nav>

      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 overflow-y-auto flex flex-col gap-3">
        {messages.map((m) => {
          const isMine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? "self-end bg-ink text-paper" : "self-start bg-ink/5 text-ink"}`}>
              {m.body}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-ink/10 px-6 md:px-12 py-4 flex gap-3 max-w-2xl w-full mx-auto">
        <input className="flex-1 input-field" placeholder="Type a message..." value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="btn-primary px-4" type="submit" disabled={sending}><Send className="w-4 h-4" /></button>
      </form>

      <p className="text-center text-xs text-ink/30 pb-4 max-w-2xl mx-auto px-6">
        BRIDGE Everything is not responsible or liable for any damages, injuries, or losses involving negotiations or transactions done outside the BRIDGE platform.
      </p>
    </div>
  );
}