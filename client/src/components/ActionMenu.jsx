import React, { useRef, useContext, useState } from 'react';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { AuthContext } from '../context/AuthContext';

/**
 * Reusable 3-dot kebab action menu for DataTable rows.
 * Props:
 *   onEdit    — callback for edit action
 *   onDelete  — callback for delete action
 *   extraItems — (optional) additional menu items array
 */
export default function ActionMenu({ onEdit, onDelete, extraItems = [], bypassConfirm }) {
  const menuRef = useRef(null);
  const { user } = useContext(AuthContext);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);

  const isAdmin = user?.email === 'admin@erp.com';

  const items = [
    ...(onEdit ? [{
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: (e) => onEdit(e.originalEvent),
      disabled: !isAdmin,
    }] : []),
    ...(onDelete ? [{
      label: 'Delete',
      icon: 'pi pi-trash',
      command: (e) => {
        if (bypassConfirm) {
          onDelete(e.originalEvent);
        } else {
          setPendingEvent(e.originalEvent);
          setShowConfirm(true);
        }
      },
      style: { color: isAdmin ? '#e11d48' : '#cbd5e1' },
      disabled: !isAdmin,
    }] : []),
    ...extraItems,
  ];

  return (
    <>
      <Menu
        model={items}
        popup
        ref={menuRef}
        style={{ minWidth: '150px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        pt={{
          menuitem: { style: { borderRadius: '8px' } },
        }}
      />
      <Button
        icon="pi pi-ellipsis-v"
        rounded
        text
        severity="secondary"
        onClick={(e) => { e.stopPropagation(); menuRef.current.toggle(e); }}
        style={{ color: '#64748b', width: '34px', height: '34px' }}
        tooltip="Actions"
        tooltipOptions={{ position: 'left' }}
      />

      {showConfirm && (
        <div 
          onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '24px',
              width: '420px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid #f1f5f9',
              animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              ⚠️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Confirm Delete</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5' }}>
                Are you sure you want to delete this record? This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  const originalConfirm = window.confirm;
                  window.confirm = () => true;
                  try {
                    onDelete(pendingEvent);
                  } finally {
                    window.confirm = originalConfirm;
                  }
                  setShowConfirm(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#dc2626'}
                onMouseOut={(e) => e.target.style.background = '#ef4444'}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
