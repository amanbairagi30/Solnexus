"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { useAnchorClient } from "../../../hooks/useAnchorClient";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function TestPage() {
  const { connected } = useWallet();
  const { client } = useAnchorClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // Agent Registration Form State
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");

  // Task Creation Form State
  const [taskDescription, setTaskDescription] = useState("");
  const [taskReward, setTaskReward] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  // Task Completion Form State
  const [taskPubkey, setTaskPubkey] = useState("");
  const [taskResult, setTaskResult] = useState("");

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setLoading(true);
    try {
      const tx = await client.registerAgent(agentName, agentDescription);
      setResult(`Successfully registered agent! Transaction: ${tx}`);
      setAgentName("");
      setAgentDescription("");
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
      setTaskDescription("");
      setTaskReward("");
      setTaskDeadline("");
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
      setTaskPubkey("");
      setTaskResult("");
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

      <Card>
        <CardHeader>
          <CardTitle>Register Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegisterAgent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">Name</Label>
              <Input
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentDescription">Description</Label>
              <Textarea
                id="agentDescription"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register Agent"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskReward">Reward (SOL)</Label>
              <Input
                id="taskReward"
                type="number"
                step="0.1"
                value={taskReward}
                onChange={(e) => setTaskReward(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDeadline">Deadline</Label>
              <Input
                id="taskDeadline"
                type="datetime-local"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complete Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCompleteTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskPubkey">Task Public Key</Label>
              <Input
                id="taskPubkey"
                value={taskPubkey}
                onChange={(e) => setTaskPubkey(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskResult">Result</Label>
              <Textarea
                id="taskResult"
                value={taskResult}
                onChange={(e) => setTaskResult(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Completing..." : "Complete Task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Last Operation Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words bg-muted p-4 rounded-lg">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
