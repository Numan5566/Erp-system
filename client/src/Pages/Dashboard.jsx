import React from "react";
import "../styles/Dashboard.scss";

export default function Dashboard() {
  return (
    <div className="dashboard">
      
      <h2>ERP Dashboard</h2>

      {/* 🔥 TOP CARDS */}
      <div className="cards">
        <div className="card">
          <h3>85K</h3>
          <p>Today Sales</p>
        </div>

        <div className="card">
          <h3>120</h3>
          <p>Total Products</p>
        </div>

        <div className="card">
          <h3>45</h3>
          <p>Customers</p>
        </div>

        <div className="card">
          <h3>10</h3>
          <p>Employees</p>
        </div>
      </div>

      {/* 🔥 MODULES */}
      <div className="modules">
        <div className="module wholesale">
          <h3>Wholesale</h3>
          <p>Manage stock & suppliers</p>
        </div>

        <div className="module retail">
          <h3>Retail</h3>
          <p>Manage billing & customers</p>
        </div>
      </div>

    </div>
  );
}