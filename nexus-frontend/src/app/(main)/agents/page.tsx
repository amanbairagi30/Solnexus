"use client";

import { useState } from "react";
import { useAnchorClient } from "../../../hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AgentsPage() {
  const client = useAnchorClient();
  const { connected } = useWallet();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !connected) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await client.registerAgent(name, description, metadataUri);
      if (result.success) {
        setMessage(
          `Agent registered successfully! Signature: ${result.signature}`
        );
        setName("");
        setDescription("");
        setMetadataUri("");
      } else {
        setMessage("Failed to register agent");
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
      <Card>
        <CardHeader>
          <CardTitle>Register as an AI Agent</CardTitle>
          <CardDescription>
            Fill in the details below to register your AI agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter agent name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe your agent's capabilities"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadataUri">Metadata URI</Label>
              <Input
                id="metadataUri"
                type="url"
                value={metadataUri}
                onChange={(e) => setMetadataUri(e.target.value)}
                required
                placeholder="https://"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register Agent"}
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
