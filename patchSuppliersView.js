const fs = require('fs');
const path = require('path');

const p = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Suppliers.jsx');
let src = fs.readFileSync(p, 'utf-8');

// 1. Replace simple memo with powerful backtracking memo!
const oldMemo = `  const sortedLedgerData = useMemo(() => {
    return [...ledgerData].sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));
  }, [ledgerData]);`;

const newMemo = `  const calculatedLedgerData = useMemo(() => {
    if (!selectedSupplier) return [];
    
    const sortedAsc = [...ledgerData].sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));
    
    const totalLedgerEffect = sortedAsc.reduce((sum, row) => {
      return sum + (parseFloat(row.total_amount || 0) - parseFloat(row.paid_amount || 0));
    }, 0);
    
    const startingPoint = parseFloat(selectedSupplier.balance || 0) - totalLedgerEffect;
    
    const openingRow = {
      id: 'opening-bal-synthetic',
      purchase_date: sortedAsc.length > 0 ? new Date(new Date(sortedAsc[0].purchase_date).getTime() - 1000 * 60).toISOString() : new Date().toISOString(),
      total_amount: 0,
      paid_amount: 0,
      is_opening: true,
      custom_label: 'Opening Balance / Brought Forward',
      running_balance: startingPoint
    };
    
    let currentTracker = startingPoint;
    const withRunning = sortedAsc.map(row => {
      currentTracker += (parseFloat(row.total_amount || 0) - parseFloat(row.paid_amount || 0));
      return { ...row, running_balance: currentTracker };
    });
    
    return [openingRow, ...withRunning];
  }, [ledgerData, selectedSupplier]);`;

src = src.replace(oldMemo, newMemo);

// 2. Rename variables in loop
src = src.replace(/sortedLedgerData\.length/g, 'calculatedLedgerData.length');

// 3. Update PRINT mapping
const oldPrintLoop = `                  {sortedLedgerData.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{index + 1}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{new Date(row.purchase_date).toLocaleDateString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>
                        {row.product_name ? \`\${row.product_name} (\${row.quantity} \${row.unit})\` : row.vehicle_number || 'Payment'}
                      </td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.total_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.paid_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.balance_amount).toLocaleString()}</td>
                    </tr>
                  ))}`;

const newPrintLoop = `                  {calculatedLedgerData.map((row, index) => (
                    <tr key={row.id} style={row.is_opening ? {background: '#f8fafc', fontWeight: 'bold'} : {}}>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{index + 1}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{row.is_opening ? "N/A" : new Date(row.purchase_date).toLocaleDateString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>
                        {row.is_opening ? <span style={{color: '#64748b'}}>🔄 {row.custom_label}</span> : 
                         (row.product_name ? \`\${row.product_name} (\${row.quantity} \${row.unit})\` : row.vehicle_number || 'Payment')}
                      </td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{row.is_opening ? "—" : parseFloat(row.total_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{row.is_opening ? "—" : parseFloat(row.paid_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right', fontWeight: 800}}>{parseFloat(row.running_balance).toLocaleString()}</td>
                    </tr>
                  ))}`;

src = src.replace(oldPrintLoop, newPrintLoop);

// 4. Update UI mapping
const oldUiLoopRegex = /sortedLedgerData\.map\(\(row, index\) => \(\s*<tr key=\{row\.id\}>[\s\S]*?<\/tr>\s*\)\)/;
const newUiLoop = `calculatedLedgerData.map((row, index) => (
                          <tr key={row.id} style={row.is_opening ? {background: '#f8fafc', borderLeft: '4px solid #f59e0b'} : {}}>
                            <td style={{fontWeight: '700', color: '#64748b'}}>{index + 1}</td>
                            <td>{row.is_opening ? "—" : <>{new Date(row.purchase_date).toLocaleDateString()}<br/><small style={{color:'#64748b'}}>{new Date(row.purchase_date).toLocaleTimeString()}</small></>}</td>
                            <td>
                              {row.is_opening ? (
                                <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#475569', fontWeight:700}}>
                                  <div style={{background:'#fff7ed', padding:'6px', borderRadius:'6px'}}><FileText size={16} color="#f59e0b" /></div>
                                  {row.custom_label}
                                </div>
                              ) : row.product_name ? (
                                <>
                                  <strong>{row.brand} {row.product_name}</strong>
                                  <br/><small style={{color:'#64748b'}}><Truck size={10}/> {row.vehicle_number || 'N/A'}</small>
                                </>
                              ) : (
                                <strong><Banknote size={14} style={{color:'#10b981', marginRight:'4px'}}/> {row.vehicle_number || 'Payment Sent'}</strong>
                              )}
                            </td>
                            <td style={{padding: '16px'}}>
                              {row.is_opening ? <span style={{color:'#64748b'}}>—</span> :
                               parseFloat(row.total_amount) > 0 ? (
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                  {user?.role === 'admin' ? (
                                    <>
                                      <input 
                                        type="number" 
                                        defaultValue={row.quantity} 
                                        style={{width: '60px', padding: '4px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px'}}
                                        onBlur={(e) => {
                                          if (e.target.value !== String(row.quantity)) {
                                            handleEntryUpdate(row.id, e.target.value, row.rate);
                                          }
                                        }}
                                      />
                                      <span style={{fontSize: '0.75rem', color: '#64748b'}}>{row.unit} @ Rs.</span>
                                      <input 
                                        type="number" 
                                        defaultValue={row.rate} 
                                        style={{width: '80px', padding: '4px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px'}}
                                        onBlur={(e) => {
                                          if (e.target.value !== String(row.rate)) {
                                            handleEntryUpdate(row.id, row.quantity, e.target.value);
                                          }
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <span style={{fontSize: '0.9rem', color: '#1e293b', fontWeight: 600}}>
                                      {row.quantity} {row.unit} @ Rs. {row.rate}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{color: '#64748b', fontSize: '0.9rem'}}>—</span>
                              )}
                            </td>
                            <td className="bold">{row.is_opening ? "—" : \`Rs. \${parseFloat(row.total_amount).toLocaleString()}\`}</td>
                            <td className="text-green">{row.is_opening ? "—" : \`Rs. \${parseFloat(row.paid_amount).toLocaleString()}\`}</td>
                            <td style={{fontWeight: 800, color: '#0f172a', background: '#fffbeb', textAlign: 'right', paddingRight: '12px'}}>Rs. {parseFloat(row.running_balance).toLocaleString()}</td>
                          </tr>
                        ))`;

src = src.replace(oldUiLoopRegex, newUiLoop);

// 5. Update Header from "Balance Impact" to "Running Balance"
src = src.replace('<th>Balance Impact</th>', '<th style={{textAlign: "right"}}>Running Balance</th>');
src = src.replace('<th>Balance</th>', '<th style={{textAlign: "right"}}>Running Balance</th>');

fs.writeFileSync(p, src, 'utf-8');
console.log("SUCCESS: Suppliers file perfectly mirrored from Customers math.");
