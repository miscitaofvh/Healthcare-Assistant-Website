import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import Home  from './pages/Home';
import About from './pages/About';
import Forum from './pages/Forum';
import Contact from './pages/Contact';

function App() {
    return (
       <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<h1>Page Not Found</h1>} />
            </Routes>
        </Router>
    );
}

export default App;

