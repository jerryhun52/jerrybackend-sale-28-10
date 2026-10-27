import React from 'react';
import { Home, TrendingUp, Play, ClipboardList, Wallet } from 'lucide-react';

export type ClientTab = 'home' | 'market' | 'trade' | 'orders' | 'profile';

interface BottomNavProps {
  activeTab: ClientTab;
  onChangeTab: (tab: ClientTab) => void;
  activeTradeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  activeTradeCount = 0,
}) => {
  const tabs = [
    {
      id: 'home' as ClientTab,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'market' as ClientTab,
      label: 'Market',
      icon: TrendingUp,
    },
    {
      id: 'trade' as ClientTab,
      label: 'Trade',
      icon: Play,
    },
    {
      id: 'orders' as ClientTab,
      label: 'Order',
      icon: ClipboardList,
      hasBadge: activeTradeCount > 0,
      badgeCount: activeTradeCount,
    },
    {
      id: 'profile' as ClientTab,
      label: 'Assets',
      icon: Wallet,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#e2e8f0]/95 backdrop-blur-md border-t border-slate-300 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] pb-4 sm:pb-2 pt-1 pb-[max(0.9rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md md:max-w-xl mx-auto px-3 py-2 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#2563eb] font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#2563eb]' : 'stroke-[1.8] text-slate-500'}`} />
                {tab.hasBadge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                    {tab.badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="w-3.5 h-0.5 bg-[#2563eb] rounded-full mt-0.5 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
