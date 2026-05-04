import "./Styles/global.scss";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import MainLayout from "./components/MainLayout";

import LoginPage from "./Pages/LoginPage.jsx";
import ForgotPassword from "./Pages/ForgotPassword.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Products from "./Pages/Products.jsx";
import Stock from "./Pages/Stock.jsx";
import Billing from "./Pages/Billing.jsx";
import Customers from "./Pages/Customers.jsx";
import Suppliers from "./Pages/Suppliers.jsx";
import Transport from "./Pages/Transport.jsx";
import Expenses from "./Pages/Expenses.jsx";
import Salary from "./Pages/Salary.jsx";
import Profit from "./Pages/Profit.jsx";
import UsersManager from "./Pages/UsersManager.jsx";
import Wholesale from "./Pages/Wholesale.jsx";
import Retail1 from "./Pages/Retail1.jsx";
import Retail2 from "./Pages/Retail2.jsx";
import Rent from "./Pages/Rent.jsx";
import Investment from "./Pages/Investment.jsx";
import OtherExpenses from "./Pages/OtherExpenses.jsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          
          {/* Protected Routes inside MainLayout */}
          <Route path="/dashboard" element={<PrivateRoute><MainLayout><Dashboard /></MainLayout></PrivateRoute>} />
          <Route path="/wholesale" element={<PrivateRoute><MainLayout><Wholesale /></MainLayout></PrivateRoute>} />
          <Route path="/retail1" element={<PrivateRoute><MainLayout><Retail1 /></MainLayout></PrivateRoute>} />
          <Route path="/retail2" element={<PrivateRoute><MainLayout><Retail2 /></MainLayout></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><MainLayout><Products /></MainLayout></PrivateRoute>} />
          <Route path="/stock" element={<PrivateRoute><MainLayout><Stock /></MainLayout></PrivateRoute>} />
          <Route path="/billing" element={<PrivateRoute><MainLayout><Billing /></MainLayout></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><MainLayout><Customers /></MainLayout></PrivateRoute>} />
          <Route path="/suppliers" element={<PrivateRoute><MainLayout><Suppliers /></MainLayout></PrivateRoute>} />
          <Route path="/transport" element={<PrivateRoute><MainLayout><Transport /></MainLayout></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><MainLayout><Expenses /></MainLayout></PrivateRoute>} />
          <Route path="/salary" element={<PrivateRoute><MainLayout><Salary /></MainLayout></PrivateRoute>} />
          <Route path="/profit" element={<PrivateRoute><MainLayout><Profit /></MainLayout></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><MainLayout><UsersManager /></MainLayout></PrivateRoute>} />
          <Route path="/rent" element={<PrivateRoute><MainLayout><Rent /></MainLayout></PrivateRoute>} />
          <Route path="/investment" element={<PrivateRoute><MainLayout><Investment /></MainLayout></PrivateRoute>} />
          <Route path="/other-expenses" element={<PrivateRoute><MainLayout><OtherExpenses /></MainLayout></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;