// End-to-end walkthrough against a running API.
//   npm run e2e                                  (local, http://localhost:5000/api)
//   API_URL=https://your-api.onrender.com/api npm run e2e
// Needs the seeded demo users (npm run seed). Set E2E_KEEP=1 to keep the test data it creates.
const BASE = (process.env.API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const HR = { email: process.env.E2E_HR_EMAIL || 'hr@staffsync.com', password: process.env.SEED_HR_PASSWORD || process.env.E2E_HR_PASSWORD || 'Admin@123' };
const MGR = { email: process.env.E2E_MANAGER_EMAIL || 'manager@staffsync.com', password: process.env.SEED_PASSWORD || process.env.E2E_PASSWORD || 'Password@123' };

let passed = 0;
let failed = 0;
const check = (name, ok, extra = '') => {
  ok ? passed++ : failed++;
  console.log(`  ${ok ? '\u2713' : '\u2717'} ${name}${ok ? '' : `  ${extra}`}`);
};
const section = (t) => console.log(`\n${t}`);

const call = async (method, path, token, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { status: res.status, data };
};
const iso = (d) => d.toISOString().slice(0, 10);

(async () => {
  const stamp = Date.now();
  console.log(`StaffSync end-to-end walkthrough\nAPI: ${BASE}`);

  section('Setup: log in as HR and Manager, create a fresh employee');
  const hr = await call('POST', '/auth/login', null, HR);
  const mgr = await call('POST', '/auth/login', null, MGR);
  if (hr.status !== 200 || mgr.status !== 200) {
    console.log('  \u2717 Could not log in as the seeded HR/Manager. Did you run "npm run seed"?');
    process.exit(1);
  }
  const hrToken = hr.data.token;
  const mgrToken = mgr.data.token;
  const mgrId = mgr.data.user._id;

  const empCreds = { email: `e2e.${stamp}@staffsync.test`, password: 'Passw0rd!x' };
  const reg = await call('POST', '/auth/register', null, { name: 'E2E Employee', ...empCreds, department: 'QA', designation: 'Tester' });
  check('Employee registers (201)', reg.status === 201, JSON.stringify(reg.data));
  const empId = reg.data?.user?._id;
  const assign = await call('PUT', `/users/${empId}`, hrToken, { managerId: mgrId });
  check('HR assigns the employee to the manager (200)', assign.status === 200, JSON.stringify(assign.data));

  section('1. EMPLOYEE: log in, mark attendance, apply for leave');
  const emp = await call('POST', '/auth/login', null, empCreds);
  check('Employee logs in', emp.status === 200 && !!emp.data?.token);
  const empToken = emp.data?.token;

  const checkIn = await call('POST', '/attendance/mark', empToken);
  check('First mark = check-in (201)', checkIn.status === 201 && /check-in/i.test(checkIn.data?.message || ''), JSON.stringify(checkIn.data));
  const checkOut = await call('POST', '/attendance/mark', empToken);
  check('Second mark = check-out (200)', checkOut.status === 200 && /check-out/i.test(checkOut.data?.message || ''), JSON.stringify(checkOut.data));
  const third = await call('POST', '/attendance/mark', empToken);
  check('Third mark is rejected, already marked (400)', third.status === 400);
  const hist = await call('GET', '/attendance/my', empToken);
  check('Attendance history shows today with check-in/out', hist.data?.data?.length === 1 && !!hist.data.data[0].checkIn && !!hist.data.data[0].checkOut);

  const start = new Date(Date.now() + (60 + Math.floor(Math.random() * 300)) * 86400000);
  const end = new Date(start.getTime() + 86400000);
  const apply = await call('POST', '/leaves', empToken, { leaveType: 'Casual', startDate: iso(start), endDate: iso(end), reason: 'E2E walkthrough leave' });
  check('Leave application created as Pending (201)', apply.status === 201 && apply.data?.leave?.status === 'Pending', JSON.stringify(apply.data));
  const leaveId = apply.data?.leave?._id;
  const overlap = await call('POST', '/leaves', empToken, { leaveType: 'Sick', startDate: iso(start), endDate: iso(end), reason: 'overlap' });
  check('Overlapping leave is rejected (409)', overlap.status === 409);

  section('2. MANAGER: approve the leave, assign a training');
  const pending = await call('GET', '/leaves?status=Pending&limit=100', mgrToken);
  check('Leave appears in the manager\'s pending list', !!pending.data?.data?.some((l) => l._id === leaveId));
  const approve = await call('PUT', `/leaves/${leaveId}/status`, mgrToken, { status: 'Approved' });
  check('Manager approves the leave (200)', approve.status === 200 && approve.data?.leave?.status === 'Approved', JSON.stringify(approve.data));
  const again = await call('PUT', `/leaves/${leaveId}/status`, mgrToken, { status: 'Rejected' });
  check('Re-processing the same leave is blocked (400)', again.status === 400);

  const trTitle = `E2E Training ${stamp}`;
  const training = await call('POST', '/trainings', mgrToken, { title: trTitle, description: 'Created by the e2e script', participants: [empId] });
  check('Manager creates a training and adds the employee (201)', training.status === 201, JSON.stringify(training.data));
  const trainingId = training.data?.training?._id;

  section('3. EMPLOYEE: sees the results');
  const myLeaves = await call('GET', '/leaves', empToken);
  check('Leave now shows as Approved', myLeaves.data?.data?.find((l) => l._id === leaveId)?.status === 'Approved');
  const myTrainings = await call('GET', '/trainings?mine=true', empToken);
  const t = myTrainings.data?.data?.find((x) => x._id === trainingId);
  check('Training is listed and flagged as enrolled', !!t && t.isEnrolled === true);
  const stats1 = await call('GET', '/dashboard/stats', empToken);
  check('Notifications received (leave approved + training added)', (stats1.data?.stats?.unreadNotifications || 0) >= 2, `unread=${stats1.data?.stats?.unreadNotifications}`);
  check('Dashboard reflects attendance and approved leave', stats1.data?.stats?.myAttendance?.marked === true && stats1.data?.stats?.approvedLeaves >= 1);

  section('4. HR: post an announcement, employee sees it');
  const annTitle = `E2E Announcement ${stamp}`;
  const ann = await call('POST', '/announcements', hrToken, { title: annTitle, content: 'Posted by the e2e script.' });
  check('HR posts the announcement (201)', ann.status === 201, JSON.stringify(ann.data));
  const annId = ann.data?.announcement?._id;
  const feed = await call('GET', '/announcements?limit=5', empToken);
  check('Employee sees it at the top of the feed', feed.data?.data?.[0]?._id === annId);
  const hrStats = await call('GET', '/dashboard/stats', hrToken);
  check('HR dashboard returns company stats', hrStats.status === 200 && typeof hrStats.data?.stats?.totalEmployees === 'number' && Array.isArray(hrStats.data?.stats?.departmentBreakdown));

  section('5. Security: role-based access');
  check('No token -> 401', (await call('GET', '/dashboard/stats')).status === 401);
  check('Employee cannot post announcements -> 403', (await call('POST', '/announcements', empToken, { title: 'x', content: 'y' })).status === 403);
  check('Employee cannot list all users -> 403', (await call('GET', '/users', empToken)).status === 403);
  check('Employee cannot approve leaves -> 403', (await call('PUT', `/leaves/${leaveId}/status`, empToken, { status: 'Approved' })).status === 403);
  check('Employee cannot register as HR (role forced to employee)', (await call('POST', '/auth/register', null, { name: 'Sneaky', email: `sneaky.${stamp}@staffsync.test`, password: 'Passw0rd!x', role: 'hr' })).data?.user?.role === 'employee');

  if (!process.env.E2E_KEEP) {
    section('Cleanup');
    await call('DELETE', `/trainings/${trainingId}`, hrToken);
    await call('DELETE', `/announcements/${annId}`, hrToken);
    const del = await call('DELETE', `/users/${empId}`, hrToken);
    check('Test data removed', del.status === 200);
    const sneaky = await call('POST', '/auth/login', null, { email: `sneaky.${stamp}@staffsync.test`, password: 'Passw0rd!x' });
    if (sneaky.data?.user?._id) await call('DELETE', `/users/${sneaky.data.user._id}`, hrToken);
  }

  console.log(`\n${failed ? '\u2717' : '\u2713'} ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(`\nCould not reach the API at ${BASE}: ${e.message}`);
  process.exit(1);
});
