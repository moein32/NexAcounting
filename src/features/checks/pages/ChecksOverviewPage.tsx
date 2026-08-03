import React, { useState } from 'react';
import { ChecksReceivedPage } from './ChecksReceivedPage';
import { ChecksIssuedPage } from './ChecksIssuedPage';
import { CreditCard, Inbox, Send } from 'lucide-react';

export function ChecksOverviewPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'issued'>('received');

  return (
    <div className="space-y-6">
      {/* Tab Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-2.5 flex items-center justify-start gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'received'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>چک‌های صیادی دریافتی (مشتریان)</span>
        </button>

        <button
          onClick={() => setActiveTab('issued')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'issued'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>چک‌های صیادی صادرشده (شرکتی)</span>
        </button>
      </div>

      {/* Render selected sub-page */}
      <div className="animate-fade-in">
        {activeTab === 'received' ? <ChecksReceivedPage /> : <ChecksIssuedPage />}
      </div>
    </div>
  );
}
