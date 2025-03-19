import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Managerdash = () => {
  const [taskData, setTaskData] = useState({ task: "", pdf: null, deadline: "" });
  const [taskPreview, setTaskPreview] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [noTeamAvailable, setNoTeamAvailable] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(true);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const uid = localStorage.getItem("uid");
      const token = localStorage.getItem("authTokenManager");
      const response = await axios.post(
        import.meta.env.VITE_SERVER_URL + "/manager/getTasks",
        { uid },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Fetched Tasks:", response.data);
      setTasks(Array.isArray(response.data.tasks) ? response.data.tasks : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleChange = (e) => {
    setTaskData({ ...taskData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setTaskPreview(URL.createObjectURL(file));
      setUploadStatus("Uploading...");
      setUploading(true);
      await uploadToCloudinary(file);
    }
  };

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
      setTaskData((prev) => ({ ...prev, pdf: res.data.secure_url }));
      setUploadStatus("Upload successful!");
    } catch (error) {
      setUploadStatus("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    if (!taskData.pdf) {
      setUploadStatus("Please upload a PDF before submitting.");
      return;
    }

    try {
      const token = localStorage.getItem("authTokenManager");
      const uid = localStorage.getItem("uid");

      if (!token || !uid) {
        setUploadStatus("Not authenticated. Please log in again.");
        return;
      }

      setUploading(true);
      console.log("Task Data:", taskData);
      await axios.post(
        import.meta.env.VITE_SERVER_URL + "/manager/createtask",
        { ...taskData, uid },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage("Task created successfully!");
      setTaskData({ task: "", pdf: null, deadline: "" });
      setTaskPreview(null);
      setUploadStatus("");
      setNoTeamAvailable(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error.response?.data || error.message);
      setNoTeamAvailable(true);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-black to-gray-800 flex flex-col p-6">
      <nav className="w-full bg-gray-900 text-white p-4 flex justify-between items-center rounded-lg shadow-lg">
        <h1 className="text-lg font-semibold">Manager's Dashboard</h1>
        <div>
          <Link to="/DeveloperSignUp">
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
              Create Developer
            </button>
          </Link>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* Create Task Form */}
        <div className="w-full md:w-1/3 bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 max-h-[70vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-white mb-4">Create Task</h2>
          {successMessage && <p className="text-green-400 mb-4">{successMessage}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="task"
              placeholder="Task Name"
              value={taskData.task}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileUpload}
              required
              disabled={uploading}
              className="w-full bg-gray-800 text-gray-300 px-4 py-2 border border-gray-700 rounded-md"
            />
            {uploadStatus && <p className="mt-2 text-sm text-blue-400">{uploadStatus}</p>}
            {taskPreview && (
              <iframe
                src={taskPreview}
                className="w-full h-48 border border-gray-700 rounded-md shadow-md mb-4"
                title="Task Preview"
              ></iframe>
            )}
            <input
              type="date"
              name="deadline"
              value={taskData.deadline}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
            {noTeamAvailable && (
              <p className="text-red-400 mt-2 text-center">No team is available currently.</p>
            )}
            <button
              type="submit"
              disabled={uploading}
              className={`w-full ${uploading ? "bg-gray-600" : "bg-indigo-600 hover:bg-indigo-700"} text-white font-semibold py-3 rounded-md`}
            >
              {uploading ? (
                <div className="w-5 h-5 border-4 border-white border-t-transparent animate-spin rounded-full mx-auto"></div>
              ) : (
                "Create Task"
              )}
            </button>
          </form>
        </div>

        {/* Created Tasks List */}
        <div className="w-full md:w-2/3 bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 overflow-y-auto max-h-[70vh]">
          <h2 className="text-xl font-semibold text-white mb-4">Created Tasks</h2>
          {loadingTasks ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-4 border-white border-t-transparent animate-spin rounded-full mx-auto"></div>
              <p className="mt-2 text-white">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No tasks available</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => navigate(`/managerdash/task?taskId=${task.id}`)}
                  className="w-full text-left p-3 bg-gray-800 border border-gray-700 rounded-md text-white hover:bg-gray-700 transition"
                >
                  <div className="grid grid-cols-12 gap-2 items-center w-full">
                    <div className="col-span-6 font-semibold truncate pr-2">{task.task}</div>
                    <div className="col-span-3 text-center">
                      <span className="bg-green-600 px-2 py-1 rounded-md text-sm inline-block w-full">
                        {task.assignedDevelopers?.length || 0} Developers
                      </span>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="bg-yellow-600 px-2 py-1 rounded-md text-sm inline-block w-full">
                        {formatDate(task.deadline)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Managerdash;
