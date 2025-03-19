const { auth, db } = require('../config/firebase');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { setDoc, doc,getDocs,collection } = require("firebase/firestore");
const pdfparse = require('pdf-parse');
const axios = require('axios');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");
dotenv.config();

const DeveloperSignUp = async (req, res) => {
    const { name, email, password, resume,techstack } = req.body;
    if (!name || !email || !password || !resume) {
        return res.status(400).json({ message: 'Please fill all the fields' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    try {
        // Step 1: Create User in Firebase Auth
        const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredentials.user;
        console.log(user.uid + ' signed up');

        // Step 2: Fetch the Resume from the Cloudinary URL
        const response = await axios.get(resume, { responseType: 'arraybuffer' });

        // Step 3: Parse the Resume using pdf-parse
        const parsedData = await pdfparse(response.data);
        const extractedText = parsedData.text;
        console.log("Extracted Resume Text:", extractedText);

        // Step 4: Send Resume Text to Gemini API for Skill Extraction
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
        You are an AI resume analyzer. Analyze the following resume text and extract technical skills.
        - Identify and categorize all technical skills (Programming, Cloud, Databases, etc.).
        - Rank skills based on experience, project involvement, and explicit mentions.
        - Provide experience duration (e.g., "React: 2 years").
        - Return output in structured JSON format.
        - ${techstack}
        Resume Text:
        """${extractedText}"""
        `;

        const geminiResponse = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const skillsExtracted = geminiResponse.response.candidates[0].content.parts[0].text;
        console.log("Extracted Skills:", skillsExtracted);

        // Step 5: Store Developer Data in Firestore
        await setDoc(doc(db, 'developers', user.uid), {
            name: name,
            email: email,
            resume: resume,
            skills: skillsExtracted,
            available: true,
            techstack: techstack
        });
        console.log('Developer added to Firestore');

        // Step 6: Generate Token Correctly
        const token = await user.getIdToken();
        res.status(200).json({
            message: "Developer Signed Up Successfully",
            token: token, // Return token in response
            skills: skillsExtracted,
            uid: user.uid,
            techstack: techstack
        });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(400).json({ message: error.message });
    }
};

const DeveloperSignIn = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please fill all the fields' });
    }
    try {
        const userCredentials = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredentials.user;
        console.log(user.email + ' signed in');

        // Generate Token Correctly
        const token = await user.getIdToken();
        
        res.status(200).json({
            message: 'Developer Signed In Successfully',
            token: token, // Return token in response
            uid : user.uid
        });
    } catch (error) {
        console.error("Signin Error:", error);
        res.status(400).json({ message: error.message });
    }
};


const getAllAvailableDevelopers = async (req, res) => {
    try {
        const developers = [];
        const querySnapshot = await getDocs(collection(db, 'developers'));
        querySnapshot.forEach((doc) => {
            const developer = doc.data();
            if (developer.available) {
                developers.push(developer);
            }
        });
        res.status(200).json(developers);
    } catch (error) {
        console.error("Get Developers Error:", error);
        res.status(400).json({ message: error.message });
    }
};  

module.exports = { DeveloperSignUp, DeveloperSignIn,getAllAvailableDevelopers };
