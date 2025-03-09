import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="nav-left">
                <Link to="/" className="logo">Insert Logo Here</Link>
                <div className={`nav-links ${isOpen ? "mobile-menu" : ""}`}>
                    <Link to="/news">News</Link>
                    <Link to="/forum">Forum</Link>
                    <Link to="/products">Products</Link>
                    <Link to="/about">About</Link>
                </div>
                <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>☰</button>
            </div>
            <div className="nav-right">
                <div className="auth-links">
                    <Link to="/register" className="btn-sign-up">Sign up</Link><Link to="/login" className="btn-log-in">Log in</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
