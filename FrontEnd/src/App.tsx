import React from 'react'
import './App.css'
import { Route, Routes } from "react-router-dom";
import Home from './pages/Home';
import About from './pages/About';
import Forum from './pages/Forum';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Test from './pages/Test';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/test" element={<Test />} />
            <Route path="*" element={<h1>Page Not Found</h1>} />
        </Routes>
    );
}

export default App;

