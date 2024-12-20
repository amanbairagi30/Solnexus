import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaAiNexus } from "../target/types/solana_ai_nexus";
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  createMintToInstruction,
  MINT_SIZE,
} from "@solana/spl-token";
import { assert } from "chai";

describe("solana-ai-nexus", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaAiNexus as Program<SolanaAiNexus>;
  
  let state: anchor.web3.Keypair;
  let mint: anchor.web3.Keypair;
  let userTokenAccount: anchor.web3.PublicKey;
  let stakeAccount: anchor.web3.PublicKey;
  
  before(async () => {
    state = anchor.web3.Keypair.generate();
    mint = anchor.web3.Keypair.generate();

    try {
      await program.methods
        .initialize()
        .accounts({
          state: state.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([state])
        .rpc();

      const lamports = await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      const createAccountIx = anchor.web3.SystemProgram.createAccount({
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      });

      const initializeMintIx = createInitializeMintInstruction(
        mint.publicKey,
        9,
        provider.wallet.publicKey,
        null,
        TOKEN_PROGRAM_ID
      );

      userTokenAccount = getAssociatedTokenAddressSync(
        mint.publicKey,
        provider.wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      const createTokenAccountIx = createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        userTokenAccount,
        provider.wallet.publicKey,
        mint.publicKey,
        TOKEN_PROGRAM_ID
      );

      const mintToIx = createMintToInstruction(
        mint.publicKey,
        userTokenAccount,
        provider.wallet.publicKey,
        1000000000,
        [],
        TOKEN_PROGRAM_ID
      );

      const tx = new anchor.web3.Transaction()
        .add(createAccountIx)
        .add(initializeMintIx)
        .add(createTokenAccountIx)
        .add(mintToIx);

      await provider.sendAndConfirm(tx, [mint]);

      stakeAccount = getAssociatedTokenAddressSync(
        mint.publicKey,
        provider.wallet.publicKey,
        true,
        TOKEN_PROGRAM_ID
      );

    } catch (error) {
      console.error("Error in test setup:", error);
      throw error;
    }
  });

  it("Initializes the program state", async () => {
    const stateAccount = await program.account.state.fetch(state.publicKey);
    assert.equal(stateAccount.authority.toString(), provider.wallet.publicKey.toString());
    assert.equal(stateAccount.agentCount, 0);
    assert.equal(stateAccount.taskCount, 0);
  });

  it("Registers an agent", async () => {
    const agent = anchor.web3.Keypair.generate();
    const name = "Test Agent";
    const description = "Test Description";
    const metadataUri = "https://test.uri";

    await program.methods
      .registerAgent(name, description, metadataUri)
      .accounts({
        state: state.publicKey,
        agent: agent.publicKey,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    const agentAccount = await program.account.agent.fetch(agent.publicKey);
    assert.equal(agentAccount.name, name);
    assert.equal(agentAccount.description, description);
    assert.equal(agentAccount.metadataUri, metadataUri);
    assert.equal(agentAccount.reputationScore, 0);
    assert.equal(agentAccount.tasksCompleted, 0);
    assert.equal(agentAccount.isActive, true);
  });

  it("Creates and manages a task", async () => {
    const task = anchor.web3.Keypair.generate();
    const description = "Test Task";
    const reward = new anchor.BN(100);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 3600);

    await program.methods
      .createTask(description, reward, deadline)
      .accounts({
        state: state.publicKey,
        task: task.publicKey,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([task])
      .rpc();

    const taskAccount = await program.account.task.fetch(task.publicKey);
    assert.equal(taskAccount.description, description);
    assert.equal(taskAccount.reward.toString(), reward.toString());
    assert.equal(taskAccount.deadline.toString(), deadline.toString());
    assert.deepEqual(taskAccount.status, { pending: {} });
  });

  it("Stakes tokens", async () => {
    const amount = new anchor.BN(1000000);

    await program.methods
      .stakeTokens(amount)
      .accounts({
        staker: provider.wallet.publicKey,
        userTokenAccount: userTokenAccount,
        stakeAccount: stakeAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  });
});
