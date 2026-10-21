// roles omitted => visible to everyone
export const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { to: '/employees', label: 'Employees', icon: 'bi-people', roles: ['hr', 'manager'] },
  { to: '/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { to: '/leaves', label: 'Leaves', icon: 'bi-calendar-x' },
  { to: '/announcements', label: 'Announcements', icon: 'bi-megaphone' },
  { to: '/trainings', label: 'Trainings', icon: 'bi-mortarboard' },
  { to: '/profile', label: 'My Profile', icon: 'bi-person-circle' },
];

export const ROLE_BADGE = {
  hr: { label: 'HR', className: 'bg-danger' },
  manager: { label: 'Manager', className: 'bg-warning text-dark' },
  employee: { label: 'Employee', className: 'bg-success' },
};
