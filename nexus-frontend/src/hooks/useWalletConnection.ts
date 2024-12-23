import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export const useWalletConnection = () => {
  const { connected, connecting, disconnect, connect, publicKey } = useWallet();
  const [attemptingReconnect, setAttemptingReconnect] = useState(false);

  useEffect(() => {
    // Try to restore connection on mount
    const attemptReconnect = async () => {
      if (!connected && !connecting && !attemptingReconnect) {
        setAttemptingReconnect(true);
        try {
          await connect();
        } catch (error) {
          console.error('Failed to reconnect wallet:', error);
        } finally {
          setAttemptingReconnect(false);
        }
      }
    };

    // Check if we should attempt to reconnect
    const shouldReconnect = localStorage.getItem('walletAutoConnect') === 'true';
    if (shouldReconnect) {
      attemptReconnect();
    }
  }, [connect, connected, connecting, attemptingReconnect]);

  // Save connection preference when connecting/disconnecting
  useEffect(() => {
    if (connected) {
      localStorage.setItem('walletAutoConnect', 'true');
    }
  }, [connected]);

  const handleDisconnect = async () => {
    await disconnect();
    localStorage.removeItem('walletAutoConnect');
  };

  return {
    connected,
    connecting: connecting || attemptingReconnect,
    disconnect: handleDisconnect,
    connect,
    publicKey,
  };
};
