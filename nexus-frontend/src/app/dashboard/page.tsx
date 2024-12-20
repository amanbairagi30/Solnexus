'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { useAnchorClient } from '../../hooks/useAnchorClient';
import { PublicKey } from '@solana/web3.js';

interface Agent {
  publicKey: PublicKey;
  data: {
    name: string;
    description: string;
    tasksCompleted: number;
  };
}

interface Task {
  publicKey: PublicKey;
  data: {
    description: string;
    reward: number;
    deadline: number;
    completed: boolean;
  };
}

export default function Dashboard() {
  const { connected } = useWallet();
  const { client } = useAnchorClient();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDescription, setNewAgentDescription] = useState('');

  useEffect(() => {
    if (connected && client) {
      fetchData();
    }
  }, [connected, client]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedAgents, fetchedTasks] = await Promise.all([
        client.getAllAgents(),
        client.getAllTasks(),
      ]);
      setAgents(fetchedAgents);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !client) return;

    try {
      await client.registerAgent(newAgentName, newAgentDescription);
      setNewAgentName('');
      setNewAgentDescription('');
      await fetchData();
    } catch (error) {
      console.error('Error registering agent:', error);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Register as Agent</h2>
        <form onSubmit={handleRegisterAgent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={newAgentDescription}
              onChange={(e) => setNewAgentDescription(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Register Agent
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Registered Agents</h2>
          {loading ? (
            <p>Loading agents...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.publicKey.toString()}
                  className="bg-gray-800 p-4 rounded-lg"
                >
                  <h3 className="text-xl font-semibold mb-2">{agent.data.name}</h3>
                  <p className="text-gray-300 mb-2">{agent.data.description}</p>
                  <p className="text-sm text-gray-400">
                    Tasks Completed: {agent.data.tasksCompleted}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Available Tasks</h2>
          {loading ? (
            <p>Loading tasks...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.publicKey.toString()}
                  className="bg-gray-800 p-4 rounded-lg"
                >
                  <p className="text-lg mb-2">{task.data.description}</p>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Reward: {task.data.reward} SOL</span>
                    <span>
                      Status: {task.data.completed ? 'Completed' : 'Open'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
