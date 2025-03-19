import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const Dash = () => {
  const navigate = useNavigate();
  // State for employees and tasks
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      techstack: "React, Node.js, MongoDB",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      techstack: "Angular, Express, PostgreSQL",
    },
    {
      id: 3,
      name: "Alex Johnson",
      email: "alex@example.com",
      techstack: "Vue.js, Python, MySQL",
    },
  ]);

  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: "Implement User Authentication",
      description: "Add JWT auth to the backend API",
      deadline: "2025-03-15",
    },
    {
      id: 2,
      name: "Design Landing Page",
      description: "Create responsive design for the new landing page",
      deadline: "2025-03-20",
    },
  ]);

  // Form states
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    resume: null,
    techstack: "",
  });

  const [managerUid, setManagerUid] = useState("");
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    deadline: "",
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [taskPreview, setTaskPreview] = useState(null);

  // Refresh trigger state to force re-render/re-fetch
  const [refresh, setRefresh] = useState(false);

  // get all tasks
  useEffect(() => {
    const uid = localStorage.getItem("uid");
    setManagerUid(uid);
    const fetchData = async () => {
      const response = await axios.post(
        import.meta.env.VITE_SERVER_URL + "/manager/getTasks",
        { uid }
      );
      const data = response.data;
      const formattedTasks = data.tasks.map((task) => ({
        id: task.id,
        name: task.task, // use 'task' field from response as name/title
        description: task.description || task.text, // support both keys
        deadline: task.deadline,
        assignedDevelopers: task.assignedDevelopers,
      }));
      setTasks(formattedTasks);
      console.log(response.data);
    };
    fetchData();
  }, [refresh]); // Re-fetch tasks when refresh toggles

  // get all available developers
  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        import.meta.env.VITE_SERVER_URL + "/developer/getAvailableDevelopers"
      );
      if (Array.isArray(response.data)) {
        const formattedDevelopers = response.data.map((developer) => ({
          id: developer.id,
          name: developer.name,
          email: developer.email,
          techstack: developer.techstack,
        }));

        console.log(formattedDevelopers); // Log formatted developers
        setEmployees(formattedDevelopers);
      } else {
        console.error("Unexpected response format:", response.data);
      }
    };
    fetchData();
  }, [refresh]); // Re-fetch developers when refresh toggles

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_APP_CLOUDINARY_UPLOAD_PRESET;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      setUploading(true);
      setUploadStatus("Uploading...");
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        formData
      );
      // Set the resume field in newEmployee to the Cloudinary secure URL
      setNewEmployee((prev) => ({ ...prev, resume: res.data.secure_url }));
      setUploadStatus("Upload successful!");
      console.log("Upload successful:", res.data.secure_url);
    } catch (error) {
      setUploadStatus("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // Handle employee creation
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    console.log("New Employee:", newEmployee);

    try {
      const response = await axios.post(
        import.meta.env.VITE_SERVER_URL + "/developer/signup",
        {
          name: newEmployee.name,
          email: newEmployee.email,
          password: newEmployee.password,
          techstack: newEmployee.techstack,
          resume: newEmployee.resume,
        }
      );
      console.log(response.data);
    } catch (err) {
      console.error(err);
    }
    // Reset the form
    setNewEmployee({
      name: "",
      email: "",
      password: "",
      resume: null,
      techstack: "",
    });
    // Toggle refresh to trigger re-fetch and re-render
    setRefresh((prev) => !prev);
  };

  // Handle task creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const id = tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;

    try {
      console.log(
        managerUid,
        newTask.name,
        newTask.deadline,
        newTask.description
      );
      const res = await axios.post(
        import.meta.env.VITE_SERVER_URL + "/manager/createtask",
        {
          uid: managerUid,
          task: newTask.name,
          deadline: newTask.deadline,
          description: newTask.description,
        }
      );
      console.log(res);
    } catch (e) {
      console.log("error in making task" + e);
    }
    // Reset the task form
    setNewTask({ name: "", description: "", deadline: "" });
    // Toggle refresh to trigger re-fetch and re-render
    setRefresh((prev) => !prev);
  };

  // Handle file input change
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Optional: Create a preview URL if you want to show the file before upload
      setTaskPreview(URL.createObjectURL(file));
      await uploadToCloudinary(file);
    }
  };

  // Handle task click (in a real app, this would use a router)
  const handleTaskClick = (taskId) => {
    console.log(`Navigate to task ${taskId}`);
    navigate(`/manager/task?taskId=${taskId}`);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h1 className="font-bold text-xl">Manager Dashboard</h1>
        </div>
        <nav className="mt-8">
          <div className="px-4 mb-3">
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Menu
            </p>
          </div>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-4 py-3 ${
              activeTab === "dashboard" ? "bg-purple-900" : "hover:bg-gray-700"
            }`}
          >
            <svg
              className="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("employees")}
            className={`w-full flex items-center px-4 py-3 ${
              activeTab === "employees" ? "bg-purple-900" : "hover:bg-gray-700"
            }`}
          >
            <svg
              className="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Employees
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`w-full flex items-center px-4 py-3 ${
              activeTab === "tasks" ? "bg-purple-900" : "hover:bg-gray-700"
            }`}
          >
            <svg
              className="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            Tasks
          </button>
        </nav>

        <div className="absolute bottom-0 p-4 w-64">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold">M</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Welcome, Manager</p>
              <p className="text-xs text-gray-400">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Dashboard Overview
              </h1>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Stats Card */}
                <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-600 rounded-md p-3">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-300 truncate">
                          Total Employees
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-white">
                            {employees.length}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Card */}
                <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-600 rounded-md p-3">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-300 truncate">
                          Total Tasks
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-white">
                            {tasks.length}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Card */}
                <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-600 rounded-md p-3">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-300 truncate">
                          Upcoming Deadlines
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-white">
                            {
                              tasks.filter(
                                (task) => new Date(task.deadline) > new Date()
                              ).length
                            }
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employees Section */}
          {activeTab === "employees" && (
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Manage Employees
              </h1>

              {/* Create Employee Form */}
              <div className="mt-6 bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-white">
                  Create New Employee
                </h2>
                <form
                  onSubmit={handleCreateEmployee}
                  className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={newEmployee.name}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, name: e.target.value })
                      }
                      className="mt-1 h-8 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={newEmployee.email}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          email: e.target.value,
                        })
                      }
                      className="mt-1 h-8 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={newEmployee.password}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          password: e.target.value,
                        })
                      }
                      className="mt-1 h-8 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="techstack"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Tech Stack
                    </label>
                    <input
                      type="text"
                      id="techstack"
                      value={newEmployee.techstack}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          techstack: e.target.value,
                        })
                      }
                      className="mt-1 h-8 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white"
                      placeholder="e.g. React, Node.js, MongoDB"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="resume"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Resume
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md bg-gray-700">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX up to 10MB
                        </p>
                      </div>
                    </div>
                    {newEmployee.resume && (
                      <div className="mt-4">
                        <p className="text-white">Uploaded Resume:</p>
                        <a
                          href={newEmployee.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-300 underline"
                        >
                          View PDF
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Create Employee
                    </button>
                  </div>
                </form>
              </div>

              {/* Employees List */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-white">
                  Available Employees
                </h2>
                <div className="mt-4 bg-gray-800 shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-700">
                    {employees.map((employee) => (
                      <li key={employee.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center">
                                <span className="text-purple-700 font-medium">
                                  {employee.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-purple-400">
                                  {employee.name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {employee.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-400">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-900 text-purple-200">
                                Active
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-400">
                                <svg
                                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                  />
                                </svg>
                                {employee.techstack}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Section */}
          {activeTab === "tasks" && (
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Manage Tasks
              </h1>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Create Task Form */}
                <div className="bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-white">
                    Create New Task
                  </h2>
                  <form onSubmit={handleCreateTask} className="mt-4 space-y-6">
                    <div>
                      <label
                        htmlFor="taskName"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Task Name
                      </label>
                      <input
                        type="text"
                        id="taskName"
                        value={newTask.name}
                        onChange={(e) =>
                          setNewTask({ ...newTask, name: e.target.value })
                        }
                        className="mt-1 h-8 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="taskDescription"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Task Description
                      </label>
                      <textarea
                        id="taskDescription"
                        rows="4"
                        value={newTask.description}
                        onChange={(e) =>
                          setNewTask({
                            ...newTask,
                            description: e.target.value,
                          })
                        }
                        className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white"
                        required
                      ></textarea>
                    </div>

                    <div>
                      <label
                        htmlFor="deadline"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Deadline
                      </label>
                      <input
                        type="date"
                        id="deadline"
                        value={newTask.deadline}
                        onChange={(e) =>
                          setNewTask({ ...newTask, deadline: e.target.value })
                        }
                        className="mt-1 h-8 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Create Task
                      </button>
                    </div>
                  </form>
                </div>

                {/* Task Preview */}
                <div className="bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-white">
                    Task Preview
                  </h2>
                  <div className="mt-4">
                    {newTask.name ? (
                      <div className="border border-gray-600 rounded-md p-4 bg-gray-700">
                        <h3 className="text-md font-semibold text-white">
                          {newTask.name}
                        </h3>
                        <p className="mt-2 text-sm text-gray-300">
                          {newTask.description}
                        </p>
                        {newTask.deadline && (
                          <div className="mt-2 flex items-center text-sm text-gray-400">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Deadline:{" "}
                            {new Date(newTask.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Enter task details to see a preview
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-white">All Tasks</h2>
                <div className="mt-4 bg-gray-800 shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-700">
                    {tasks.map((task) => (
                      <li key={task.id}>
                        <button
                          onClick={() => handleTaskClick(task.id)}
                          className="w-full text-left block hover:bg-gray-700"
                        >
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-purple-400 truncate">
                                {task.name}
                              </p>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-200">
                                  Active
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-400">
                                  <svg
                                    className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  {task.description.slice(0, 60)}
                                  {task.description.length > 60 && "..."}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-400 sm:mt-0">
                                <svg
                                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Due on{" "}
                                {new Date(task.deadline).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dash;
