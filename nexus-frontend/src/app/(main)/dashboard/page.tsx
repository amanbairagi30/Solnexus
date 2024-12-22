"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { useAnchorClient } from "../../../hooks/useAnchorClient";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, CheckCircle2 } from "lucide-react";

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
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDescription, setNewAgentDescription] = useState("");

  useEffect(() => {
    if (connected && client) {
      fetchData();
    }
  }, [connected, client]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedAgents, fetchedTasks] = await Promise.all([
        client?.getAllAgents(),
        client?.getAllTasks(),
      ]);
      setAgents(fetchedAgents);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !client) return;

    try {
      await client.registerAgent(newAgentName, newAgentDescription);
      setNewAgentName("");
      setNewAgentDescription("");
      await fetchData();
    } catch (error) {
      console.error("Error registering agent:", error);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col w-full items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
        <WalletMultiButton />
      </div>
    );
  }
  const dummyAgents = [
    {
      publicKey: "agent1",
      data: {
        name: "Agent Smith",
        description: "Specializes in data analysis and blockchain optimization",
        tasksCompleted: 15,
        status: "Active",
        rating: 4.8,
      },
    },
    {
      publicKey: "agent2",
      data: {
        name: "Agent Johnson",
        description: "Expert in smart contracts and DeFi protocols",
        tasksCompleted: 23,
        status: "Active",
        rating: 4.9,
      },
    },
    {
      publicKey: "agent3",
      data: {
        name: "Agent Brown",
        description: "Security specialist focusing on audit and compliance",
        tasksCompleted: 8,
        status: "Away",
        rating: 4.5,
      },
    },
  ];

  const dummyTasks = [
    {
      publicKey: "task1",
      data: {
        description: "Develop a new DeFi protocol",
        reward: 5,
        completed: false,
        difficulty: "Hard",
        timeEstimate: "1 week",
        category: "DeFi",
      },
    },
    {
      publicKey: "task2",
      data: {
        description: "Audit smart contract for upcoming NFT marketplace",
        reward: 3,
        completed: true,
        difficulty: "Medium",
        timeEstimate: "3 days",
        category: "Security",
      },
    },
    {
      publicKey: "task3",
      data: {
        description: "Create NFT collection with dynamic metadata",
        reward: 2,
        completed: false,
        difficulty: "Easy",
        timeEstimate: "2 days",
        category: "NFT",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Register Button */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:items-center">
          <h1 className="text-4xl font-bold">Agent Dashboard</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="mr-2 h-4 w-4" />
                Register as Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Register as Agent</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="Enter your agent name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea placeholder="Describe your expertise and capabilities" />
                </div>
                <Button onClick={handleRegisterAgent} className="w-full">
                  Register Agent
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Registered Agents Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-6 w-6" />
            <h2 className="text-2xl font-semibold">Registered Agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dummyAgents.map((agent) => (
              <Card key={agent.publicKey} className="bg-card">
                <CardHeader>
                  <CardTitle>{agent.data.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {agent.data.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {agent.data.tasksCompleted} tasks completed
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Available Tasks Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Available Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dummyTasks.map((task) => (
              <Card key={task.publicKey} className="bg-card">
                <CardContent className="pt-6">
                  <p className="text-lg mb-4">{task.data.description}</p>
                  <div className="flex justify-between items-center">
                    <Badge
                      variant={task.data.completed ? "secondary" : "default"}
                    >
                      {task.data.completed ? "Completed" : "Open"}
                    </Badge>
                    <span className="text-sm font-medium">
                      Reward: {task.data.reward} SOL
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
