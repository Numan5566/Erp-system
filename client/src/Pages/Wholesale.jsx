import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../Styles/Dashboard.scss';

export default function Wholesale() {
  return (
    <div className="dashboard-container">
      <h2>Wholesale Module</h2>
      <p>Manage bulk stock, suppliers, and B2B orders.</p>
    </div>
  );
}
