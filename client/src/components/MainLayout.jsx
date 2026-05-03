import React from 'react';
import Sidebar from './Sidebar';
import "../Styles/MainLayout.scss";

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-area">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
