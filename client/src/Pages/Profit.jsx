import React, { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  ArrowUpRight, ArrowDownRight, Wallet, ShoppingBag,
  Building2, Store, Briefcase, ChevronRight, Download
} from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/profit/summary";

export default function Profit() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API, {
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(json => { setData(json); setLoading(false); })
    .catch(err => console.error(err));
  }, []);

  if (loading) return <div className="loading-screen">Calculating Financials...</div>;

  const totalSales = Object.values(data).reduce((sum, c) => sum + c.sales, 0);
  const totalExpenses = Object.values(data).reduce((sum, c) => sum + c.totalExpenses, 0);
  const netProfit = totalSales - totalExpenses;

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon profit-icon" style={{background: '#f0fdf4', color: '#16a34a'}}><TrendingUp size={28} /></div>
          <div>
            <h1>Master Profit & Loss</h1>
            <p>Consolidated financial performance across all counters</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => window.print()}>
          <Download size={18} /> Export Report
        </button>
      </div>

      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon blue"><ShoppingBag size={24} /></div>
          <div className="info">
            <span className="label">Gross Sales</span>
            <span className="value">Rs. {totalSales.toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon red"><Wallet size={24} /></div>
          <div className="info">
            <span className="label">Total Expenses</span>
            <span className="value">Rs. {totalExpenses.toLocaleString()}</span>
          </div>
        </div>
        <div className={`pos-stat-card ${netProfit >= 0 ? 'success' : 'danger'}`}>
          <div className={`icon ${netProfit >= 0 ? 'green' : 'orange'}`}><TrendingUp size={24} /></div>
          <div className="info">
            <span className="label">Net Profit</span>
            <span className="value">Rs. {netProfit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="financial-grid">
        {/* Counter Wise Breakdown */}
        {Object.entries(data).map(([name, stats]) => (
          <div key={name} className="counter-profit-card">
            <div className="card-header">
              <div className={`tag-icon ${name.toLowerCase().replace(' ', '')}`}>
                {name === 'Wholesale' ? <Building2 size={20}/> : <Store size={20}/>}
              </div>
              <h3>{name} Counter</h3>
            </div>
            
            <div className="stat-list">
              <div className="stat-item">
                <span>Total Sales</span>
                <span className="val text-green">+ Rs. {stats.sales.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span>Expenses (Op.)</span>
                <span className="val text-red">- Rs. {stats.expenses.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span>Rent & Salary</span>
                <span className="val text-red">- Rs. {(stats.rent + stats.salary).toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span>Misc Costs</span>
                <span className="val text-red">- Rs. {stats.other.toLocaleString()}</span>
              </div>
            </div>

            <div className="card-footer">
               <div className="profit-line">
                 <span>Counter Profit</span>
                 <span className={`profit-val ${stats.netProfit >= 0 ? 'plus' : 'minus'}`}>
                    {stats.netProfit >= 0 ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                    Rs. {stats.netProfit.toLocaleString()}
                 </span>
               </div>
               <div className="progress-bar">
                  <div className="fill" style={{ width: `${Math.min(100, (stats.sales > 0 ? (stats.netProfit / stats.sales) * 100 : 0))}%` }}></div>
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-section">
         <div className="analytics-card">
            <div className="card-title"><PieChart size={18}/> Expense Distribution</div>
            <div className="distribution-list">
               <div className="dist-item">
                  <div className="info"><div className="dot blue"></div> Operational</div>
                  <div className="val">Rs. {Object.values(data).reduce((s, c) => s + c.expenses, 0).toLocaleString()}</div>
               </div>
               <div className="dist-item">
                  <div className="info"><div className="dot orange"></div> Rent & Salaries</div>
                  <div className="val">Rs. {Object.values(data).reduce((s, c) => s + (c.rent + c.salary), 0).toLocaleString()}</div>
               </div>
               <div className="dist-item">
                  <div className="info"><div className="dot red"></div> Other</div>
                  <div className="val">Rs. {Object.values(data).reduce((s, c) => s + c.other, 0).toLocaleString()}</div>
               </div>
            </div>
         </div>

         <div className="analytics-card">
            <div className="card-title"><Briefcase size={18}/> Business Health</div>
            <div className="health-metrics">
               <div className="metric">
                  <span className="label">Profit Margin</span>
                  <span className="value">{(totalSales > 0 ? (netProfit / totalSales) * 100 : 0).toFixed(1)}%</span>
               </div>
               <div className="metric">
                  <span className="label">Expense Ratio</span>
                  <span className="value">{(totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0).toFixed(1)}%</span>
               </div>
            </div>
            <p className="health-tip">
               {netProfit > 0 ? "✅ Your business is generating healthy positive cash flow." : "⚠️ Expenses are exceeding sales. Review operational costs."}
            </p>
         </div>
      </div>
    </div>
  );
}
