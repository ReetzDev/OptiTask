import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './comps/Landing/Landing'
import ManagerSignUp from './comps/Auth/ManagerSignUp'
import DeveloperSignUp from './comps/Auth/DeveloperSignUp'
import Developerdash from './comps/Dashboard/Developerdash'
import Managerdash from './comps/Dashboard/Managerdash'
import Task from './comps/Dashboard/Task'
import Developers from './comps/Landing/Developers'
import Home from './comps/Landing/Home'
import Dash from './comps/Dashboard/Dash'
function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/Landing' element={<Landing />} />
        <Route path='/developer' element={<Developers />} />
        <Route path='/managerSignUp' element={<ManagerSignUp />} />
        <Route path='/DeveloperSignUp' element={<DeveloperSignUp />} /> 
        <Route path='/developerdash' element={<Developerdash />} />
        <Route path='/manager/task' element={<Task />} />
        <Route path='/manager' element={<Dash />} />
      </Routes>
    </Router>
  )
}

export default App
