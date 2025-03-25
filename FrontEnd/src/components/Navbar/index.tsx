import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="nav-left">
                <Link to="/">
                    <div className="logo"></div>
                </Link>
                <div className={`nav-links ${isOpen ? "mobile-menu" : ""}`}>
                    <Link to="/news">News</Link>
                    <Link to="/forum">Forum</Link>
                    <Link to="/products">Products</Link>
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                </div>
                <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>☰</button>
            </div>
            <div className="nav-right">
                <div className="auth-links">
                    {location.pathname !== "/sign-up" && (
                        <Link to="/sign-up" className="btn-sign-up">Sign up</Link>
                    )}
                    {location.pathname !== "/login" && (
                        <Link to="/login" className="btn-log-in">Log in</Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
