import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { AnchorClient } from '../utils/anchor-client';

export function useAnchorClient() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [client, setClient] = useState<AnchorClient | null>(null);

  useEffect(() => {
    if (wallet) {
      const newClient = new AnchorClient(connection, wallet);
      setClient(newClient);
    } else {
      setClient(null);
    }
  }, [connection, wallet]);

  return { client };
}
