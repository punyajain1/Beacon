'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

function formatLargeNumber(num: number) {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function MarketStats({ className }: { className?: string }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getGlobalMarket().then(res => {
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setStats(res); // Fallback if API changes
      }
    }).catch(console.error);
  }, []);

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-6', className)}>
      <div className="flex flex-col rounded-xl bg-card p-6 border border-border">
        <div className="flex items-center gap-3 mb-4 text-muted-foreground">
          <DollarSign size={16} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Total Market Cap</span>
        </div>
        <div className="text-2xl font-bold text-foreground tracking-tight">
          {stats?.totalMarketCap ? formatLargeNumber(stats.totalMarketCap) : '---'}
        </div>
        <div className={cn("text-xs mt-3 flex items-center gap-1.5 font-bold tracking-wider", stats?.mcapChange >= 0 ? 'text-green-500' : 'text-red-500')}>
          <TrendingUp size={14} className={stats?.mcapChange < 0 ? "rotate-180" : ""} /> 
          {stats?.mcapChange > 0 ? '+' : ''}{stats?.mcapChange ? stats.mcapChange : '---'}%
        </div>
      </div>

      <div className="flex flex-col rounded-xl bg-card p-6 border border-border">
        <div className="flex items-center gap-3 mb-4 text-muted-foreground">
          <Activity size={16} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider">24h Global Volume</span>
        </div>
        <div className="text-2xl font-bold text-foreground tracking-tight">
          {stats?.totalVolume24h ? formatLargeNumber(stats.totalVolume24h) : '---'}
        </div>
        <div className={cn("text-xs mt-3 flex items-center gap-1.5 font-bold tracking-wider", stats?.volumeChange >= 0 ? 'text-green-500' : 'text-red-500')}>
          <Activity size={14} /> 
          {stats?.volumeChange > 0 ? '+' : ''}{stats?.volumeChange ? stats.volumeChange : '---'}%
        </div>
      </div>

      <div className="flex flex-col rounded-xl bg-card p-6 border border-border">
        <div className="flex items-center gap-3 mb-4 text-muted-foreground">
          <TrendingUp size={16} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider">BTC Dominance</span>
        </div>
        <div className="text-2xl font-bold text-foreground tracking-tight">
          {stats?.btcDominance ? `${stats.btcDominance}%` : '---'}
        </div>
      </div>
    </div>
  );
}
