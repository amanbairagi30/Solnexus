import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { SolanaAiNexus } from '../types/solana_ai_nexus';
import idl from '../../public/solana_ai_nexus.json';

export const PROGRAM_ID = new PublicKey('6gT2Yv1C1RdgN8ABQrbQ9dzzMbKVjLtRJ45ziSkN6nZc');

export class AnchorClient {
  program: Program<SolanaAiNexus>;
  connection: Connection;
  wallet: anchor.Wallet;

  constructor(connection: Connection, wallet: anchor.Wallet) {
    this.connection = connection;
    this.wallet = wallet;

    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    this.program = new Program(
      idl as any,
      PROGRAM_ID,
      provider
    ) as Program<SolanaAiNexus>;
  }

  async registerAgent(name: string, description: string) {
    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .registerAgent(name, description)
      .accounts({
        agent: agentPda,
        authority: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await this.connection.confirmTransaction(tx);
    return tx;
  }

  async createTask(description: string, reward: number, deadline: number) {
    const [taskPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('task'), this.wallet.publicKey.toBuffer(), Buffer.from(Math.random().toString())],
      this.program.programId
    );

    const tx = await this.program.methods
      .createTask(description, new anchor.BN(reward), new anchor.BN(deadline))
      .accounts({
        task: taskPda,
        authority: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await this.connection.confirmTransaction(tx);
    return tx;
  }

  async getAllAgents() {
    const agents = await this.program.account.agent.all();
    return agents.map(agent => ({
      publicKey: agent.publicKey,
      data: {
        name: agent.account.name,
        description: agent.account.description,
        tasksCompleted: agent.account.tasksCompleted.toNumber(),
      }
    }));
  }

  async getAllTasks() {
    const tasks = await this.program.account.task.all();
    return tasks.map(task => ({
      publicKey: task.publicKey,
      data: {
        description: task.account.description,
        reward: task.account.reward.toNumber(),
        deadline: task.account.deadline.toNumber(),
        completed: task.account.completed,
      }
    }));
  }

  async getTask(taskPubkey: PublicKey) {
    const task = await this.program.account.task.fetch(taskPubkey);
    return {
      description: task.description,
      reward: task.reward.toNumber(),
      deadline: task.deadline.toNumber(),
      completed: task.completed,
    };
  }

  async completeTask(taskPubkey: PublicKey, result: string) {
    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .completeTask(result)
      .accounts({
        task: taskPubkey,
        agent: agentPda,
        authority: this.wallet.publicKey,
      })
      .rpc();

    await this.connection.confirmTransaction(tx);
    return tx;
  }
}
