'use client';

import { FC, ReactNode } from 'react';
import { ClientWalletProvider } from './WalletProvider';
import { Layout } from './Layout';

interface Props {
  children: ReactNode;
}

export const ClientWrapper: FC<Props> = ({ children }) => {
  return (
    <ClientWalletProvider>
      <Layout>{children}</Layout>
    </ClientWalletProvider>
  );
};
