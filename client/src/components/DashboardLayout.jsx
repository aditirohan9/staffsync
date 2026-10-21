import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../layout.css';

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Navbar onToggleSidebar={() => setOpen((o) => !o)} />
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      {open && <div className="sidebar-backdrop d-md-none" onClick={() => setOpen(false)} />}
      <main className="app-main">
        <div className="container-fluid p-3 p-md-4">
          <Outlet />
        </div>
      </main>
    </>
  );
}
