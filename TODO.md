# TODO

## Customer login + /api/me session consistency fix

- [ ] Inspect `getLogin` in `backend/models/LoginModel.js` around `res.cookie('token', token, ...)` and `REPLACE INTO active_sessions`.
- [x] Update `getLogin` to ensure `active_sessions` insert/update completes successfully *before* returning `{ success: true }`.

- [ ] Add clear server-side logging and return a failure response (or clear cookie) if active session persistence fails.
- [ ] Re-run customer registration + login and confirm:
  - [ ] `POST /api/login` returns success.
  - [ ] `GET /api/me` succeeds (no `jti mismatch`).
  - [ ] Customer role routes become accessible as intended.

