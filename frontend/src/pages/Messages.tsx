import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { MessageCircle, ArrowUpRight } from "lucide-react";

interface Conversation {
  id: string;
  vendor_name: string;
  vendor_logo: string | null;
  last_message: string | null;
}

export function Messages() {
  const [conversations, setConversations] = useState<Conversation[] | undefined>(undefined);

  useEffect(() => {
    apiFetch("/messages/conversations/mine").then((data) => setConversations(data.conversations)).catch(() => setConversations([]));
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 max-w-4xl mx-auto border-b border-ink/10">
        <Link to="/"><img src="/logo.png" alt="BRIDGE" className="h-8" /></Link>
        <Link to="/explore" className="text-sm text-ink/60 hover:text-ink">Explore</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">
        <h1 className="font-display text-3xl font-semibold text-ink mb-8">Messages</h1>

        {conversations === undefined ? (
          <p className="text-ink/40 text-sm">Loading...</p>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 border border-ink/10 rounded-2xl">
            <MessageCircle className="w-6 h-6 text-ink/20 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-ink/40 text-sm">No conversations yet.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
            {conversations.map((c) => (
              <Link key={c.id} to={`/messages/${c.id}`} className="flex items-center justify-between gap-4 py-4 hover:bg-ink/[0.02] transition px-2">
                <div className="flex items-center gap-3 min-w-0">
                  {c.vendor_logo ? (
                    <img src={c.vendor_logo} alt={c.vendor_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-signal/10 flex items-center justify-center shrink-0 font-display font-semibold text-signal">
                      {c.vendor_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{c.vendor_name}</p>
                    <p className="text-sm text-ink/40 truncate">{c.last_message || "No messages yet"}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-ink/20 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}