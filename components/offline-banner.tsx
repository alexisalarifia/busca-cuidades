"use client";

import { useEffect, useState } from "react";
import { saveSnapshot } from "@/lib/offline";

// One quiet banner offline (brief §10); on each online load, snapshot the
// active trip to IndexedDB so it survives going dark.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    if (navigator.onLine) {
      fetch("/api/snapshot")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && saveSnapshot(data))
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="radius-token mb-4 border border-ink/15 bg-white px-3 py-2 text-center text-xs text-ink/60">
      Offline — showing your last saved trip. Changes need a connection.
    </div>
  );
}
