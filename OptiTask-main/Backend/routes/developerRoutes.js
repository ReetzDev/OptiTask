const express = require('express');
const router = express.Router();
const { DeveloperSignUp, DeveloperSignIn,getAllAvailableDevelopers } = require('../controller/developerAuth');
const {getDevelopersTask ,changTaskProgress } = require('../controller/TaskController');
const { protectRoute } = require('../middleware/authMiddleware');
router.post('/signup', DeveloperSignUp);
router.post('/signin', DeveloperSignIn);


router.post('/myTask',protectRoute,getDevelopersTask);
router.post('/updateTask',protectRoute,changTaskProgress);
router.get('/getAvailableDevelopers',getAllAvailableDevelopers);
module.exports = router;