import { useState } from 'react';
import { Link } from 'react-router';
import { TradesTab } from './trades';
import { FreeAgencyTab } from './free-agency';
import { WaiversTab } from './waivers';
import { HistoryTab } from './history';

const TABS = ['Trades', 'Free Agency', 'Waivers', 'History'] as const;

export function TransfersPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Trades');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
        <Link
          to="/transfers/create-trade"
          className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg w-full sm:w-auto"
        >
          New Trade Offer
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav className="-mb-px flex overflow-x-auto scrollbar-hide space-x-1 sm:space-x-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3 sm:px-1 border-b-2 text-sm font-medium whitespace-nowrap shrink-0 ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'Trades' && <TradesTab />}
      {activeTab === 'Free Agency' && <FreeAgencyTab />}
      {activeTab === 'Waivers' && <WaiversTab />}
      {activeTab === 'History' && <HistoryTab />}
    </div>
  );
}
