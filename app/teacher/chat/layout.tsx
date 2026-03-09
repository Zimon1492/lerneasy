// app/teacher/chat/layout.tsx
"use client";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen bg-[#f0f2f5] flex">
      {children}
    </div>
  );
}
