'use client';

import dynamic from 'next/dynamic';
import { FC, ReactNode } from 'react';
import { Layout } from './Layout';

interface Props {
  children: ReactNode;
}

// Dynamically import WalletProvider with no SSR
const WalletProviderComponent = dynamic(
  () => import('./WalletProvider').then(mod => ({ default: mod.ClientWalletProvider })),
  { 
    ssr: false,
    loading: () => <div>Loading wallet...</div>
  }
);

export const ClientWrapper: FC<Props> = ({ children }) => {
  return (
    <WalletProviderComponent>
      <Layout>{children}</Layout>
    </WalletProviderComponent>
  );
};
