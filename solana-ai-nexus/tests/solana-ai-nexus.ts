import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaAiNexus } from "../target/types/solana_ai_nexus";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";

describe("solana-ai-nexus", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaAiNexus as Program<SolanaAiNexus>;
  
  // Test accounts
  let statePda: anchor.web3.PublicKey;
  let stateAccount: anchor.web3.Keypair;
  let governancePda: anchor.web3.PublicKey;
  let mint: anchor.web3.PublicKey;
  let userTokenAccount: anchor.web3.PublicKey;
  let stakeAccount: anchor.web3.PublicKey;
  let rateLimiterPda: anchor.web3.PublicKey;
  let analyticsPda: anchor.web3.PublicKey;
  
  // Test constants
  const MIN_STAKE_FOR_PROPOSAL = new anchor.BN(1000000);
  const VOTING_PERIOD = new anchor.BN(86400); // 1 day in seconds

  before(async () => {
    // Generate keypair for state account
    stateAccount = anchor.web3.Keypair.generate();

    // Find PDAs
    [statePda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("state")],
      program.programId
    );

    [governancePda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("governance")],
      program.programId
    );

    [rateLimiterPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("rate_limiter")],
      program.programId
    );

    [analyticsPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("analytics")],
      program.programId
    );

    try {
      // Initialize program state
      await program.methods
        .initialize()
        .accounts({
          state: stateAccount.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([stateAccount])
        .rpc();

      // Create token mint
      const mintKeypair = anchor.web3.Keypair.generate();
      
      // Create mint
      mint = await createMint(
        provider.connection,
        provider.wallet.payer,
        provider.wallet.publicKey,
        null,
        9,
        mintKeypair
      );

      // Create user token account
      userTokenAccount = await getAssociatedTokenAddress(
        mint,
        provider.wallet.publicKey
      );

      await createAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        mint,
        provider.wallet.publicKey
      );

      // Initialize rate limiter and analytics with PDAs
      await program.methods
        .initializeRateLimiter()
        .accounts({
          rateLimiter: rateLimiterPda,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .initializeAnalytics()
        .accounts({
          analytics: analyticsPda,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Mint tokens to user
      await mintTo(
        provider.connection,
        provider.wallet.payer,
        mint,
        userTokenAccount,
        provider.wallet.publicKey,
        1000000000
      );

    } catch (error) {
      console.error("Error in test setup:", error);
      throw error;
    }
  });

  it("Initializes the program state", async () => {
    await program.methods
      .initialize()
      .accounts({
        state: stateAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([stateAccount])
      .rpc();

    const state = await program.account.state.fetch(statePda);
    assert.equal(state.authority.toString(), provider.wallet.publicKey.toString());
    assert.equal(state.agentCount.toNumber(), 0);
    assert.equal(state.taskCount.toNumber(), 0);
  });

  it("Registers an AI agent", async () => {
    const agent = anchor.web3.Keypair.generate();
    
    await program.methods
      .registerAgent(
        "Test Agent",
        "Test Description",
        "https://metadata.uri"
      )
      .accounts({
        state: statePda,
        agent: agent.publicKey,
        owner: provider.wallet.publicKey,
        rateLimiter: rateLimiterPda,
        analytics: analyticsPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    const agentAccount = await program.account.agent.fetch(agent.publicKey);
    assert.equal(agentAccount.name, "Test Agent");
    assert.equal(agentAccount.description, "Test Description");
    assert.equal(agentAccount.metadataUri, "https://metadata.uri");
    assert.equal(agentAccount.isActive, true);
    assert.equal(agentAccount.reputationScore, 0);
    assert.equal(agentAccount.tasksCompleted, 0);

    // Verify analytics update
    const analytics = await program.account.analytics.fetch(analyticsPda);
    assert.equal(analytics.totalAgentsRegistered.toNumber(), 1);
  });

  it("Creates and manages a task", async () => {
    const task = anchor.web3.Keypair.generate();
    const agent = anchor.web3.Keypair.generate();
    
    // First register an agent
    await program.methods
      .registerAgent(
        "Task Agent",
        "Task Agent Description",
        "https://metadata.uri"
      )
      .accounts({
        state: statePda,
        agent: agent.publicKey,
        owner: provider.wallet.publicKey,
        rateLimiter: rateLimiterPda,
        analytics: analyticsPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    // Create task
    const taskReward = new anchor.BN(100);
    const taskDeadline = new anchor.BN(Date.now() / 1000 + 86400);
    
    await program.methods
      .createTask(
        "Test Task",
        taskReward,
        taskDeadline
      )
      .accounts({
        state: statePda,
        task: task.publicKey,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([task])
      .rpc();

    let taskAccount = await program.account.task.fetch(task.publicKey);
    assert.equal(taskAccount.description, "Test Task");
    assert.equal(taskAccount.reward.toNumber(), taskReward.toNumber());
    assert.equal(taskAccount.status.toString(), "Pending");

    // Assign task
    await program.methods
      .assignTask(0)
      .accounts({
        task: task.publicKey,
        agent: agent.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    taskAccount = await program.account.task.fetch(task.publicKey);
    assert.equal(taskAccount.status.toString(), "InProgress");
    assert.equal(taskAccount.agentId.toString(), "0");

    // Complete task
    await program.methods
      .completeTask("https://result.uri")
      .accounts({
        task: task.publicKey,
        agent: agent.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    taskAccount = await program.account.task.fetch(task.publicKey);
    assert.equal(taskAccount.status.toString(), "Completed");
    assert.equal(taskAccount.resultUri, "https://result.uri");

    // Verify agent's tasks completed count
    const agentAccount = await program.account.agent.fetch(agent.publicKey);
    assert.equal(agentAccount.tasksCompleted.toNumber(), 1);
  });

  it("Stakes tokens and creates a proposal", async () => {
    const proposal = anchor.web3.Keypair.generate();
    
    // Stake tokens
    await program.methods
      .stakeTokens(new anchor.BN(2000000))
      .accounts({
        staker: provider.wallet.publicKey,
        userTokenAccount,
        stakeAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Create proposal
    await program.methods
      .createProposal(
        "Test Proposal",
        new anchor.BN(86400)
      )
      .accounts({
        governance: governancePda,
        proposal: proposal.publicKey,
        proposer: provider.wallet.publicKey,
        stakeAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proposal])
      .rpc();

    const proposalAccount = await program.account.proposal.fetch(proposal.publicKey);
    assert.equal(proposalAccount.description, "Test Proposal");
    assert.equal(proposalAccount.status.toString(), "Active");
  });

  it("Votes on a proposal", async () => {
    const proposal = anchor.web3.Keypair.generate();
    
    // Create proposal first
    await program.methods
      .createProposal(
        "Voting Test Proposal",
        new anchor.BN(86400)
      )
      .accounts({
        governance: governancePda,
        proposal: proposal.publicKey,
        proposer: provider.wallet.publicKey,
        stakeAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proposal])
      .rpc();

    // Vote on proposal
    await program.methods
      .vote(true)
      .accounts({
        proposal: proposal.publicKey,
        voter: provider.wallet.publicKey,
        stakeAccount,
      })
      .rpc();

    const proposalAccount = await program.account.proposal.fetch(proposal.publicKey);
    assert.equal(proposalAccount.votesFor.toNumber(), 1);
  });

  it("Updates agent reputation", async () => {
    const agent = anchor.web3.Keypair.generate();
    
    // Register agent first
    await program.methods
      .registerAgent(
        "Reputation Test Agent",
        "Description",
        "https://metadata.uri"
      )
      .accounts({
        state: statePda,
        agent: agent.publicKey,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    // Update reputation
    await program.methods
      .updateReputation(0, 10)
      .accounts({
        state: statePda,
        agent: agent.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const agentAccount = await program.account.agent.fetch(agent.publicKey);
    assert.equal(agentAccount.reputationScore, 10);
  });

  describe("Rate limiting and batch processing", () => {
    it("Should enforce rate limits", async () => {
      const agent = anchor.web3.Keypair.generate();
      
      // Should succeed first time
      await program.methods
        .registerAgent("Test Agent", "Description", "uri")
        .accounts({
          state: statePda,
          agent: agent.publicKey,
          owner: provider.wallet.publicKey,
          rateLimiter: rateLimiterPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([agent])
        .rpc();

      // Should fail on rapid subsequent attempts
      try {
        await program.methods
          .registerAgent("Test Agent 2", "Description", "uri")
          .accounts({
            state: statePda,
            agent: agent.publicKey,
            owner: provider.wallet.publicKey,
            rateLimiter: rateLimiterPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([agent])
          .rpc();
        assert.fail("Should have thrown rate limit error");
      } catch (e) {
        assert.include(e.message, "Rate limit exceeded");
      }
    });

    it("Should process tasks in batch", async () => {
      const taskIds = [1, 2, 3];
      await program.methods
        .batchProcessTasks(taskIds)
        .accounts({
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    });
  });

  describe("Error handling and recovery", () => {
    it("Should handle and recover from errors", async () => {
      const errorLog = anchor.web3.Keypair.generate();
      
      // Create error log
      await program.methods
        .handleErrorRecovery(new anchor.BN(1))
        .accounts({
          errorLog: errorLog.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([errorLog])
        .rpc();

      const errorLogAccount = await program.account.errorLog.fetch(errorLog.publicKey);
      assert.equal(errorLogAccount.recoveryStatus.toString(), "Recovered");
      assert.equal(errorLogAccount.recoveryAttempts, 1);
    });
  });

  describe("System health monitoring", () => {
    it("Should update system health metrics", async () => {
      const systemHealth = anchor.web3.Keypair.generate();
      
      await program.methods
        .updateSystemHealth()
        .accounts({
          systemHealth: systemHealth.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([systemHealth])
        .rpc();

      const healthAccount = await program.account.systemHealth.fetch(systemHealth.publicKey);
      assert.equal(healthAccount.systemStatus.toString(), "Healthy");
      assert.isNumber(healthAccount.errorRate);
      assert.isNumber(healthAccount.averageResponseTime);
    });
  });

  describe("DeFi operations", () => {
    it("Should handle flash loans correctly", async () => {
      // Flash loan tests
    });
    
    it("Should respect slippage tolerance", async () => {
      // Slippage tests
    });
  });

  describe("Oracle operations", () => {
    it("Should properly integrate with Pyth", async () => {
      // Setup Pyth mock
      const pythPrice = new anchor.BN(1500e6); // $1500 USD
      const pythConfidence = new anchor.BN(1e4);
      
      // Test price update
      await program.methods
        .updatePythPrice()
        .accounts({
          oracle: oracle.publicKey,
          pythPriceAccount: pythMock.publicKey,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      const oracleAccount = await program.account.priceOracle.fetch(oracle.publicKey);
      assert.ok(oracleAccount.priceFeed.price.eq(pythPrice));
    });

    it("Should trigger circuit breaker on extreme conditions", async () => {
      // Setup extreme price change
      const initialPrice = new anchor.BN(1500e6);
      const extremePrice = new anchor.BN(3000e6);
      
      try {
        await program.methods
          .updatePrice(extremePrice)
          .accounts({
            oracle: oracle.publicKey,
            authority: provider.wallet.publicKey,
          })
          .rpc();
        assert.fail("Should have triggered circuit breaker");
      } catch (err) {
        assert.include(err.message, "CircuitBreakerTriggered");
      }
    });

    // Add more test cases...
  });
});
