import React from "react";
import Navbar from "../../components/Navbar";
import "./Home.css";

const Home = () => {
  return (
    <div className="container">
      <Navbar />
      <div className="content">
        {/* Insert pic here */}
        {/* <div className="circle top-right"></div> */}
        {/* <div className="circle bottom-right"></div> */}
      </div>
    </div>
  );
};

export default Home;