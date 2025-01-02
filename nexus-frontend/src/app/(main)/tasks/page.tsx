"use client";

import { useState, useEffect } from "react";
// import { useAnchorClient } from "../../../hooks/useAnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const { wallet, connected } = useWallet();
  // const client = useAnchorClient();
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("0.1");
  const [deadline, setDeadline] = useState("24");
  const [loading, setLoading] = useState(false);
  const [createTaskError, setCreateTaskError] = useState("");
  const [createTaskSuccess, setCreateTaskSuccess] = useState("");
  const [tasks, setTasks] = useState([]);
  const [taskErrors, setTaskErrors] = useState({});
  const [taskSuccesses, setTaskSuccesses] = useState({});
  const [acceptingTasks, setAcceptingTasks] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [acceptTaskError, setAcceptTaskError] = useState("");
  const [acceptTaskSuccess, setAcceptTaskSuccess] = useState("");
  const [acceptingTask, setAcceptingTask] = useState(false);
  const [resultUri, setResultUri] = useState("");

  // useEffect(() => {
  //   if (client && connected) {
  //     loadTasks();
  //   }
  // }, [client, connected]);

  // const loadTasks = async () => {
  //   try {
  //     const allTasks = await (client as any).getAllTasks();
  //     setTasks(allTasks);
  //   } catch (error) {
  //     console.error("Error loading tasks:", error);
  //   }
  // };

  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   if (!client || !connected) {
  //     setCreateTaskError("Please connect your wallet first");
  //     return;
  //   }

  //   if (!description.trim()) {
  //     setCreateTaskError("Please enter a task description");
  //     return;
  //   }

  //   if (isNaN(parseFloat(reward)) || parseFloat(reward) <= 0) {
  //     setCreateTaskError("Please enter a valid reward amount");
  //     return;
  //   }

  //   if (isNaN(parseInt(deadline)) || parseInt(deadline) <= 0) {
  //     setCreateTaskError("Please enter a valid deadline in hours");
  //     return;
  //   }

  //   setLoading(true);
  //   setCreateTaskError("");
  //   setCreateTaskSuccess("");

  //   try {
  //     const tx = await client.createTask(
  //       description.trim(),
  //       parseFloat(reward),
  //       parseInt(deadline)
  //     );
  //     setCreateTaskSuccess(`Task created successfully! Transaction: ${tx}`);
  //     setDescription("");
  //     setReward("0.1");
  //     setDeadline("24");
  //     await loadTasks(); // Refresh the task list
  //   } catch (error) {
  //     console.error("Error:", error);
  //     setCreateTaskError(error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleAcceptTask = async (task: any) => {
  //   try {
  //     // First, verify wallet connection
  //     if (!connected) {
  //       throw new Error("Wallet not connected");
  //     }

  //     // Make sure the client is initialized
  //     if (!client) {
  //       throw new Error("Anchor client not initialized");
  //     }

  //     // Initialize agent if needed
  //     await client.initializeAgent();

  //     // Accept the task
  //     const tx = await client.acceptTask(task.publicKey);
  //     console.log("Task accepted:", tx);

  //   } catch (error) {
  //     console.error("Error accepting task:", error);
  //     // Add user-friendly error handling here
  //   }
  // };

  // const handleCompleteTask = async (task, result) => {
  //   if (!client || !connected) {
  //     setCreateTaskError("Please connect your wallet first");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     await client.completeTask(task.publicKey, result);
  //     await loadTasks();
  //     setCreateTaskSuccess("Task completed successfully!");
  //     setSelectedTask(null);
  //   } catch (error) {
  //     setCreateTaskError(error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (!connected) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">
              Please connect your wallet to create tasks
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                required
              />
            </div>
            <div>
              <Label htmlFor="reward">Reward (SOL)</Label>
              <Input
                id="reward"
                type="number"
                step="0.1"
                min="0"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="deadline">Deadline (hours)</Label>
              <Input
                id="deadline"
                type="number"
                min="1"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
            {createTaskError && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {createTaskError}
              </div>
            )}
            {createTaskSuccess && (
              <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {createTaskSuccess}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => {
              const taskKey = task.publicKey.toString();
              return (
                <div
                  key={taskKey}
                  className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <h3 className="font-medium">{task.data.description}</h3>
                  <p className="text-sm text-gray-500">
                    Reward: {task.data.reward / 1e9} SOL
                  </p>
                  <p className="text-sm text-gray-500">
                    Status:{" "}
                    <span
                      className={
                        task.data.completed ? "text-green-500" : "text-blue-500"
                      }
                    >
                      {task.data.completed ? "Completed" : "Open"}
                    </span>
                  </p>
                  {!task.data.completed && (
                    <div>
                      <Button
                        // onClick={() => handleAcceptTask(task)}
                        disabled={acceptingTasks[taskKey]}
                        variant="secondary"
                        className="mt-2"
                      >
                        {acceptingTasks[taskKey]
                          ? "Accepting..."
                          : "Accept Task"}
                      </Button>
                      {taskErrors[taskKey] && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                          {taskErrors[taskKey]}
                        </div>
                      )}
                      {taskSuccesses[taskKey] && (
                        <div className="mt-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                          {taskSuccesses[taskKey]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-[500px]">
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{selectedTask.data.description}</p>
              <p className="mb-4">
                Reward: {selectedTask.data.reward / 1e9} SOL
              </p>
              {!selectedTask.data.completed && (
                <div>
                  <Label>Result URI</Label>
                  <Input
                    value={resultUri}
                    onChange={(e) => setResultUri(e.target.value)}
                    placeholder="Enter result URI"
                    className="mb-4"
                  />
                  <Button
                    // onClick={() => handleCompleteTask(selectedTask, resultUri)}
                    disabled={loading}
                    className="mr-2"
                  >
                    Complete Task
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
