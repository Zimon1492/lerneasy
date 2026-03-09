// app/student/chat/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

type ChatItem = {
  id: string;
  teacherEmail: string;
  teacherName?: string | null;
  subject?: string | null;
};

type Msg = {
  id: string;
  sender: "student" | "teacher" | "system";
  text: string;
  createdAt?: string;
};

export default function StudentChatPage() {
  const { data: session } = useSession();

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true); // mobile: toggle zwischen Liste & Chat

  const [messages, setMessages] = useState<Msg[]>([]);
  const [partnerEmail, setPartnerEmail] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("");

  const [input, setInput] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const lastMsgIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadChats() {
      if (!session?.user?.email) return;
      setLoadingChats(true);
      try {
        const res = await fetch(`/api/student/chat?email=${session.user.email}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const list: ChatItem[] = data.chats || [];
        setChats(list);
        if (!selectedChat && list.length > 0) {
          setSelectedChat(list[0].id);
          setShowSidebar(false);
        }
      } finally {
        setLoadingChats(false);
      }
    }
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  const selectedChatObj = useMemo(
    () => chats.find((c) => c.id === selectedChat) || null,
    [chats, selectedChat]
  );

  useEffect(() => {
    if (!selectedChat) return;
    let alive = true;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat/${selectedChat}/messages`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const newMessages: Msg[] = data.messages || [];
        const pe = selectedChatObj?.teacherEmail || data.teacherEmail || "";
        const pn = selectedChatObj?.teacherName || data.teacherName || "";
        if (!alive) return;
        const newestId = newMessages.length ? newMessages[newMessages.length - 1].id : null;
        if (newestId && newestId !== lastMsgIdRef.current) {
          setMessages(newMessages);
          lastMsgIdRef.current = newestId;
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
        } else if (!newestId && lastMsgIdRef.current !== null) {
          setMessages(newMessages);
          lastMsgIdRef.current = null;
        }
        setPartnerEmail(pe);
        setPartnerName(pn);
        fetch(`/api/chat/${selectedChat}/mark-read`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "student" }),
        }).catch(() => {});
      } finally {
        if (alive) setLoadingMessages(false);
      }
    }

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => { alive = false; clearInterval(interval); };
  }, [selectedChat, selectedChatObj]);

  function selectChat(id: string) {
    setSelectedChat(id);
    setShowSidebar(false);
    lastMsgIdRef.current = null;
    setMessages([]);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChat) return;
    const text = input.trim();
    if (!text) return;
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, sender: "student", text, createdAt: new Date().toISOString() }]);
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
    await fetch(`/api/chat/${selectedChat}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "student", text }),
    }).catch(() => {});
  }

  return (
    <div className="h-[calc(100vh-56px)] flex overflow-hidden">

      {/* SIDEBAR: Chat-Liste */}
      <aside className={`
        h-full overflow-y-auto bg-white flex flex-col shrink-0
        md:w-[300px] lg:w-[320px] md:border-r
        ${showSidebar ? "w-full" : "hidden md:flex"}
      `}>
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Chats</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Bewertungshinweis */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 leading-relaxed mb-1">
            ★ Zufrieden mit deiner Stunde? Bewerte deinen Lehrer im{" "}
            <a href="/student/payments" className="font-semibold underline underline-offset-2 hover:text-amber-900">
              Buchungen-Tab
            </a>.
          </div>

          {loadingChats && <p className="text-sm text-gray-500 px-1">Lade Chats…</p>}
          {!loadingChats && chats.length === 0 && (
            <p className="text-sm text-gray-500 px-1">Noch keine Chats vorhanden.</p>
          )}
          {chats.map((chat) => {
            const active = selectedChat === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  active ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold text-sm">{chat.teacherName || "Lehrer"}</div>
                <div className="text-xs text-gray-500 truncate">{chat.teacherEmail}</div>
                {chat.subject && <div className="text-[11px] text-gray-400 mt-0.5">{chat.subject}</div>}
              </button>
            );
          })}
        </div>
      </aside>

      {/* CHAT-BEREICH */}
      <section className={`
        flex-1 h-full flex flex-col bg-gray-50 min-w-0
        ${!showSidebar ? "flex" : "hidden md:flex"}
      `}>
        {/* Header */}
        <div className="px-4 py-3 bg-blue-600 text-white flex items-center gap-3 shrink-0">
          {/* Mobile: zurück zur Liste */}
          <button
            className="md:hidden p-1 rounded-lg hover:bg-blue-700 transition"
            onClick={() => setShowSidebar(true)}
            aria-label="Zurück zur Chat-Liste"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="text-base font-semibold truncate">
              {selectedChat ? (partnerName || partnerEmail || "Chat") : "Wähle einen Chat aus"}
            </div>
            {selectedChat && partnerEmail && (
              <div className="text-xs text-blue-100 truncate">{partnerEmail}</div>
            )}
          </div>
        </div>

        {/* Nachrichten */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loadingMessages && messages.length === 0 && (
            <p className="text-sm text-gray-500">Lade Nachrichten…</p>
          )}
          {!loadingMessages && selectedChat && messages.length === 0 && (
            <p className="text-sm text-gray-500">Noch keine Nachrichten.</p>
          )}
          {!selectedChat && !loadingMessages && (
            <p className="text-sm text-gray-400 text-center mt-8">Wähle einen Chat aus der Liste.</p>
          )}

          {messages.map((msg) => {
            if (msg.sender === "system") {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow-sm">
                    <span className="mr-2">✅</span>
                    {msg.text}
                    {msg.createdAt && (
                      <div className="mt-1 text-[10px] text-amber-700 text-right">
                        {new Date(msg.createdAt).toLocaleString("de-DE")}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            const isStudent = msg.sender === "student";
            return (
              <div key={msg.id} className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  isStudent ? "bg-blue-600 text-white" : "bg-white text-gray-900"
                }`}>
                  <div className="text-sm whitespace-pre-wrap break-words">{msg.text}</div>
                  {msg.createdAt && (
                    <div className={`mt-1 text-[10px] ${isStudent ? "text-blue-200" : "text-gray-400"} text-right`}>
                      {new Date(msg.createdAt).toLocaleString("de-DE")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2 shrink-0">
          <input
            type="text"
            className="flex-1 border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={selectedChat ? "Nachricht schreiben..." : "Wähle zuerst einen Chat"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!selectedChat}
          />
          <button
            type="submit"
            disabled={!selectedChat || !input.trim()}
            className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 shrink-0"
          >
            Senden
          </button>
        </form>
      </section>
    </div>
  );
}
