import React from 'react';
import { Link } from "react-router-dom";
import './Home.css';

const Home = () => {
  return (
    <div className="container">
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/"> Insert Logo Here</Link>
          <Link to="/news">News</Link>
          <Link to="/forum">Forum</Link>
          <Link to="/products">Pruducts</Link>
          <Link to="/about">About</Link>
        </div>
        <div className="nav-right">
          <div className="search-bar">
            <input type="text" placeholder="Search" />
            <button>Search</button>
          </div>
          <Link to="/contact">Contact</Link>
          <div className="auth-links">
            <Link to="/login">Login</Link>
            /
            <Link to="/register">Register</Link>  
          </div>
        </div>
      </nav>
      <div className="content"></div>
      {
        // Insert pic here
        //<div className="circle top-right"></div>//
        //<div className="circle bottom-right"></div>
      }
    </div>
  );
};

export default Home;
