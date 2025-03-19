import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Home() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-extrabold tracking-wide text-indigo-500">
          OptiTask
        </h1>
        <p className="text-lg text-gray-400 mt-2 max-w-lg">
          AI-Powered Task Assignment System for Optimal Team Efficiency
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-gray-800 rounded-lg p-8 shadow-xl"
      >
        <div className="flex flex-col space-y-6">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/Landing">
              <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg text-lg transition duration-200 shadow-md"
              >
                Manager Portal
              </button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/developer">
              <button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg text-lg transition duration-200 shadow-md"
              >
                Developer Portal
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Home;
