import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { FiSend, FiTrash2, FiUserCheck, FiAlertCircle } from "react-icons/fi";

const Task = () => {
  const [assignedTask, setAssignedTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [messages, setMessages] = useState([
    { sender: "System", text: "Task discussion started", timestamp: new Date().toISOString() },
    {
      sender: "John Doe",
      text: "I'll start working on the frontend components",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      sender: "Jane Smith",
      text: "I'll set up the API endpoints",
      timestamp: new Date(Date.now() - 2700000).toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const currentSender = "Manager";
  
  // Local state for task progress (we set to 100 if completed, else 50)
  const [taskProgress, setTaskProgress] = useState(50);
  // New state for deletion flag
  const [isDeleted, setIsDeleted] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const devsContainerRef = useRef(null);
  
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("taskId");
  
  // Auto-scroll to bottom when new messages are added.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Fetch task data using the taskId from the URL.
  useEffect(() => {
    const fetchTask = async () => {
      try {
        console.log("Task ID:", taskId);
        const res = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/manager/getTask`,
          { taskId }
        );
        console.log("Task Response:", res.data);
  
        if (!res.data || !res.data.id) {
          setAssignedTask(null);
          return;
        }
  
        // Determine overall task status based on assigned developers.
        const developersFromResponse = res.data.assignedDevelopers || [];
        const allCompleted =
          developersFromResponse.length > 0 &&
          developersFromResponse.every(
            (dev) => (dev.taskStatus || "In Progress") === "Completed"
          );
        const overallStatus = allCompleted ? "Completed" : "In Progress";
  
        const taskData = {
          id: res.data.id,
          title: res.data.task,
          status: res.data.taskStatus || overallStatus,
          deadline: res.data.deadline,
          taskLink: res.data.pdf,
          text: res.data.text,
          createdBy: res.data.createdBy,
          createdAt: res.data.createdAt,
        };
  
        setAssignedTask(taskData);
        setTaskProgress(overallStatus === "Completed" ? 100 : 50);
        setTeamMembers(developersFromResponse);
      } catch (e) {
        console.error("Error fetching task data:", e);
      }
    };
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);
  
  const sendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        sender: currentSender,
        text: newMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Delete task without auth header.
  const handleDeleteTask = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/manager/deleteTask`,
          { taskId: assignedTask.id }
        );
        alert("Task deleted successfully");
        // Set deletion flag to true so that UI shows deletion message.
        setIsDeleted(true);
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task");
      }
    }
  };
  
  // Ensure there are always 4 team members.
  const filledMembers = [
    ...teamMembers,
    ...Array(Math.max(0, 4 - teamMembers.length)).fill({
      uid: null,
      name: "Vacant",
      email: "Not Assigned",
      subtask: "",
    }),
  ];
  
  // Get the logged-in developer's subtask.
  const myUid = localStorage.getItem("uid");
  const mySubtask =
    teamMembers.find((member) => member.uid === myUid)?.subtask || "No subtask assigned";
  
  // If task has been deleted, show a centered message.
  if (isDeleted) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
        <p className="text-3xl text-red-500 font-bold">Task has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col p-6 space-y-6">
      {/* Task Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-6 rounded-2xl shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {assignedTask?.title || "Task Details"}
            </h1>
            <div className="flex flex-wrap gap-3 items-center">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                assignedTask?.status === "Completed" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {assignedTask?.status || "Loading..."}
              </span>
              <div className="flex items-center gap-2 text-purple-200">
                <FiAlertCircle className="flex-shrink-0" />
                <span>Deadline: {assignedTask?.deadline || "N/A"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDeleteTask}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-xl transition-all"
          >
            <FiTrash2 className="text-lg" />
            Delete Task
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
        {/* Team Section */}
        <div className="w-full lg:w-1/3 bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <FiUserCheck className="text-purple-400" />
            Team Members
          </h2>
          <div ref={devsContainerRef} className="flex-1 overflow-y-auto pr-2 space-y-4">
            {filledMembers.map((dev, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl transition-all ${
                  dev.uid ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-800"
                } border border-gray-600`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-white">{dev.name}</span>
                      {dev.techStack && (
                        <span className="text-xs text-purple-300 bg-purple-900 px-2 py-1 rounded-full">
                          {dev.techStack}
                        </span>
                      )}
                    </div>
                    {dev.uid ? (
                      <>
                        <p className="text-sm text-gray-300 mb-2">
                          <span className="font-semibold">Subtask:</span> {dev.subtask}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            dev.taskStatus === "Completed" 
                              ? "bg-green-500/30 text-green-400" 
                              : "bg-yellow-500/30 text-yellow-400"
                          }`}>
                            {dev.taskStatus || "In Progress"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-400 italic">Unassigned</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-6">Task Discussion</h2>
          <div ref={chatContainerRef} className="flex-1 bg-gray-900 p-4 rounded-xl overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.sender === currentSender ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.sender === "System" 
                    ? "bg-gray-700 text-gray-300" 
                    : msg.sender === currentSender 
                      ? "bg-purple-600 text-white" 
                      : "bg-gray-700 text-white"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${
                      msg.sender === "System" ? "text-gray-400" : "text-purple-200"
                    }`}>
                      {msg.sender}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="mt-6 flex gap-4">
            <textarea
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="2"
            />
            <button
              onClick={sendMessage}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-2 transition-all"
            >
              <FiSend className="text-lg" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Task;