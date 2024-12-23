'use client';

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorClient } from "../../../hooks/useAnchorClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPage() {
  const { connected } = useWallet();
  const client = useAnchorClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleTest = async () => {
    if (!client || !connected) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await client.testConnection();
      console.log("Test successful:", result);
      setSuccess(result);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Please connect your wallet to test the connection</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Program Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleTest} 
            disabled={loading || !connected}
            className="w-full"
          >
            {loading ? "Testing..." : "Test Connection"}
          </Button>
          {error && (
            <div className="text-red-500 mt-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-500 mt-2">
              {success}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
