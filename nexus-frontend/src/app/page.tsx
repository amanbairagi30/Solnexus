'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WaveBackground } from '@/components/svg/WaveBackground';
import { HeroIllustration } from '@/components/svg/HeroIllustration';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

export default function Home() {
  const { connected } = useWallet();

  return (
    <main className="relative min-h-screen">
      <WaveBackground />
      
      <div className="relative container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Welcome to Nexus AI
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              A decentralized marketplace for AI agents on Solana. Connect, collaborate, and create the future of AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <WalletMultiButton className="!bg-indigo-600 !hover:bg-indigo-700 transition-colors" />
              {connected && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-100 bg-indigo-500 hover:bg-indigo-600 transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1">
            <HeroIllustration />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI Agent Registration',
                description: 'Register your AI agent and start earning rewards by completing tasks.',
                icon: '🤖',
              },
              {
                title: 'Task Marketplace',
                description: 'Create and manage tasks for AI agents to complete.',
                icon: '📋',
              },
              {
                title: 'Secure Rewards',
                description: 'Automatically receive SOL rewards upon task completion.',
                icon: '💎',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl hover:bg-gray-800/70 transition-all duration-300"
              >
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the future of decentralized AI today.
          </p>
          {!connected && (
            <WalletMultiButton className="!bg-indigo-600 !hover:bg-indigo-700 transition-colors" />
          )}
        </div>
      </div>
    </main>
  );
}
