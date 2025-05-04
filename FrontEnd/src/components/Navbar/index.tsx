import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaNewspaper, FaComments, FaInfoCircle, FaPhone, FaUser, FaHeartbeat, FaHistory, FaCalendarAlt, FaComment, FaSignOutAlt, FaCaretDown } from "react-icons/fa";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => setIsOpen(false);
  
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(prev => !prev);
  };
  
  const closeDropdown = () => setIsDropdownOpen(false);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    closeDropdown();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    // Add event listener only when dropdown is open
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/">
            <div className="logo"></div>
          </Link>
          <div className={`nav-links ${isOpen ? "mobile-menu" : ""}`}>
            <Link
              to="/article"
              onClick={(e) => {
                e.preventDefault();
                closeMenu();
                if (location.pathname === "/article") {
                  navigate("/article", { replace: true });
                } else {
                  navigate("/article");
                }
              }}
              className={location.pathname === "/article" ? "active" : ""}
            >
              <FaNewspaper /> Article
            </Link>
            <Link
              to="/forum"
              onClick={closeMenu}
              className={location.pathname === "/forum" ? "active" : ""}
            >
              <FaComments /> Forum
            </Link>
            <Link
              to="/about"
              onClick={closeMenu}
              className={location.pathname === "/about" ? "active" : ""}
            >
              <FaInfoCircle /> About
            </Link>
            <Link
              to="/contact"
              onClick={closeMenu}
              className={location.pathname === "/contact" ? "active" : ""}
            >
              <FaPhone /> Contact
            </Link>
          </div>
          <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
            ☰
          </button>
        </div>
        <div className="nav-right">
          <div className="auth-links">
            {user ? (
              <div className="user-dropdown" ref={dropdownRef}>
                <button 
                  className="dropdown-toggle" 
                  onClick={toggleDropdown}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="user-name">Hi {user.username}</span>
                  <FaCaretDown />
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <Link
                      to="/user/profile"
                      className="dropdown-item"
                    >
                      <FaUser /> Hồ sơ cá nhân
                    </Link>
                    <Link
                      to="/user/health-tracking"
                      className="dropdown-item"
                    >
                      <FaHeartbeat /> Theo dõi sức khỏe
                    </Link>
                    <Link
                      to="/user/medical-history"
                      className="dropdown-item"
                    >
                      <FaHistory /> Lịch sử y tế
                    </Link>
                    <Link
                      to="/appointDoctor"
                      className="dropdown-item"
                    >
                      <FaCalendarAlt /> Lịch hẹn
                    </Link>
                    <Link
                      to="/user/chat-history"
                      className="dropdown-item"
                    >
                      <FaComment /> Lịch sử chat
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !(
                location.pathname === "/sign-up" ||
                location.pathname === "/login"
              ) && (
                <>
                  <button
                    onClick={() => openModal("sign-up")}
                    className="btn-sign-up"
                  >
                    Sign up
                  </button>
                  <button
                    onClick={() => openModal("login")}
                    className="btn-log-in"
                  >
                    Log in
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </nav>
      {isOpen && <div className="mobile-overlay" onClick={closeMenu}></div>}
      {isDropdownOpen && (
        <div className="dropdown-overlay" onClick={closeDropdown}></div>
      )}
    </>
  );
};

export default Navbar;
