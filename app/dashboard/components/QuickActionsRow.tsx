"use client";

import React from "react";
import {
  Zap,
  Cpu,
  ArrowLeftRight,
  Globe,
  Tag,
  ChevronRight,
} from "lucide-react";

interface QuickActionsRowProps {
  onAddData: () => void;
  onManageSim: () => void;
  onTransferNumber: () => void;
  onRoamingSettings: () => void;
  onLatestOffers: () => void;
}

export default function QuickActionsRow({
  onAddData,
  onManageSim,
  onTransferNumber,
  onRoamingSettings,
  onLatestOffers,
}: QuickActionsRowProps) {
  const actions = [
    {
      id: "add-data",
      title: "Add data",
      desc: "Review a booster quote",
      icon: Zap,
      onClick: onAddData,
    },
    {
      id: "manage-sim",
      title: "Manage SIM",
      desc: "Status and replacement",
      icon: Cpu,
      onClick: onManageSim,
    },
    {
      id: "transfer-number",
      title: "Transfer my number",
      desc: "Bring in or leave (PAC/STAC)",
      icon: ArrowLeftRight,
      onClick: onTransferNumber,
    },
    {
      id: "roaming-settings",
      title: "Roaming settings",
      desc: "Rates and controls",
      icon: Globe,
      onClick: onRoamingSettings,
    },
    {
      id: "latest-offers",
      title: "Latest offers",
      desc: "Eligible for your plan",
      icon: Tag,
      onClick: onLatestOffers,
    },
  ];

  return (
    <div
      id="data-boosters"
      className="w-full rounded-[20px] bg-white p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200"
    >
      <h3 className="text-base sm:text-lg font-bold text-[#0D1935] mb-3.5">
        Quick actions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className="relative p-4 rounded-2xl bg-slate-50 hover:bg-pink-50/50 border border-slate-200/80 hover:border-pink-200 flex flex-col justify-between gap-3 text-left transition-all duration-200 group cursor-pointer hover:shadow-sm"
            >
              {/* Chevron in top-right */}
              <div className="absolute top-4 right-3 text-slate-400 group-hover:text-[#E01C5B] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>

              {/* Icon in white square */}
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#E01C5B] shadow-xs group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5 text-[#E01C5B]" />
              </div>

              {/* Labels */}
              <div>
                <h4 className="text-sm font-bold text-[#0D1935] group-hover:text-[#E01C5B] transition-colors">
                  {act.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {act.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
