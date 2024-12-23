"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorClient } from "../../../hooks/useAnchorClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Agent {
  name: string;
  description: string;
  tasksCompleted: number;
}

interface Task {
  description: string;
  reward: number;
  deadline: number;
  completed: boolean;
}

export default function Dashboard() {
  const { connected } = useWallet();
  const client = useAnchorClient();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!client || !connected) {
        setLoading(false);
        return;
      }

      try {
        const [fetchedAgents, fetchedTasks] = await Promise.all([
          client.getAllAgents(),
          client.getAllTasks(),
        ]);

        setAgents(fetchedAgents);
        setTasks(fetchedTasks);
      } catch (err:any) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client, connected]);

  if (!connected) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Please connect your wallet to view the dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registered Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <p className="text-center text-gray-500">No agents registered yet</p>
            ) : (
              <div className="space-y-4">
                {agents.map((agent, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                    <p className="text-sm mt-2">
                      Tasks completed: {agent.tasksCompleted}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-center text-gray-500">No tasks available</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <p>{task.description}</p>
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>Reward: {task.reward} SOL</span>
                      <span>
                        Status: {task.completed ? "Completed" : "Open"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
