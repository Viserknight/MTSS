import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export const OfflineIndicator = () => {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground shadow-2xl border border-border/50 backdrop-blur-xl animate-fade-in">
      <WifiOff className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">You're offline — showing cached content</span>
    </div>
  );
};
