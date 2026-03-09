"use client";

import { useEffect, useRef, useState } from "react";

type ChatTeacher = {
  id: string;
  name: string;
  subject: string;
  avatarUrl?: string | null;
};

type Message = {
  id: string;
  text: string;
  at: string; // "14:12"
  author: "me" | "them";
};

type Chat = {
  teacher: ChatTeacher;
  messages: Message[];
};

function timeNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ChatWhatsAppModal() {
  const [open, setOpen] = useState(false);
  // 🚫 Start OHNE irgendeinen Demo-Chat
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const active = chats[activeIdx];

  // beim Öffnen automatisch nach unten scrollen + Input fokussieren
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      inputRef.current?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [open, activeIdx]);

  // Globale Events: Widget öffnen + Text vorfüllen (+ optional aktiven Lehrer setzen)
  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }

    function handlePrefill(e: Event) {
      const detail = (e as CustomEvent).detail as {
        text?: string;
        teacher?: ChatTeacher; // optional
      };

      setOpen(true);

      // Falls ein Lehrer übergeben wird, Chat dafür wählen/erstellen
      if (detail?.teacher) {
        setChats((prev) => {
          const idx = prev.findIndex((c) => c.teacher.id === detail.teacher!.id);
          if (idx === -1) {
            const next = [...prev, { teacher: detail.teacher!, messages: [] }];
            setActiveIdx(next.length - 1);
            return next;
          } else {
            setActiveIdx(idx);
            return prev;
          }
        });
      }

      if (typeof detail?.text === "string") {
        setInput(detail.text);
      }

      // Fokus
      setTimeout(() => inputRef.current?.focus(), 0);
    }

    window.addEventListener("open-chat", handleOpen as any);
    window.addEventListener("chat:prefill", handlePrefill as any);
    return () => {
      window.removeEventListener("open-chat", handleOpen as any);
      window.removeEventListener("chat:prefill", handlePrefill as any);
    };
  }, []);

  function send() {
    const txt = input.trim();
    if (!txt || !active) return;

    const newMsg: Message = {
      id: crypto.randomUUID(),
      text: txt,
      at: timeNow(),
      author: "me",
    };

    setChats((prev) => {
      const copy = [...prev];
      copy[activeIdx] = {
        ...copy[activeIdx],
        messages: [...copy[activeIdx].messages, newMsg],
      };
      return copy;
    });

    setInput("");
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 10);
  }

  return (
    <>
      {/* runder Chat-Button unten rechts (wenn geschlossen) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-6 bottom-6 w-12 h-12 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center"
          title="Chat öffnen"
        >
          💬
        </button>
      )}

      {/* Chatfenster */}
      {open && (
        <div className="fixed inset-0 lg:inset-auto lg:right-6 lg:bottom-6 lg:h-[640px] lg:w-[980px] h-full w-full bg-white/90 lg:bg-transparent z-50 flex items-end justify-end">
          {/* Panel */}
          <div className="w-full h-full lg:h-[640px] lg:w-[980px] rounded-2xl bg-white shadow-2xl border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div>
                  <div className="font-semibold">
                    {active?.teacher?.name ?? "Chat"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {active?.teacher?.subject ?? ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="hidden sm:inline-block rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                  onClick={() => {
                    window.dispatchEvent(new Event("open-booking-modal"));
                  }}
                >
                  Termin anfragen
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                  aria-label="Schließen"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body: 2 Spalten */}
            <div className="grid grid-cols-12 h-[calc(100%-56px)]">
              {/* Sidebar / Chatliste */}
              <aside className="col-span-4 border-r hidden md:flex flex-col">
                <div className="p-3">
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Lehrer oder Fach suchen"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
                  </div>
                </div>

                <div className="overflow-y-auto">
                  {chats.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-gray-500">
                      Noch keine Chats. Öffne einen Lehrer und starte eine Nachricht.
                    </div>
                  ) : (
                    chats.map((c, i) => (
                      <button
                        key={c.teacher.id}
                        onClick={() => setActiveIdx(i)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left ${
                          i === activeIdx ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{c.teacher.name}</div>
                          <div className="text-xs text-gray-500 truncate">{c.teacher.subject}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </aside>

              {/* Chatverlauf */}
              <section className="col-span-12 md:col-span-8 flex flex-col">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                  {active ? (
                    <>
                      <div className="text-center text-xs text-gray-400">
                        {timeNow()}
                      </div>
                      {active.messages.map((m) => (
                        <div key={m.id} className={`flex ${m.author === "me" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                              m.author === "me"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <div>{m.text}</div>
                            <div
                              className={`text-[10px] mt-1 ${
                                m.author === "me" ? "text-blue-200" : "text-gray-500"
                              }`}
                            >
                              {m.at}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500">
                      Wähle links einen Chat oder öffne einen Lehrer.
                    </div>
                  )}
                </div>

                {/* Eingabe */}
                <div className="border-t p-3 flex items-center gap-2">
                  <button
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-50"
                    title="Anhängen"
                  >
                    📎
                  </button>
                  <button
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-50"
                    title="Emoji"
                  >
                    😊
                  </button>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send();
                    }}
                    placeholder="Nachricht schreiben…"
                    className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={send}
                    className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center"
                    title="Senden"
                    disabled={!active}
                  >
                    ➤
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
