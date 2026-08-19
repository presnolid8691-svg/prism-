'use client'
export function MessageInput() {
  return (
    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
      <input type="text" placeholder="Type a message..." className="w-full p-2 border rounded" />
    </div>
  );
}
