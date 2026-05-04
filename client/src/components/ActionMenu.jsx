import React, { useRef } from 'react';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';

/**
 * Reusable 3-dot kebab action menu for DataTable rows.
 * Props:
 *   onEdit    — callback for edit action
 *   onDelete  — callback for delete action
 *   extraItems — (optional) additional menu items array
 */
export default function ActionMenu({ onEdit, onDelete, extraItems = [] }) {
  const menuRef = useRef(null);

  const items = [
    ...(onEdit ? [{
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: (e) => onEdit(e.originalEvent),
    }] : []),
    ...(onDelete ? [{
      label: 'Delete',
      icon: 'pi pi-trash',
      command: (e) => onDelete(e.originalEvent),
      style: { color: '#e11d48' },
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
    </>
  );
}
