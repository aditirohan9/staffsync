# End-to-End Walkthrough

Use this to demo StaffSync or to verify a deployment. Run `npm run seed -- --reset` first (in `server/`).

## Automated check (API level)

```bash
cd server
npm run dev            # in one terminal
npm run e2e            # in another  -> 26 checks, creates and cleans up its own test data

# against a deployed API:
API_URL=https://<your-api>.onrender.com/api npm run e2e
```

If you seeded with custom passwords, pass them: `SEED_HR_PASSWORD=... SEED_PASSWORD=... npm run e2e`.
Set `E2E_KEEP=1` to keep the test data it creates.

## Manual walkthrough (UI)

Logins come from the seed script: `hr@staffsync.com` (Admin@123), `manager@staffsync.com`, `employee1@staffsync.com`, `employee2@staffsync.com` (Password@123).
Use a normal window for one role and a private window for another so you can switch quickly.

| # | Role | Action | Expected result |
|---|------|--------|-----------------|
| 1 | Employee (`employee2`) | Log in | Dashboard shows "Not marked" for today's attendance, 1 pending and 1 approved leave |
| 2 | Employee | Dashboard or Attendance page, click **Check In** | Message "Check-in recorded", badge shows Present or Late, button becomes **Check Out** |
| 3 | Employee | Leaves, **Apply for leave**, fill the modal, submit | New row with a yellow **Pending** badge |
| 4 | Manager | Log in, open Dashboard | "Pending leave requests" table lists the employee's new request |
| 5 | Manager | Click green **Approve** | Row disappears from pending, success message |
| 6 | Manager | Trainings, **Create new**, tick the employee as participant, submit | Training card appears with 1 participant |
| 7 | Employee | Leaves | The request now shows green **Approved**, decided by the manager |
| 8 | Employee | Trainings | The new training is shown as **Enrolled** |
| 9 | Employee | Look at the navbar bell | Unread badge shows the leave decision and training notifications |
| 10 | HR | Log in, Announcements, **Create new**, post | Card appears at the top |
| 11 | Employee | Announcements (or Dashboard, "Latest announcements") | The new announcement is visible, with no edit or delete buttons |
| 12 | HR | Dashboard | Company attendance, leave overview and department breakdown render |
| 13 | HR | Employees, search a name, open **Edit** | Role, department and manager can be changed |

## Access-control spot checks

- Employee opens `/employees` by URL: "Access denied" page.
- Remove `token` from localStorage and reload: redirected to `/login`.
- On a deployed frontend, refresh on `/leaves`: the page loads (no 404).

## Known gaps

- The bell shows an unread **count**, but the Notifications page is still a placeholder. Notifications can't be listed or marked as read in the UI yet.
- Posting an announcement does not create notifications. Employees see it on the Announcements page and the dashboard feed.
