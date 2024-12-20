'use client';

import { useState } from 'react';
import { useAnchorClient } from '../../hooks/useAnchorClient';
import { useWallet } from '@solana/wallet-adapter-react';

export default function TasksPage() {
  const client = useAnchorClient();
  const { connected } = useWallet();
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [deadline, setDeadline] = useState('24');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !connected) return;

    setLoading(true);
    setMessage('');

    try {
      const result = await client.createTask(
        description,
        parseInt(reward),
        parseInt(deadline)
      );
      if (result.success) {
        setMessage(`Task created successfully! Signature: ${result.signature}`);
        setDescription('');
        setReward('');
        setDeadline('24');
      } else {
        setMessage('Failed to create task');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Please connect your wallet</h1>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create a New Task</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
            rows={4}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Reward (SOL)</label>
          <input
            type="number"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
            min="0"
            step="0.1"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Deadline (hours)</label>
          <input
            type="number"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
            min="1"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded font-medium ${
            loading
              ? 'bg-blue-600 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>

      {message && (
        <div className="mt-6 p-4 rounded bg-gray-800">
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
}
