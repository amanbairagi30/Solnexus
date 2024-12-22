"use client";

import { useEffect, useState } from "react";
import { useAnchorClient } from "../../../../hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useParams } from "next/navigation";

interface Task {
  creator: PublicKey;
  description: string;
  reward: number;
  deadline: number;
  assignedAgent: PublicKey | null;
  status: "Open" | "Assigned" | "Completed";
  resultUri: string | null;
}

export default function TaskDetailsPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const client = useAnchorClient();
  const { connected, publicKey } = useWallet();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [resultUri, setResultUri] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!client || !connected || !taskId) return;

    const fetchTask = async () => {
      try {
        const taskPubkey = new PublicKey(taskId);
        const result = await client.getTask(taskPubkey);
        if (result.success && result.task) {
          setTask(result.task as unknown as Task);
        }
      } catch (error) {
        console.error("Error fetching task:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [client, connected, taskId]);

  const handleCompleteTask = async () => {
    if (!client || !connected || !task || !resultUri) return;

    setSubmitting(true);
    try {
      const taskPubkey = new PublicKey(taskId);
      const result = await client.completeTask(
        taskPubkey,
        task.assignedAgent!,
        resultUri
      );

      if (result.success) {
        // Refresh task data
        const updatedTask = await client.getTask(taskPubkey);
        if (updatedTask.success && updatedTask.task) {
          setTask(updatedTask.task as unknown as Task);
        }
        setResultUri("");
      }
    } catch (error) {
      console.error("Error completing task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Please connect your wallet</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Task not found</h1>
      </div>
    );
  }

  const isAssignedToMe = task.assignedAgent?.equals(publicKey!);
  const canComplete = task.status === "Assigned" && isAssignedToMe;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 p-8 rounded-lg">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{task.description}</h1>
          <span
            className={`px-4 py-2 rounded text-sm ${
              task.status === "Open"
                ? "bg-green-600"
                : task.status === "Assigned"
                ? "bg-yellow-600"
                : "bg-blue-600"
            }`}
          >
            {task.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-gray-400 mb-2">Reward</h3>
            <p className="text-xl font-semibold">
              {task.reward.toString()} SOL
            </p>
          </div>
          <div>
            <h3 className="text-gray-400 mb-2">Deadline</h3>
            <p className="text-xl font-semibold">
              {new Date(task.deadline * 1000).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="text-gray-400 mb-2">Creator</h3>
            <p className="text-sm font-mono">{task.creator.toString()}</p>
          </div>
          {task.assignedAgent && (
            <div>
              <h3 className="text-gray-400 mb-2">Assigned Agent</h3>
              <p className="text-sm font-mono">
                {task.assignedAgent.toString()}
              </p>
            </div>
          )}
        </div>

        {canComplete && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Complete Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Result URI
                </label>
                <input
                  type="text"
                  value={resultUri}
                  onChange={(e) => setResultUri(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="Enter the URI for your task result"
                />
              </div>
              <button
                onClick={handleCompleteTask}
                disabled={submitting || !resultUri}
                className={`w-full py-3 px-4 rounded font-medium ${
                  submitting || !resultUri
                    ? "bg-blue-600 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {submitting ? "Submitting..." : "Complete Task"}
              </button>
            </div>
          </div>
        )}

        {task.resultUri && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Task Result</h3>
            <a
              href={task.resultUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View Result
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
