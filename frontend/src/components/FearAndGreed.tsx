'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Activity } from 'lucide-react';

export function FearAndGreed({ className }: { className?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);

  useEffect(() => {
    fetch('https://api.alternative.me/fng/?limit=30')
      .then(res => res.json())
      .then(json => {
        if (json && json.data) {
          const reversed = [...json.data].reverse().map((d: any) => ({
            ...d,
            value: parseInt(d.value, 10),
            date: new Date(parseInt(d.timestamp, 10) * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          }));
          setData(reversed);
          setCurrent(json.data[0]); // the most recent
        }
      })
      .catch(console.error);
  }, []);

  const getGaugeColor = (val: number) => {
    if (val <= 25) return '#ef4444'; // Extreme Fear (Red)
    if (val <= 45) return '#f97316'; // Fear (Orange)
    if (val <= 55) return '#eab308'; // Neutral (Yellow)
    if (val <= 75) return '#84cc16'; // Greed (Light Green)
    return '#22c55e'; // Extreme Greed (Green)
  };

  if (!current) return null;

  const currentVal = parseInt(current.value, 10);
  const color = getGaugeColor(currentVal);

  return (
    <div className={cn("flex flex-col md:flex-row gap-8 p-6 rounded-xl bg-card border border-border w-full", className)}>
      {/* Gauge / Current value */}
      <div className="flex flex-col items-center justify-center min-w-[200px]">
        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-6 text-center">
          Fear & Greed Index
        </div>
        
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Subtle Outer Glow */}
          <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ backgroundColor: color }}></div>
          
          {/* Sleek thin border ring */}
          <div className="absolute inset-0 rounded-full border border-white/5"></div>
          
          {/* Colored arc simulation */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle 
              cx="64" cy="64" r="62" 
              fill="none" 
              stroke={color} 
              strokeWidth="4" 
              strokeDasharray={`${(currentVal / 100) * 389} 389`}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>

          <div className="flex flex-col items-center justify-center z-10">
            <span className="text-5xl font-black tracking-tighter" style={{ color: color, textShadow: `0 0 20px ${color}40` }}>
              {currentVal}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1 text-center">
              {current.value_classification}
            </span>
          </div>
        </div>
      </div>

      {/* 30-Day Trend Chart */}
      <div className="flex-1 flex flex-col h-[180px]">
        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          30-Day Market Mood Trend
        </div>
        <div className="flex-1 w-full h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase' }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.date;
                  }
                  return label;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
