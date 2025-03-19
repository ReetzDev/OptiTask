# Opti-Task: Automated Employee Task Assignment System

🚀 [Live Demo](https://opti-task.vercel.app/)

## Overview

Opti-Task is a web application built with the MERN stack that automates the assignment of tasks to employees using the Gemini AI model. The system ensures that tasks are allocated efficiently based on employees' skills, availability, and workload. The app utilizes Firebase for authentication, Cloudinary for resume storage, and provides an intuitive interface for both managers and developers.

## Features

### 🔹 For Managers:
- **Create and Manage Tasks**: Define tasks with descriptions, required skills, and deadlines.
- **Automated Task Assignment**: Gemini AI intelligently assigns tasks to the most suitable employees.
- **Real-Time Task Monitoring**: Track task progress and reassign tasks if needed.
- **Developer Management**: View available developers and their skills.

### 🔹 For Developers:
- **Dashboard View**: See assigned tasks and update progress.
- **Skill-Based Task Assignment**: Receive tasks that match expertise.
- **Resume Upload**: Upload resumes during registration for AI-based skill extraction.

## Tech Stack

- **Frontend:** React, Axios, TailwindCSS  
- **Backend:** Node.js, Express.js, Firebase  
- **Database:** Firestore  
- **AI Integration:** Gemini API for skill-based task assignment  
- **Authentication:** Firebase Authentication  
- **File Storage:** Cloudinary for storing resumes  
- **Deployment:** Vercel (Frontend), Render (Backend)  

## Installation & Setup

### 🔧 Prerequisites
Ensure you have the following installed:
- Node.js
- Firestore
- Firebase Project Setup (for authentication)
- Cloudinary Account (for file storage)

### 🚀 Steps to Run Locally

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/optitask.git
   cd optitask
   npm install
   npm run dev
   cd Backend
   npm install
   nodemon server.js
