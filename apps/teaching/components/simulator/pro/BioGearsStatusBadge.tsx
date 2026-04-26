"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBioGearsClient,
  syncBioGearsToStore,
} from "@/lib/simulator/engine/biogears-engine";

// ─── Types ──────────────────────────────────────────────────────────────────

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

// ─── Dot colors & pulse ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  ConnectionStatus,
  { dot: string; label: string; text: string; border: string; bg: string }
> = {
  disconnected: {
    dot: "bg-gray-400",
    label: "Offline",
    text: "text-gray-400",
    border: "border-gray-500/40",
    bg: "bg-gray-900/80",
  },
  connecting: {
    dot: "bg-yellow-400 animate-pulse",
    label: "Connecting",
    text: "text-yellow-400",
    border: "border-yellow-500/40",
    bg: "bg-yellow-900/80",
  },
  connected: {
    dot: "bg-green-400",
    label: "BioGears",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    bg: "bg-emerald-900/80",
  },
  error: {
    dot: "bg-red-400",
    label: "Error",
    text: "text-red-400",
    border: "border-red-500/40",
    bg: "bg-red-900/80",
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function BioGearsStatusBadge() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [busy, setBusy] = useState(false);
  const statusHandlerRegistered = useRef(false);

  // Register status handler on the BioGears client once
  useEffect(() => {
    const client = getBioGearsClient();

    // Map BioGearsClient status strings to our ConnectionStatus
    client.setStatusHandler((clientStatus) => {
      switch (clientStatus) {
        case "connecting":
          setStatus("connecting");
          break;
        case "connected":
        case "initializing":
          setStatus("connecting");
          break;
        case "ready":
          setStatus("connected");
          break;
        case "disconnected":
          setStatus("disconnected");
          break;
        case "error":
          setStatus("error");
          break;
      }
    });
    statusHandlerRegistered.current = true;

    // Sync initial state: if client is already connected/initialized
    if (client.isInitialized) {
      setStatus("connected");
    } else if (client.isReady) {
      setStatus("connecting"); // ready but not initialized
    }

    return () => {
      // Don't clear the handler on unmount — other components may need it
    };
  }, []);

  const handleToggle = useCallback(async () => {
    if (busy) return;

    const client = getBioGearsClient();

    if (status === "connected" || status === "connecting") {
      // Disconnect
      setBusy(true);
      try {
        await client.disconnect();
        setStatus("disconnected");
      } catch {
        setStatus("error");
      } finally {
        setBusy(false);
      }
    } else {
      // Connect
      setBusy(true);
      setStatus("connecting");
      try {
        if (!client.isReady) {
          await Promise.race([
            client.connect(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("BioGears connection timeout")),
                5000,
              ),
            ),
          ]);
        }
        if (!client.isInitialized) {
          const result = await client.initPatient("StandardMale");
          if (result.ok) {
            syncBioGearsToStore(result);
            setStatus("connected");
          } else {
            setStatus("error");
          }
        } else {
          setStatus("connected");
        }
      } catch {
        setStatus("error");
      } finally {
        setBusy(false);
      }
    }
  }, [status, busy]);

  const style = STATUS_STYLES[status];

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={[
        "flex items-center gap-1.5 px-2 py-1 rounded border",
        "text-[10px] font-mono uppercase tracking-wider",
        "transition-all duration-200 cursor-pointer",
        "hover:brightness-125 disabled:opacity-60 disabled:cursor-wait",
        style.bg,
        style.border,
        style.text,
      ].join(" ")}
      title={
        status === "connected"
          ? "Click to disconnect BioGears"
          : status === "connecting"
            ? "Connecting to BioGears..."
            : "Click to connect BioGears"
      }
    >
      {/* Status dot */}
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
      {/* Label */}
      <span>{style.label}</span>
    </button>
  );
}
