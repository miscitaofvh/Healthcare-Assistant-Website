import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { openModal } = useModal();
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="nav-left">
                <Link to="/">
                    <div className="logo"></div>
                </Link>
                <div className={`nav-links ${isOpen ? "mobile-menu" : ""}`}>
                    <Link to="/article">Article</Link>
                    <Link to="/forum">Forum</Link>
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                </div>
                <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>☰</button>
            </div>
            <div className="nav-right">
                <div className="auth-links">
                    {user ? (
                        <>
                            <span className="user-name">Hi {user.username} </span>
                            <button onClick={logout} className="btn-log-out">Logout</button>
                        </>
                    ) : (
                        !(location.pathname === "/sign-up" || location.pathname === "/login") && (
                            <>
                                <button onClick={() => openModal("sign-up")} className="btn-sign-up">Sign up</button>
                                <button onClick={() => openModal("login")} className="btn-log-in">Log in</button>
                            </>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
