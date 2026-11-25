'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { MarketStats } from '@/components/MarketStats';
import { DashboardHero } from '@/components/DashboardHero';
import { AssetsTable } from '@/components/AssetsTable';
import { NewsStream } from '@/components/NewsStream';
import { Chatbot } from '@/components/Chatbot';
import { Simulator } from '@/components/Simulator';
import { Recommendations } from '@/components/Recommendations';
import { FearAndGreed } from '@/components/FearAndGreed';
import { IndiaTracker } from '@/components/IndiaTracker';
import { Derivatives } from '@/components/Derivatives';
import { Docs } from '@/components/Docs';
import { Debate } from '@/components/Debate';
import { InsiderRadar } from '@/components/InsiderRadar';
import { FraudGraph } from '@/components/FraudGraph';
import { EarningsStress } from '@/components/EarningsStress';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back, here is your portfolio overview.</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <DashboardHero className="h-full" />
              </div>
              <div className="xl:col-span-1">
                <FearAndGreed className="h-full" />
              </div>
            </div>
            
            <div className="flex flex-col gap-6">
              <MarketStats />
              <AssetsTable />
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Global Market News</h1>
              <p className="text-sm text-muted-foreground mt-1">Real-time sentiment and market updates.</p>
            </div>
            <NewsStream />
          </div>
        )}

        {activeTab === 'debate' && (
          <div className="flex-1">
            <Debate />
          </div>
        )}

        {activeTab === 'insider' && (
          <div className="flex-1">
            <InsiderRadar />
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="flex-1">
            <FraudGraph />
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="flex-1">
            <EarningsStress />
          </div>
        )}

        {activeTab === 'chatbot' && (
          <div className="flex-1 h-[800px] flex flex-col max-w-4xl mx-auto w-full">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">FinPilot AI</h1>
            <Chatbot className="flex-1" />
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Simulator</h1>
            <Simulator />
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Recommendations</h1>
            <Recommendations />
          </div>
        )}

        {activeTab === 'india' && (
          <div className="flex-1">
            <IndiaTracker />
          </div>
        )}

        {activeTab === 'derivatives' && (
          <div className="flex-1">
            <Derivatives />
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="flex-1">
            <Docs />
          </div>
        )}

      </main>
    </div>
  );
}
