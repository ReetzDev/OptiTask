import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Landing = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    // Simple credential check before making the API call
    if (formData.email !== "man@gmail.com" || formData.password !== "man123") {
      setErrorMessage("Invalid credentials. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      const url = import.meta.env.VITE_SERVER_URL;
      const res = await axios.post(`${url}/manager/signin`, formData, {
        headers: { "Content-Type": "application/json" },
      });
      const data = res.data;
      localStorage.setItem("authTokenManager", data.token);
      localStorage.setItem("uid", data.user.uid);
      navigate("/manager");
    } catch (error) {
      console.error("Login error:", error.response?.data?.message || error.message);
      setErrorMessage(
        error.response?.data?.message || "Something went wrong. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-black to-gray-800 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Manager Login
        </h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Display error message if any */}
          {errorMessage && (
            <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md transition duration-200 shadow-md ${
              isLoading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Signing In...
              </>
            ) : (
              "Login"
            )}
          </button>

          {/* Sign in with Google (placeholder) */}
          <div className="mt-6">
            <button
              type="button"
              className="w-full flex items-center justify-center bg-white hover:bg-gray-100 text-black font-semibold py-3 rounded-md transition duration-200 shadow-md"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="h-5 w-5 mr-2"
              />
              Sign in with Google
            </button>
          </div>

          {/* Default Credentials inside the form */}
          <div className="mt-4 text-gray-400 text-sm text-center">
            <p>
              <span className="font-bold">Default Credentials:</span><br />
              Email: <span className="font-mono">man@gmail.com</span> &nbsp;|&nbsp; 
              Password: <span className="font-mono">man123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Landing;
