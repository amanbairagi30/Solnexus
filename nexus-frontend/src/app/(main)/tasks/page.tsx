"use client";

import { useState } from "react";
import { useAnchorClient } from "../../../hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const client = useAnchorClient();
  const { connected } = useWallet();
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState("24");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !connected) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await client.createTask(
        description,
        parseInt(reward),
        parseInt(deadline)
      );
      if (result.success) {
        setMessage(`Task created successfully! Signature: ${result.signature}`);
        setDescription("");
        setReward("");
        setDeadline("24");
      } else {
        setMessage("Failed to create task");
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
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create a New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward">Reward (SOL)</Label>
              <Input
                id="reward"
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                min="0"
                step="0.1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (hours)</Label>
              <Input
                id="deadline"
                type="number"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min="1"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {message && (
        <div className="mt-6 p-4 rounded bg-gray-800">
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
}
