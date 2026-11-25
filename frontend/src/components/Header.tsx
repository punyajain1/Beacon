'use client';

import { useState } from 'react';
import {
  Activity,
  LayoutDashboard,
  Target,
  Beaker,
  FileText,
  MessageSquare,
  Newspaper,
  MapPin,
  Flame,
  Menu,
  X,
  Scale,
  Radar,
  Network,
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Newspaper, label: 'News', id: 'news' },
  { icon: Scale, label: 'AI Debate', id: 'debate' },
  { icon: Radar, label: 'Insider Radar', id: 'insider' },
  { icon: Network, label: 'Mule Rings', id: 'fraud' },
  { icon: Mic, label: 'Earnings Stress', id: 'earnings' },
  { icon: Target, label: 'Recommendations', id: 'recommendations' },
  { icon: Beaker, label: 'Simulator', id: 'simulator' },
  { icon: MapPin, label: 'India Hub', id: 'india' },
  { icon: Flame, label: 'Futures', id: 'derivatives' },
  { icon: MessageSquare, label: 'Chatbot', id: 'chatbot' },
  { icon: FileText, label: 'Docs', id: 'docs' },
];

export function Header({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="relative flex w-full items-center justify-between gap-4 py-3 px-4 md:px-6 bg-card border-b border-border">
      {/* Brand (pinned, never shrinks or scrolls off-screen) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shrink-0">
          <Activity size={17} />
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
          Beacon
        </h1>
        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
            Live
          </span>
        </div>
      </div>

      {/* Desktop Nav (single-line pills, scrolls cleanly inside itself on tighter widths) */}
      <nav className="hidden lg:flex flex-1 min-w-0 items-center gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors',
              activeTab === item.id
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            <item.icon size={14} className="shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Menu Toggle */}
      <button
        className="lg:hidden p-2 text-foreground shrink-0"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-card border-b border-border shadow-lg lg:hidden flex flex-col p-4 gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors w-full text-left',
                activeTab === item.id
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <item.icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
