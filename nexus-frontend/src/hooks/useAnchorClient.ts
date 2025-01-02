// import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
// import { AnchorClient } from '../client/anchor-client';
// import { useEffect, useState } from 'react';
// import { Wallet } from '@project-serum/anchor';

// export function useAnchorClient() {
//   const { connection } = useConnection();
//   const wallet = useAnchorWallet();
//   const [client, setClient] = useState<AnchorClient | null>(null);

//   useEffect(() => {
//     if (wallet && connection) {
//       try {
//         const newClient = new AnchorClient(connection, wallet as unknown as Wallet);
//         setClient(newClient);
//       } catch (error) {
//         console.error('Error initializing AnchorClient:', error);
//       }
//     } else {
//       setClient(null);
//     }
//   }, [connection, wallet]);

//   return client;
// }
