import React from 'react';
import { X, Bell, CheckCircle2, XCircle, Clock, ArrowUpRight, ArrowDownLeft, TrendingUp, CheckCheck } from 'lucide-react';
import { CurrencyCode, CURRENCIES } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'trade' | 'withdrawal' | 'deposit' | 'system';
  status: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  currency: CurrencyCode;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: AppNotification['type'], status: AppNotification['status']) => {
    if (type === 'withdrawal') {
      return status === 'error' ? (
        <XCircle className="w-5 h-5 text-rose-500" />
      ) : status === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      ) : (
        <ArrowUpRight className="w-5 h-5 text-amber-500" />
      );
    }
    if (type === 'deposit') {
      return <ArrowDownLeft className="w-5 h-5 text-emerald-500" />;
    }
    if (type === 'trade') {
      return <TrendingUp className="w-5 h-5 text-blue-500" />;
    }
    return <Bell className="w-5 h-5 text-cyan-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-900 my-auto max-h-[85vh] flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Trade updates, withdrawals & alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between py-2 px-1 border-b border-slate-100 text-xs">
            <button
              onClick={onMarkAllAsRead}
              className="text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
            <button
              onClick={onClearAll}
              className="text-slate-400 hover:text-rose-500 font-semibold cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 my-1 pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-600">No Notifications Yet</p>
              <p className="text-[11px] text-slate-400">Your trade execution alerts and withdrawal status updates will appear here.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition flex items-start space-x-3 ${
                  !item.read
                    ? 'bg-blue-50/50 border-blue-200/80 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getIcon(item.type, item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold truncate ${!item.read ? 'text-slate-900 font-black' : 'text-slate-700'}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
        >
          Close Notifications
        </button>
      </div>
    </div>
  );
};
