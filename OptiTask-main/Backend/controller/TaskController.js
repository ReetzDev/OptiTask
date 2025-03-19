const { db } = require('../config/firebase');
const { getDocs, collection, doc, setDoc, writeBatch, updateDoc, arrayUnion,getDoc,arrayRemove } = require("firebase/firestore");
const pdfparse = require('pdf-parse');
const axios = require('axios');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");
dotenv.config();

const createTask = async (req, res) => {
  const { task, description, deadline, uid } = req.body;
  if (!task || !description || !deadline) {
    return res.status(400).json({ message: "Please fill all the fields including tech stack" });
  }

  try {
    // Step 1: Fetch the PDF from Cloudinary and parse it
    const extractedText = description;
    
    // New Step 1.1: Extract tech stack using Gemini API from the task description
    const genAIForTech = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const techModel = genAIForTech.getGenerativeModel({ model: "gemini-2.0-flash" });
    const techstackPrompt = `
      Extract the tech stack from the following task description:
      ${description}
      Return the result as a JSON array of strings.
    `;
    const techstackResponse = await techModel.generateContent(techstackPrompt);
    const techstackResponseText = techstackResponse.response.text();
    const jsonMatchTechstack = techstackResponseText.match(/\[.*\]/s);
    let techstackArray = [];
    if (jsonMatchTechstack) {
      try {
        techstackArray = JSON.parse(jsonMatchTechstack[0]);
      } catch (error) {
        console.error("Error parsing techstack JSON:", error);
      }
    } else {
      console.error("No tech stack found in Gemini response.");
    }

    // Step 2: Fetch available developers
    const developersSnapshot = await getDocs(collection(db, "developers"));
    let availableDevelopers = [];

    developersSnapshot.forEach((doc) => {
      let devData = doc.data();
      if (devData.available) {
        try {
          devData.skills = JSON.parse(
            devData.skills.replace(/```json|```/g, "")
          );
        } catch (error) {
          console.error("Error parsing skills JSON:", error);
          devData.skills = { technical_skills: {} }; // Default skills object if parsing fails
        }
        
        // Updated techstack handling
        try {
          if (devData.techstack) {
            // If it's a string, check if it's a JSON string or just a plain string
            if (typeof devData.techstack === 'string') {
              // If it looks like JSON (starts with [ or {), try to parse it
              if (devData.techstack.trim().startsWith('[') || devData.techstack.trim().startsWith('{')) {
                devData.techstack = JSON.parse(devData.techstack.replace(/```json|```/g, ""));
              } else {
                // Otherwise, treat it as a single technology or comma-separated list
                devData.techstack = devData.techstack.split(',').map(item => item.trim());
              }
            }
            // If it's already an array, leave it as is
          } else {
            devData.techstack = [];
          }
        } catch (error) {
          console.error("Error parsing techstack JSON:", error);
          // If parsing fails, treat the original string as a single technology or comma-separated list
          devData.techstack = typeof devData.techstack === 'string' 
            ? devData.techstack.split(',').map(item => item.trim()) 
            : [];
        }
        
        availableDevelopers.push({ uid: doc.id, email: devData.email, ...devData });
      }
    });

    console.log("Available Developers length : ", availableDevelopers.length);
    if (availableDevelopers.length === 0) {
      return res.status(400).json({ message: "No developers available currently." });
    }

    // Step 3: Prepare request for Gemini API for developer assignment
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Updated Gemini prompt includes the tech stack from the first response
    const geminiPrompt = `
      You are assigning developers to a task.
      TASK:
      - Name: ${task}
      - Description: ${extractedText.substring(0, 500)}... (truncated for brevity)
      - Deadline: ${deadline}
      - Required Tech Stack: ${techstackArray.join(', ')}
      AVAILABLE DEVELOPERS:
      ${availableDevelopers
        .map(
          (dev) =>
            `- ID: ${dev.uid}, Name: ${dev.name}, Email: ${dev.email}, Skills: ${JSON.stringify(
              dev.skills.technical_skills || {}
            )}, Tech Stack: ${Array.isArray(dev.techstack) ? dev.techstack.join(', ') : dev.techstack}`
        )
        .join("\n")}
      INSTRUCTIONS:
      - Return ONLY a JSON array with this format (no explanation, no markdown):
      - Return the developers who are best fit to a task based on their skills, tech stack experience, and overall experience.
      - Prioritize developers whose tech stack matches the required tech stack for this task.
      - If there are more than 4 developers then select the best of 4 among all of them.
      - If less than four developers are best fit for the task then return only those.
      - Always try to assign developers if they can handle the task.
      - Return the developers list sorted from highest fit to lowest fit.
      - You can assign less than 4 developers if the task is lighter and can be handled by fewer developers.
      [{"uid": "developer-id", "name": "developer-name", "email": "developer-email"}]
    `;

    console.log("before");
    const geminiResponse = await model.generateContent(geminiPrompt);
    const responseText = geminiResponse.response.text();
    console.log("after");
    console.log("Gemini Response:", responseText);

    let cleanedResponse = responseText.replace(/```json|```/g, "").trim();
    const jsonMatchAssignment = cleanedResponse.match(/\[.*\]/s);
    let assignedDevelopers = [];
    if (jsonMatchAssignment) {
      try {
        assignedDevelopers = JSON.parse(jsonMatchAssignment[0]);
        console.log("Parsed assigned developers:", assignedDevelopers);
      } catch (error) {
        console.error("Failed to parse Gemini API response:", error);
        console.log("Response text:", responseText);
      }
    }
    if (assignedDevelopers.length > 4) {
      assignedDevelopers = assignedDevelopers.slice(0, 4);
    }
    console.log("Final Assigned Developers (pre-map):", assignedDevelopers);

    // Map Gemini response to actual available developers and include their skills
    assignedDevelopers = assignedDevelopers.map((dev) => {
      const matchedDev = availableDevelopers.find(
        (availDev) => availDev.uid === dev.uid
      );
      if (matchedDev) {
        return {
          uid: matchedDev.uid,
          name: matchedDev.name,
          email: matchedDev.email,
          skills: matchedDev.skills, // Include skills for subtask generation
          techstack: matchedDev.techstack || [] // Include developer's tech stack
        };
      } else {
        const fallbackDev = availableDevelopers[0];
        return {
          uid: fallbackDev.uid,
          name: fallbackDev.name,
          email: fallbackDev.email,
          skills: fallbackDev.skills,
          techstack: fallbackDev.techstack || []
        };
      }
    });

    if (assignedDevelopers.length === 0) {
      return res.status(400).json({ message: "No team is available currently." });
    }
    console.log("Mapped Assigned Developers:", assignedDevelopers);

    // Step 4: Update developer availability in Firestore
    const batch = writeBatch(db);
    assignedDevelopers.forEach((dev) => {
      const devRef = doc(db, "developers", dev.uid);
      batch.update(devRef, { available: false });
    });
    await batch.commit();

    // Step 5: Store Task Data in Firestore (initially without subtasks)
    const taskDocRef = doc(collection(db, "tasks"));
    await setDoc(taskDocRef, {
      task,
      deadline,
      description: extractedText,
      assignedDevelopers: assignedDevelopers.map((dev) => ({
        uid: dev.uid,
        email: dev.email,
        name: dev.name,
        taskStatus: "In Progress",
      })),
      createdAt: new Date().toISOString(),
      createdBy: uid,
    });

    // Step 6: Update Manager's Tasks array with the new task ID
    const managerRef = doc(db, "managers", uid);
    await updateDoc(managerRef, {
      tasks: arrayUnion(taskDocRef.id),
    });

    // Step 7: Update each Developer's Task field with the new task ID
    await Promise.all(
      assignedDevelopers.map(async (dev) => {
        const developerRef = doc(db, "developers", dev.uid);
        
        // Get current techstack from the developer
        const devDoc = await getDoc(developerRef);
        let currentTechstack = '';
        
        if (devDoc.exists()) {
          const devData = devDoc.data();
          currentTechstack = devData.techstack || '';
        }
        
        // Merge existing techstack with new techstack items
        let updatedTechstack = currentTechstack;
        if (currentTechstack) {
          // Convert current techstack to array if it's a string
          const currentTechArray = typeof currentTechstack === 'string' 
            ? currentTechstack.split(',').map(item => item.trim())
            : Array.isArray(currentTechstack) ? currentTechstack : [currentTechstack];
            
          // Merge arrays and remove duplicates
          const combinedTechArray = [...new Set([...currentTechArray, ...techstackArray])];
          updatedTechstack = combinedTechArray.join(', ');
        } else {
          updatedTechstack = techstackArray.join(', ');
        }
        
        await updateDoc(developerRef, {
          task: taskDocRef.id,
          techstack: updatedTechstack // Store as a comma-separated string
        });
      })
    );

    // Step 8: Generate subtasks for each assigned developer using Gemini
    const subtaskPrompt = `
      You are a project management assistant.
      Based on the following task description:
      ${extractedText.substring(0, 500)}... (truncated for brevity)
      
      Task tech stack: ${techstackArray.join(', ')}
      
      And the following developers details:
      ${assignedDevelopers
        .map(
          (dev) =>
            `- UID: ${dev.uid}, Name: ${dev.name}, Email: ${dev.email}, Skills: ${JSON.stringify(
              dev.skills?.technical_skills || {}
            )}, Tech Stack: ${Array.isArray(dev.techstack) ? dev.techstack.join(', ') : dev.techstack}`
        )
        .join("\n")}
      
      Please generate a JSON array where each element is in the format:
      [{"uid": "developer-id", "subtask": "subtask description"}]
      
      When assigning subtasks:
      - Consider each developer's skills and tech stack experience
      - Assign subtasks that align with their expertise in the required tech stack
      - Ensure the subtasks collectively cover all aspects of the project
      - Make subtasks specific and actionable
      
      Return ONLY the JSON array without any additional explanation.
    `;

    const geminiSubtaskResponse = await model.generateContent(subtaskPrompt);
    const subtaskResponseText = geminiSubtaskResponse.response.text();
    console.log("Gemini Subtask Response:", subtaskResponseText);

    // Try to extract JSON array from response if extra text is present
    const jsonMatchSubtask = subtaskResponseText.match(/(\[.*\])/s);
    let subtasks = [];
    if (jsonMatchSubtask) {
      try {
        subtasks = JSON.parse(jsonMatchSubtask[0]);
      } catch (error) {
        console.error("Error parsing subtasks JSON:", error);
      }
    } else {
      console.error("No JSON array found in the subtask response.");
    }

    // Merge subtasks into assignedDevelopers array
    const mergedAssignedDevelopers = assignedDevelopers.map((dev) => {
      const matchingSubtask = subtasks.find((s) => s.uid === dev.uid);
      return {
        ...dev,
        subtask: matchingSubtask ? matchingSubtask.subtask : "",
      };
    });

    // Update the task document with assignedDevelopers that include subtasks
    await updateDoc(taskDocRef, {
      assignedDevelopers: mergedAssignedDevelopers.map((dev) => ({
        uid: dev.uid,
        name: dev.name,
        email: dev.email,
        subtask: dev.subtask,
        techstack: Array.isArray(dev.techstack) ? dev.techstack.join(', ') : dev.techstack // Store as string
      })),
    });

    res.status(200).json({
      message: "Task Created Successfully",
      assignedDevelopers: mergedAssignedDevelopers.map(dev => ({
        ...dev,
        techstack: Array.isArray(dev.techstack) ? dev.techstack : dev.techstack.split(',').map(item => item.trim())
      })),
      teamSize: mergedAssignedDevelopers.length,
      techstack: techstackArray
    });
  } catch (error) {
    console.error("Error in task creation:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



  

const getmanagersTasks = async (req,res) => {
    const { uid } = req.body;
    try{
        const managerRef = doc(db, "managers", uid);
        const managerSnap = await getDoc(managerRef);
        if (!managerSnap.exists()) {
            return res.status(404).json({ message: "Manager not found" });
        }

        const managerData = managerSnap.data();
        const tasks = [];
        for (const taskId of managerData.tasks) {
            const taskRef = doc(db, "tasks", taskId);
            const taskSnap = await getDoc(taskRef);
            if (taskSnap.exists()) {
                tasks.push({ id: taskId, ...taskSnap.data() });
            }
        }

        res.status(200).json({ tasks });
    }catch(error){
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }   
}

const getDevelopersTask = async (req, res) => {
  const { uid } = req.body;
  try {
    const developerRef = doc(db, "developers", uid);
    const developerSnap = await getDoc(developerRef);
    if (!developerSnap.exists()) {
      return res.status(404).json({ message: "Developer not found" });
    }
    console.log(developerSnap.data());
    const developerData = developerSnap.data();
    if (!developerData.task) {
      return res.status(404).json({ message: "No task assigned" });
    }
    const taskRef = doc(db, "tasks", developerData.task);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) {
      return res.status(404).json({ message: "Task not found" });
    }
    const managerId = taskSnap.data().createdBy;
    const managerRef = doc(db, "managers", managerId);
    const managerSnap = await getDoc(managerRef);
    if (!managerSnap.exists()) {
      return res.status(404).json({ message: "Manager not found" });
    }
    const email = managerSnap.data().email;
    const name = managerSnap.data().name;
    console.log(email);

    // Add taskStatus from the task document, or use a default.
    const taskStatus = taskSnap.data().status || "In Progress";

    res.status(200).json({
      id: developerData.task,
      managerId,
      managerEmail: email,
      managerName: name,
      taskStatus, // New field added
      ...taskSnap.data(),
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};


const getTask = async (req,res) => {
    const { taskId } = req.body;
    if (!taskId) {
        return res.status(400).json({ message: "Please provide a task ID" });
    }
    
    try{
        const taskRef = doc(db, "tasks", taskId);
        const taskSnap = await getDoc(taskRef);
        if (!taskSnap.exists()) {
            return res.status(404).json
            ({ message: "Task not found" });
        }
        res.status(200).json({ id: taskId, ...taskSnap.data()
        }); 
    }
    catch(error){
        console.error("Error fetching task:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const changTaskProgress = async (req,res) => {
    const { taskId, status, uid } = req.body;
    if (!taskId || !status || !uid) {
        return res.status(400).json({ message: "Please provide all fields" });
    }
    
    try{
        const taskRef = doc(db, "tasks", taskId);
        const taskSnap = await getDoc(taskRef);
        if (!taskSnap.exists()) {
            return res.status(404).json({ message: "Task not found" });
        }

        const taskData = taskSnap.data();
        const assignedDevelopers = taskData.assignedDevelopers;
        const developerIndex = assignedDevelopers.findIndex((dev) => dev.uid === uid);
        if (developerIndex === -1) {
            return res.status(403).json({ message: "You are not assigned to this task" });
        }

        assignedDevelopers[developerIndex].taskStatus = status;
        await updateDoc(taskRef, { assignedDevelopers });
        res.status(200).json({ message: "Task status updated successfully" });
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}


const deleteTask = async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) {
    return res.status(400).json({ message: "Please provide a task ID" });
  }

  try {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) {
      return res.status(404).json({ message: "Task not found" });
    }

    const taskData = taskSnap.data();
    const assignedDevelopers = taskData.assignedDevelopers;
    const managerId = taskData.createdBy;

    const batch = writeBatch(db);
    assignedDevelopers.forEach((dev) => {
      const devRef = doc(db, "developers", dev.uid);
      batch.update(devRef, { task: "", available: true });
    });
    batch.delete(taskRef);

    const managerRef = doc(db, "managers", managerId);
    // Use arrayRemove to remove the taskId from the manager's tasks array.
    batch.update(managerRef, { tasks: arrayRemove(taskId) });

    await batch.commit();
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


module.exports = { createTask,getmanagersTasks,getDevelopersTask,changTaskProgress,getTask,deleteTask};
