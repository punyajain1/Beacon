'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { MarketStats } from '@/components/MarketStats';
import { AssetsTable } from '@/components/AssetsTable';
import { NewsStream } from '@/components/NewsStream';
import { Chatbot } from '@/components/Chatbot';
import { Simulator } from '@/components/Simulator';
import { Recommendations } from '@/components/Recommendations';
import { FearAndGreed } from '@/components/FearAndGreed';
import { IndiaTracker } from '@/components/IndiaTracker';
import { Derivatives } from '@/components/Derivatives';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        
        <div className={activeTab === 'dashboard' ? 'flex flex-col gap-8' : 'hidden'}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back, here is your portfolio overview.</p>
          </div>
          
          <MarketStats />
          <FearAndGreed />
          <div className="flex flex-col gap-8">
            <AssetsTable />
          </div>
        </div>

        <div className={activeTab === 'news' ? 'flex flex-col gap-8' : 'hidden'}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Global Market News</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time sentiment and market updates.</p>
          </div>
          <NewsStream />
        </div>

        <div className={activeTab === 'chatbot' ? 'flex-1 h-[800px] flex flex-col max-w-4xl mx-auto w-full' : 'hidden'}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">FinPilot AI</h1>
          <Chatbot className="flex-1" />
        </div>

        <div className={activeTab === 'simulator' ? 'flex-1' : 'hidden'}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Simulator</h1>
          <Simulator />
        </div>

        <div className={activeTab === 'recommendations' ? 'flex-1' : 'hidden'}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Recommendations</h1>
          <Recommendations />
        </div>

        <div className={activeTab === 'india' ? 'flex-1' : 'hidden'}>
          <IndiaTracker />
        </div>

        <div className={activeTab === 'derivatives' ? 'flex-1' : 'hidden'}>
          <Derivatives />
        </div>

      </main>
    </div>
  );
}
