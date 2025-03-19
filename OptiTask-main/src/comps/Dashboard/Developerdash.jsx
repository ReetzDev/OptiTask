import React, { useState, useEffect } from "react";
import axios from "axios";

const Developerdash = () => {
  const [assignedTask, setAssignedTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [manager, setManager] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, sender: "Alice", content: "Hello team!" },
    { id: 2, sender: "Charlie", content: "Please check your tasks." },
  ]);
  const [newMessage, setNewMessage] = useState("");
  // New state for task status update (read-only in UI if already Completed)
  const [taskStatus, setTaskStatus] = useState("In Progress");
  // New state to track if the entire page is loading
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Fetch task data from the server and update state.
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const uid = localStorage.getItem("uid");
        const token = localStorage.getItem("authTokenDeveloper");
        const res = await axios.post(
          import.meta.env.VITE_SERVER_URL + "/developer/myTask",
          { uid },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(res.data);

        if (!res.data || !res.data.id) {
          setAssignedTask(null);
          return;
        }

        // Map JSON fields to our state.
        const taskData = {
          id: res.data.id,
          title: res.data.task,
          status: res.data.status || "In Progress",
          deadline: res.data.deadline,
          taskLink: res.data.pdf,
        };

        // Set team members from the assignedDevelopers array.
        const developersFromResponse = res.data.assignedDevelopers || [];
        setTeamMembers(developersFromResponse);

        // Check if the logged-in developer's subtask status is Completed.
        const uidStored = localStorage.getItem("uid");
        const myDev = developersFromResponse.find(
          (member) => member.uid === uidStored
        );
        if (myDev && myDev.taskStatus === "Completed") {
          taskData.status = "Completed";
        }

        // Set task and update local taskStatus state.
        setAssignedTask(taskData);
        setTaskStatus(taskData.status);

        // Set manager details.
        setManager({
          id: res.data.managerId,
          name: res.data.managerName,
          email: res.data.managerEmail,
        });
      } catch (e) {
        console.error("Error fetching task data:", e);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchTask();
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      const message = {
        id: messages.length + 1,
        sender: "You",
        content: newMessage.trim(),
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  // Function to update task status on the backend.
  // This control is only visible if task status is not Completed.
  const handleUpdateStatus = async () => {
    if (!assignedTask) return;
    try {
      const token = localStorage.getItem("authTokenDeveloper");
      const uid = localStorage.getItem("uid");
      console.log(uid, token, assignedTask.id, taskStatus);
      await axios.post(
        import.meta.env.VITE_SERVER_URL + "/developer/updateTask",
        { taskId: assignedTask.id, status: taskStatus, uid: uid },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Task status updated successfully");
      // Update local task status.
      setAssignedTask({ ...assignedTask, status: taskStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    }
  };

  // Fill in vacant team member slots so that there are always 4 items.
  const filledMembers = [
    ...teamMembers,
    ...Array(4 - teamMembers.length).fill({
      uid: null,
      name: "Vacant",
      email: "Not Assigned",
      subtask: "",
    }),
  ];

  // Get the logged-in developer's subtask and name.
  const myUid = localStorage.getItem("uid");
  const mySubtask =
    teamMembers.find((member) => member.uid === myUid)?.subtask ||
    "No subtask assigned";
  const myName =
    teamMembers.find((member) => member.uid === myUid)?.name || "Developer";

  // Display loading effect until the data is ready.
  if (isPageLoading) {
    return (
      <div className="w-screen h-screen bg-gray-800 flex justify-center items-center">
        <p className="text-white text-xl">Loading, please wait...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 p-6 flex flex-col gap-6">
      {/* Navigation Bar */}
      <nav className="w-full bg-indigo-900 text-white p-4 flex justify-between items-center rounded-lg shadow-lg">
        <h1 className="text-lg font-semibold">Developer Dashboard</h1>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200">
          Logout
        </button>
      </nav>

      {/* Developer Welcome Banner */}
      <div className="w-full bg-gray-700 text-white p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-2xl font-bold">Welcome, {myName}!</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        {!assignedTask ? (
          <div className="w-full md:w-1/2 flex justify-center items-center">
            <p className="text-gray-400 text-lg font-semibold">No task assigned</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full md:w-1/2">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col">
              <h2 className="text-xl font-semibold text-white mb-3">Assigned Task</h2>
              <h3 className="text-4xl font-bold text-green-500">{assignedTask.title}</h3>
              <p className="text-white mt-2 font-bold">
                <span className="text-indigo-500 text-xl">Your Subtask: </span> {mySubtask}
              </p>
              {assignedTask.taskLink && (
                <a
                  href={assignedTask.taskLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 underline mt-2 block"
                >
                  Task Link
                </a>
              )}
              <p className="mt-2 text-gray-400">
                Sub Task Status:{" "}
                <span
                  className={`font-bold ${
                    assignedTask.status === "Completed"
                      ? "text-green-500"
                      : assignedTask.status === "In Progress"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {assignedTask.status}
                </span>
              </p>
              {assignedTask.deadline && (
                <p className="text-gray-300 mt-2">Deadline: {assignedTask.deadline}</p>
              )}
              {/* Only show the update input if the task is not Completed */}
              {assignedTask.status !== "Completed" && (
                <div className="mt-4">
                  <label className="text-white font-semibold">Update SubTask Status:</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="ml-2 p-2 bg-gray-800 text-white border border-gray-700 rounded-md"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    className="ml-4 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-200"
                  >
                    Update
                  </button>
                </div>
              )}
              <div className="bg-gray-800 p-4 rounded-md mt-4 border border-gray-600">
                <h2 className="text-lg font-semibold text-white">Manager Details</h2>
                {manager ? (
                  <p className="text-gray-300">
                    <span className="font-bold text-indigo-400">{manager.name}</span>
                    <br />
                    <span className="text-sm text-gray-400">{manager.email}</span>
                  </p>
                ) : (
                  <p className="text-gray-300">Loading manager details...</p>
                )}
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-3">Team Members</h2>
              <ul className="space-y-3">
                {filledMembers.map((member, index) => (
                  <li
                    key={index}
                    className={`p-3 rounded-md border ${
                      member.uid
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-700 border-gray-600"
                    }`}
                  >
                    <p className="text-gray-200 font-bold">{member.name}</p>
                    <p className="text-gray-400 text-sm">{member.email}</p>
                    {member.subtask && (
                      <p className="text-yellow-500 text-sm mt-1">{member.subtask}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Group Chat Container */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full md:w-1/2 border border-gray-700 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4">Group Chat</h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-gray-800 p-3 rounded-md">
                <p className="text-gray-400 text-sm">
                  <strong>{msg.sender}:</strong>
                </p>
                <p className="text-gray-300">{msg.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-white focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-md transition duration-200"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developerdash;
