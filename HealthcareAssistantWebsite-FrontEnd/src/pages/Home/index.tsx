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
          <Link to="/contact">Contact</Link>
          <button className="login-btn">Login / Register</button>
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
