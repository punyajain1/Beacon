'use client';

import { Activity, Bell, Search, LayoutDashboard, Target, Beaker, FileText, MessageSquare, Newspaper, MapPin, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Newspaper, label: 'News', id: 'news' },
  { icon: Target, label: 'Recommendations', id: 'recommendations' },
  { icon: Beaker, label: 'Simulator', id: 'simulator' },
  { icon: MapPin, label: 'India Hub', id: 'india' },
  { icon: Flame, label: 'Futures', id: 'derivatives' },
  { icon: MessageSquare, label: 'Chatbot', id: 'chatbot' },
  { icon: FileText, label: 'Docs', id: 'docs' },
];

export function Header({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  return (
    <header className="flex w-full items-center justify-between py-4 px-6 bg-card border-b border-border">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 mr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            <Activity size={18} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Beacon</h1>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === item.id
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

    </header>
  );
}
