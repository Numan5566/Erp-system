const fs = require('fs');
const path = require('path');

const p = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Customers.jsx');
let src = fs.readFileSync(p, 'utf-8');

// 1. PRINT RENDER REPLACE
const oldPrintLoop = `                  {calculatedLedgerData.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{index + 1}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{new Date(row.created_at).toLocaleDateString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>#SAL-{row.id}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>
                        {parseFloat(row.total_amount) > 0 ? (
                          (() => {
                            let items = [];
                            try {
                              items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []);
                            } catch (e) { items = []; }
                            return items.map(i => \`\${i.name} (\${i.qty} x Rs.\${i.rate})\`).join(', ');
                          })()
                        ) : \`Payment Received (\${row.payment_type})\`}
                      </td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.total_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.paid_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.running_balance).toLocaleString()}</td>
                    </tr>
                  ))}`;

const newPrintLoop = `                  {calculatedLedgerData.map((row, index) => (
                    <tr key={row.id} style={row.is_opening ? {background: '#f8fafc', fontWeight: 'bold'} : {}}>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{index + 1}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{row.is_opening ? "N/A" : new Date(row.created_at).toLocaleDateString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{row.is_opening ? "—" : \`#SAL-\${row.id}\`}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>
                        {row.is_opening ? (
                          <span style={{color: '#64748b'}}>🔄 {row.custom_label}</span>
                        ) : parseFloat(row.total_amount) > 0 ? (
                          (() => {
                            let items = [];
                            try {
                              items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []);
                            } catch (e) { items = []; }
                            return items.map(i => \`\${i.name} (\${i.qty} x Rs.\${i.rate})\`).join(', ');
                          })()
                        ) : \`Payment Received (\${row.payment_type})\`}
                      </td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{row.is_opening ? "—" : parseFloat(row.total_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{row.is_opening ? "—" : parseFloat(row.paid_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right', fontWeight: 800}}>{parseFloat(row.running_balance).toLocaleString()}</td>
                    </tr>
                  ))}`;

// 2. UI RENDER REPLACE
const oldUiLoopRegex = /calculatedLedgerData\.map\(\(row, index\) => \(\s*<tr key=\{row\.id\}>[\s\S]*?<\/tr>\s*\)\)/;
const newUiLoop = `calculatedLedgerData.map((row, index) => (
                          <tr key={row.id} style={row.is_opening ? {background: '#f8fafc', borderLeft: '4px solid #3b82f6'} : {}}>
                            <td style={{fontWeight: '700', color: '#64748b'}}>{index + 1}</td>
                            <td>{row.is_opening ? "—" : <>{new Date(row.created_at).toLocaleDateString()}<br/><small style={{color:'#64748b'}}>{new Date(row.created_at).toLocaleTimeString()}</small></>}</td>
                            <td>{row.is_opening ? "—" : \`#SAL-\${row.id}\`}</td>
                            <td>
                              {row.is_opening ? (
                                <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#475569', fontWeight:700}}>
                                  <div style={{background:'#eff6ff', padding:'6px', borderRadius:'6px'}}><Info size={16} color="#3b82f6" /></div>
                                  {row.custom_label}
                                </div>
                              ) : parseFloat(row.total_amount) > 0 ? (
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                  <strong>Products Sold:</strong>
                                  {(() => {
                                    let items = [];
                                    try {
                                      items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []);
                                    } catch (e) { items = []; }
                                    
                                    return (
                                      <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                        {items.map((item, idx) => (
                                            <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0'}}>
                                              <span style={{fontSize: '0.8rem', fontWeight: 600, flex: 1}}>{item.name}</span>
                                              <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                                {user?.role === 'admin' ? (
                                                  <>
                                                    <input 
                                                      type="number" 
                                                      defaultValue={item.qty} 
                                                      style={{width: '50px', padding: '2px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px'}}
                                                      onBlur={(e) => {
                                                        if (e.target.value !== String(item.qty)) {
                                                          handleItemUpdate(row.id, item.id, e.target.value, item.rate);
                                                        }
                                                      }}
                                                    />
                                                    <span style={{fontSize: '0.75rem'}}>x</span>
                                                    <input 
                                                      type="number" 
                                                      defaultValue={item.rate} 
                                                      style={{width: '60px', padding: '2px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px'}}
                                                      onBlur={(e) => {
                                                        if (e.target.value !== String(item.rate)) {
                                                          handleItemUpdate(row.id, item.id, item.qty, e.target.value);
                                                        }
                                                      }}
                                                    />
                                                  </>
                                                ) : (
                                                  <span style={{fontSize: '0.8rem', color: '#64748b'}}>{item.qty} x {item.rate}</span>
                                                )}
                                              </div>
                                              <span style={{fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', minWidth: '60px', textAlign: 'right'}}>
                                                Rs. {(parseFloat(item.qty) * parseFloat(item.rate)).toLocaleString()}
                                              </span>
                                            </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <strong><Banknote size={14} style={{color:'#10b981', marginRight:'4px'}}/> Payment Received</strong>
                              )}
                              {!row.is_opening && (
                                <>
                                <br/>
                                <small style={{color:'#64748b'}}>{row.payment_type}</small>
                                </>
                              )}
                            </td>
                            <td className="bold">{row.is_opening ? "—" : \`Rs. \${parseFloat(row.total_amount).toLocaleString()}\`}</td>
                            <td className="text-green">{row.is_opening ? "—" : \`Rs. \${parseFloat(row.paid_amount).toLocaleString()}\`}</td>
                            <td style={{fontWeight: 800, color: '#0f172a', background: '#f1f5f9', textAlign: 'right', paddingRight: '12px'}}>Rs. {parseFloat(row.running_balance).toLocaleString()}</td>
                          </tr>
                        ))`;

src = src.replace(oldPrintLoop, newPrintLoop);
src = src.replace(oldUiLoopRegex, newUiLoop);

fs.writeFileSync(p, src, 'utf-8');
console.log("Successfully injected dynamic specialized rendering logic into Customers Ledger!");
