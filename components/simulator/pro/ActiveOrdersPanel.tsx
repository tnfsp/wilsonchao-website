"use client";

import { useProGameStore } from "@/lib/simulator/store";
import type { PlacedOrder, OrderStatus } from "@/lib/simulator/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Exclude<OrderStatus, "completed" | "cancelled">,
  { label: string; color: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  in_progress: {
    label: "Running",
    color: "text-blue-400",
    dot: "bg-blue-400 animate-pulse",
  },
};

function formatCountdown(availableAt: number, currentTime: number): string {
  const remaining = Math.max(0, availableAt - currentTime);
  if (remaining === 0) return "結果中...";
  return `~${remaining} min`;
}

function categoryIcon(category: string): string {
  switch (category) {
    case "medication": return "💊";
    case "hemostatic": return "🩹";
    case "fluid": return "💧";
    case "transfusion": return "🩸";
    case "mtp": return "🚨";
    case "electrolyte": return "💉";
    case "lab": return "🔬";
    case "imaging": return "🩻";
    case "pocus": return "🫁";
    case "consult": return "📞";
    case "procedure": return "🔧";
    case "note": return "📝";
    default: return "📋";
  }
}

// ─── OrderRow ────────────────────────────────────────────────────────────────

function OrderRow({ order, currentTime }: { order: PlacedOrder; currentTime: number }) {
  const status = order.status as Exclude<OrderStatus, "completed" | "cancelled">;
  const cfg = STATUS_CONFIG[status];
  const isLab = order.definition.category === "lab";

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
      {/* Status dot */}
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

      {/* Icon + name */}
      <span className="text-sm flex-shrink-0">{categoryIcon(order.definition.category)}</span>
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm font-medium truncate block">
          {order.definition.name}
        </span>
        {order.dose && (
          <span className="text-gray-500 text-xs">
            {order.dose} {order.definition.unit}
            {order.frequency && order.frequency !== "once" ? ` · ${order.frequency}` : ""}
          </span>
        )}
      </div>

      {/* Right side: status or countdown */}
      <div className="flex-shrink-0 text-right">
        {isLab && order.resultAvailableAt !== undefined ? (
          <span className="text-xs font-mono text-yellow-400">
            {formatCountdown(order.resultAvailableAt, currentTime)}
          </span>
        ) : (
          <span className={`text-xs font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── ActiveOrdersPanel ────────────────────────────────────────────────────────

export default function ActiveOrdersPanel() {
  const placedOrders = useProGameStore((s) => s.placedOrders);
  const currentTime = useProGameStore((s) => s.clock.currentTime);

  const activeOrders = placedOrders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  );

  const labOrders = activeOrders.filter((o) => o.definition.category === "lab");
  const medOrders = activeOrders.filter((o) => o.definition.category !== "lab");

  return (
    <div className="rounded-xl border border-white/8 bg-[#001a25] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            Active Orders
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {activeOrders.length} active
        </span>
      </div>

      {activeOrders.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-2">
          尚無進行中的 orders
        </p>
      ) : (
        <div className="space-y-0">
          {/* Meds / fluids / blood */}
          {medOrders.length > 0 && (
            <div>
              {medOrders.map((order) => (
                <OrderRow key={order.id} order={order} currentTime={currentTime} />
              ))}
            </div>
          )}

          {/* Lab pending */}
          {labOrders.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-600 mt-2 mb-1">
                Labs Pending
              </div>
              {labOrders.map((order) => (
                <OrderRow key={order.id} order={order} currentTime={currentTime} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
