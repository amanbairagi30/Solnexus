// import * as anchor from '@project-serum/anchor';
// import { Program } from '@project-serum/anchor';
// import { Connection, PublicKey } from '@solana/web3.js';
// import { SolanaAiNexus } from '../types/solana_ai_nexus';
// import idl from '../../public/solana_ai_nexus.json';

// export const PROGRAM_ID = new PublicKey('6gT2Yv1C1RdgN8ABQrbQ9dzzMbKVjLtRJ45ziSkN6nZc');

// export class AnchorClient {
//   program: Program<SolanaAiNexus>;
//   connection: Connection;
//   wallet: anchor.Wallet;

//   constructor(connection: Connection, wallet: anchor.Wallet) {
//     this.connection = connection;
//     this.wallet = wallet;

//     const provider = new anchor.AnchorProvider(connection, wallet, {
//       commitment: 'confirmed',
//     });

//     this.program = new Program(
//       idl as any,
//       PROGRAM_ID,
//       provider
//     ) as Program<SolanaAiNexus>;
//   }

//   async initialize() {
//     if (!this.wallet.publicKey) {
//       throw new Error('Wallet not connected');
//     }

//     // For initialization, we need a regular keypair since state must be a signer
//     const stateKeypair = anchor.web3.Keypair.generate();

//     try {
//       const tx = await this.program.methods
//         .initialize()
//         .accounts({
//           state: stateKeypair.publicKey,
//           authority: this.wallet.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([stateKeypair])
//         .rpc();

//       await this.connection.confirmTransaction(tx);
//       return tx;
//     } catch (error) {
//       console.error('Error in initialize:', error);
//       throw error;
//     }
//   }

//   async getStateAddress() {
//     return this.program.account.state.all()
//       .then(accounts => accounts[0]?.publicKey);
//   }

//   async ensureInitialized() {
//     if (!this.wallet.publicKey) {
//       throw new Error('Wallet not connected');
//     }

//     try {
//       const stateAddress = await this.getStateAddress();
//       if (!stateAddress) {
//         await this.initialize();
//       }
//     } catch (error) {
//       console.error('Error checking state:', error);
//       await this.initialize();
//     }
//   }

//   async registerAgent(name: string, description: string) {
//     if (!this.wallet.publicKey) {
//       throw new Error('Wallet not connected');
//     }

//     // Generate a new keypair for the agent account
//     const agentKeypair = anchor.web3.Keypair.generate();

//     try {
//       // Ensure program is initialized and get state address
//       await this.ensureInitialized();
//       const stateAddress = await this.getStateAddress();
//       if (!stateAddress) {
//         throw new Error('Failed to get state address');
//       }

//       const tx = await this.program.methods
//         .registerAgent(
//           name,
//           description,
//           "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEhUTExMWFhUXGBkaGBcYGBgaGhgYGBgXGhgYGhgYHSggGBolHRgXITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGyslHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKgBLAMBIgACEQEDEQH/"
//         )
//         .accounts({
//           state: stateAddress,
//           agent: agentKeypair.publicKey,
//           owner: this.wallet.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([agentKeypair])
//         .rpc();

//       await this.connection.confirmTransaction(tx);
//       return tx;
//     } catch (error) {
//       console.error('Error in registerAgent:', error);
//       throw error;
//     }
//   }

//   async createTask(description: string, reward: number, deadline: number) {
//     if (!this.wallet.publicKey) {
//       throw new Error('Wallet not connected');
//     }

//     try {
//       // Ensure program is initialized and get state address
//       await this.ensureInitialized();
//       const stateAddress = await this.getStateAddress();
//       if (!stateAddress) {
//         throw new Error('Failed to get state address');
//       }

//       // Generate a new keypair for the task
//       const taskKeypair = anchor.web3.Keypair.generate();

//       const tx = await this.program.methods
//         .createTask(
//           description,
//           new anchor.BN(reward * anchor.web3.LAMPORTS_PER_SOL),
//           new anchor.BN(deadline)
//         )
//         .accounts({
//           state: stateAddress,
//           task: taskKeypair.publicKey,
//           creator: this.wallet.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([taskKeypair])
//         .rpc();

//       await this.connection.confirmTransaction(tx);
//       return tx;
//     } catch (error) {
//       console.error('Error in createTask:', error);
//       throw error;
//     }
//   }

//   async getAllAgents(): Promise<any[]> {
//     const agents = await this.program.account.agent.all();
//     return agents.map(agent => ({
//       id: agent.account.id.toString(),
//       owner: agent.account.owner.toString(),
//       name: agent.account.name,
//       description: agent.account.description,
//       metadataUri: agent.account.metadataUri,
//       reputationScore: agent.account.reputationScore,
//       tasksCompleted: agent.account.tasksCompleted,
//       isActive: agent.account.isActive,
//       publicKey: agent.publicKey.toString()
//     }));
//   }

//   async getAllTasks() {
//     const tasks = await this.program.account.task.all();
//     return tasks.map(task => ({
//       publicKey: task.publicKey,
//       data: {
//         description: task.account.description,
//         reward: task.account.reward.toNumber(),
//         deadline: task.account.deadline.toNumber(),
//         completed: task.account.completed,
//       }
//     }));
//   }

//   async getTask(taskPubkey: PublicKey) {
//     const task = await this.program.account.task.fetch(taskPubkey);
//     return {
//       description: task.description,
//       reward: task.reward.toNumber(),
//       deadline: task.deadline.toNumber(),
//       completed: task.completed,
//     };
//   }

//   async completeTask(taskPubkey: PublicKey, result: string) {
//     const [agentPda] = PublicKey.findProgramAddressSync(
//       [Buffer.from('agent'), this.wallet.publicKey.toBuffer()],
//       this.program.programId
//     );

//     const tx = await this.program.methods
//       .completeTask(result)
//       .accounts({
//         task: taskPubkey,
//         agent: agentPda,
//         authority: this.wallet.publicKey,
//       })
//       .rpc();

//     await this.connection.confirmTransaction(tx);
//     return tx;
//   }

//   public async initializeAgent(): Promise<void> {
//     try {
//       if (!this.wallet || !this.wallet.publicKey) {
//         console.error('Wallet not connected');
//         throw new Error('Wallet not connected');
//       }

//       console.log('Initializing agent for wallet:', this.wallet.publicKey.toString());

//       const stateAddress = await this.getStateAddress();
//       console.log('State address:', stateAddress);
//       if (!stateAddress) {
//         throw new Error('Failed to get state address');
//       }

//       // Generate a new keypair for the agent account
//       const agentKeypair = anchor.web3.Keypair.generate();

//       const tx = await this.program.methods
//         .registerAgent(
//           "Agent", // Default name
//           "Auto-registered agent", // Default description
//           "" // Default metadata URI
//         )
//         .accounts({
//           state: stateAddress,
//           agent: agentKeypair.publicKey,
//           owner: this.wallet.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([agentKeypair]) // Remove this.wallet from signers
//         .rpc();

//       console.log('Transaction details:', tx);
//       await this.connection.confirmTransaction(tx);
//       console.log('Agent initialized successfully:', tx);
//       return tx;
//     } catch (error) {
//       console.error('Error in initializeAgent:', error);
//       throw error;
//     }
//   }

//   async acceptTask(taskPublicKey: PublicKey) {
//     if (!this.wallet.publicKey) {
//       console.error('Wallet not connected');
//       throw new Error('Wallet not connected');
//     }

//     console.log('Accepting task with public key:', taskPublicKey.toString());

//     try {
//       const [agentAddress] = await anchor.web3.PublicKey.findProgramAddress(
//         [Buffer.from('agent'), this.wallet.publicKey.toBuffer()],
//         this.program.programId
//       );
//       console.log('Agent address:', agentAddress.toString());

//       let agentData;
//       try {
//         agentData = await this.program.account.agent.fetch(agentAddress);
//         console.log('Agent data:', agentData);
//       } catch (error) {
//         console.log('Agent not found, registering...');
//         await this.initializeAgent();
//         agentData = await this.program.account.agent.fetch(agentAddress);
//         console.log('Registered agent data:', agentData);
//       }

//       // Check if agentData is defined and has the expected structure
//       if (!agentData || !agentData.id) {
//         throw new Error('Agent data is not defined or does not have an ID.');
//       }

//       const stateAddress = await this.getStateAddress();
//       console.log('State address:', stateAddress);
//       if (!stateAddress) {
//         throw new Error('Failed to get state address');
//       }

//       // Log the accounts being passed to the transaction
//       console.log('Accounts for transaction:', {
//         state: stateAddress,
//         task: taskPublicKey,
//         agent: agentAddress,
//         assignee: this.wallet.publicKey,
//       });

//       const tx = await this.program.methods
//         .assignTask(agentData.id)
//         .accounts({
//           state: stateAddress,
//           task: taskPublicKey,
//           agent: agentAddress,
//           assignee: this.wallet.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([this.wallet]) // Include wallet as signer
//         .rpc();

//       console.log('Transaction details:', tx);
//       await this.connection.confirmTransaction(tx);
//       console.log('Task accepted successfully:', tx);
//       return tx;
//     } catch (error) {
//       console.error('Error in acceptTask:', error);
//       throw error;
//     }
//   }

//   async testConnection() {
//     if (!this.wallet.publicKey) {
//       throw new Error('Wallet not connected');
//     }

//     try {
//       // Ensure program is initialized and get state address
//       await this.ensureInitialized();
//       const stateAddress = await this.getStateAddress();
//       if (!stateAddress) {
//         throw new Error('Failed to get state address');
//       }

//       // Fetch the state account to verify connection
//       const state = await this.program.account.state.fetch(stateAddress);
//       return `Successfully connected to program. Authority: ${state.authority.toString()}`;
//     } catch (error) {
//       console.error('Error testing connection:', error);
//       throw error;
//     }
//   }
// }
