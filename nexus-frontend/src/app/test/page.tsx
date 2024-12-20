'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { useAnchorClient } from '../../hooks/useAnchorClient';
import { PublicKey } from '@solana/web3.js';

export default function TestPage() {
  const { connected } = useWallet();
  const { client } = useAnchorClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // Agent Registration Form State
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');

  // Task Creation Form State
  const [taskDescription, setTaskDescription] = useState('');
  const [taskReward, setTaskReward] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');

  // Task Completion Form State
  const [taskPubkey, setTaskPubkey] = useState('');
  const [taskResult, setTaskResult] = useState('');

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    
    setLoading(true);
    try {
      const tx = await client.registerAgent(agentName, agentDescription);
      setResult(`Successfully registered agent! Transaction: ${tx}`);
      setAgentName('');
      setAgentDescription('');
    } catch (error) {
      setResult(`Error registering agent: ${error}`);
    }
    setLoading(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    
    setLoading(true);
    try {
      const deadline = Math.floor(new Date(taskDeadline).getTime() / 1000);
      const tx = await client.createTask(
        taskDescription,
        parseFloat(taskReward),
        deadline
      );
      setResult(`Successfully created task! Transaction: ${tx}`);
      setTaskDescription('');
      setTaskReward('');
      setTaskDeadline('');
    } catch (error) {
      setResult(`Error creating task: ${error}`);
    }
    setLoading(false);
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    
    setLoading(true);
    try {
      const tx = await client.completeTask(
        new PublicKey(taskPubkey),
        taskResult
      );
      setResult(`Successfully completed task! Transaction: ${tx}`);
      setTaskPubkey('');
      setTaskResult('');
    } catch (error) {
      setResult(`Error completing task: ${error}`);
    }
    setLoading(false);
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Solana AI Nexus Test Page</h1>
        <WalletMultiButton />
      </div>

      {/* Agent Registration */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Register Agent</h2>
        <form onSubmit={handleRegisterAgent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={agentDescription}
              onChange={(e) => setAgentDescription(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register Agent'}
          </button>
        </form>
      </div>

      {/* Task Creation */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Create Task</h2>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reward (SOL)</label>
            <input
              type="number"
              step="0.1"
              value={taskReward}
              onChange={(e) => setTaskReward(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <input
              type="datetime-local"
              value={taskDeadline}
              onChange={(e) => setTaskDeadline(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>

      {/* Task Completion */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Complete Task</h2>
        <form onSubmit={handleCompleteTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Task Public Key</label>
            <input
              type="text"
              value={taskPubkey}
              onChange={(e) => setTaskPubkey(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Result</label>
            <textarea
              value={taskResult}
              onChange={(e) => setTaskResult(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Completing...' : 'Complete Task'}
          </button>
        </form>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Last Operation Result</h2>
          <pre className="whitespace-pre-wrap break-words">{result}</pre>
        </div>
      )}
    </div>
  );
}
