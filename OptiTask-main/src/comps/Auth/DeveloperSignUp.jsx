import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DeveloperSignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    resume: null,
  });
  const [resumePreview, setResumePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadStatusColor, setUploadStatusColor] = useState("text-blue-400");
  const [loading, setLoading] = useState(false); // Loading state for form submission
  const [successMessage, setSuccessMessage] = useState(""); // Success message state

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, resume: file });
      setResumePreview(URL.createObjectURL(file));
      setUploadStatus("Uploading...");
      setUploadStatusColor("text-blue-400");
      await uploadToCloudinary(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_APP_CLOUDINARY_UPLOAD_PRESET;
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);

    try {
      setUploading(true);
      setUploadStatus("Uploading...");
      setUploadStatusColor("text-blue-400");
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        data
      );
      setFormData((prev) => ({ ...prev, resume: res.data.secure_url }));
      setUploadStatus("Upload successful!");
      setUploadStatusColor("text-green-400");
    } catch (error) {
      setUploadStatus("Upload failed. Try again.");
      setUploadStatusColor("text-red-400");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) {
      alert("Please wait for the resume upload to finish.");
      return;
    }

    setLoading(true); // Start loading

    try {
      const res = await axios.post(
        import.meta.env.VITE_SERVER_URL + "/developer/signup",
        formData
      );
      const data = await res.data;
      localStorage.setItem("authTokenDeveloper", data.token);
      localStorage.setItem("uid", data.uid);
      setSuccessMessage("Developer created");
    } catch (error) {
      alert("Signup failed. Try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-black to-gray-800 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-5xl bg-gray-900 p-6 md:p-8 rounded-xl shadow-lg flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
            Create Developer
          </h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white mb-4 disabled:opacity-50"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white mb-4 disabled:opacity-50"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white mb-4 disabled:opacity-50"
            />
            <input
              type="file"
              accept="application/pdf"
              onChange={handleResumeUpload}
              required
              disabled={loading || uploading}
              className="w-full bg-gray-800 text-gray-300 px-4 py-2 border border-gray-700 rounded-md mb-4 disabled:opacity-50"
            />
            {uploadStatus && (
              <p className={`text-center ${uploadStatusColor}`}>
                {uploadStatus}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md transition duration-200 flex justify-center items-center disabled:opacity-50"
              disabled={loading || uploading}
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-4 border-white border-t-transparent rounded-full"></span>
              ) : (
                "Create Developer"
              )}
            </button>
          </form>
          {successMessage && (
            <p className="text-green-400 text-center mt-4">{successMessage}</p>
          )}
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center">
          {resumePreview ? (
            <iframe
              src={resumePreview}
              className="hidden md:block w-full h-96 border border-gray-700 rounded-md shadow-md"
              title="Resume Preview"
            ></iframe>
          ) : (
            <p className="text-gray-400 text-center">
              Developer Profile will appear here after upload.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperSignUp;
