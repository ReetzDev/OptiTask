const express = require('express');
const app = express();
const cors = require('cors');
const managerRoutes = require('./routes/managerRoutes');
const developerRoutes = require('./routes/developerRoutes');
const dotenv = require('dotenv');
dotenv.config();

// Middleware
app.use(express.json());
const corsOptions = {
    origin: "*", 
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
};
  
app.use(cors(corsOptions));
  

//routes
app.use('/manager',managerRoutes);
app.use('/developer',developerRoutes);


// Default Route
app.get("/", (req, res) => {
    res.send("Welcome to Firebase Auth API");
});

app.listen(5000,() => {
    console.log('Server is running on port 5000');
});


