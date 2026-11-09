# Security architecture
- Admin credentials remain server-validated; every admin token must match an unexpired, unrevoked hash in service-role-only `admin_sessions`, including media endpoints, so logout invalidates retained tokens.
- R2 signed PUT requests require a positive integer size within 10 MB and sign all supplied headers, including content-length, to enforce the byte limit at storage.