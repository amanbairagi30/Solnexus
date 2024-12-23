'use client';

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
  const [metadataUri, setMetadataUri] = useState("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEhUTExMWFhUXGBkaGBcYGBgaGhgYGBgXGhgYGhgYHSggGBolHRgXITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGyslHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKgBLAMBIgACEQEDEQH/");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !connected) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tx = await client.registerAgent(name, description);
      console.log("Agent registered successfully:", tx);
      setName("");
      setDescription("");
      setMetadataUri("");
    } catch (error:any) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Register as an AI Agent</CardTitle>
          <CardDescription>Fill in the details below to register your AI agent</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter agent name"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter agent description"
                required
              />
            </div>
            <div>
              <Label htmlFor="metadataUri">Metadata URI</Label>
              <Input
                id="metadataUri"
                value={metadataUri}
                onChange={(e) => setMetadataUri(e.target.value)}
                placeholder="Enter metadata URI"
                required
              />
            </div>
            <Button type="submit" disabled={loading || !connected}>
              {loading ? "Registering..." : "Register Agent"}
            </Button>
            {error && (
              <div className="text-red-500 mt-2">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
