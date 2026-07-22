import React from 'react';
import { MOCK_DASHBOARD_STATS } from '../../../services/mockData';
import { StatCard } from '../../../components/ui/StatCard';

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {MOCK_DASHBOARD_STATS.slice(0, 4).map((stat) => (
        <StatCard key={stat.id} data={stat} />
      ))}
    </div>
  );
}

export function SecondaryDashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {MOCK_DASHBOARD_STATS.slice(4).map((stat) => (
        <StatCard key={stat.id} data={stat} />
      ))}
    </div>
  );
}
