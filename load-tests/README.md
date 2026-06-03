# Load Test

This folder contains a purpose-built load test runner for the Node.js + Express backend.

## What it tests

- `GET /health` as the test health check
- `GET /api/health` as the backend health check
- `GET /api/banner` as a public cache-heavy endpoint
- `GET /api/fees/default` as the closest current equivalent to an events/config read
- `GET /api/admin/dashboard` as the admin aggregation hot path
- `POST /api/auth/signup` for user creation pressure
- `POST /api/auth/login` for authentication pressure
- `POST /api/teams/register` if you provide a valid `TEST_TOKEN`

The signup test uses `autocannon`'s built-in `[<id>]` replacement so every request creates unique user data.

## Run

From the repository root:

```bash
npm install
npm run load:test
```

To run the full matrix of 100, 500, 1000, and 5000 concurrent-user scenarios:

```bash
MODE=matrix npm run load:test
```

## Configure

Use environment variables to tune the run:

```bash
BASE_URL=https://your-backend.example.com \
VUS=1000 \
DURATION=60 \
PIPES=10 \
THREADS=50 \
TEST_PHONE=9999999999 \
TEST_PASSWORD=Password@123 \
npm run load:test
```

Use `NODE_ENV=testing` on the server to disable rate limits during testing.

Optional variables for the team-registration test:

- `TEST_TOKEN` - Bearer token for an authenticated user
- `TEAM_NAME`
- `TEAM_LEADER`
- `TEAM_YEAR`
- `TEAM_STREAM`
- `TEAM_CONTACT`
- `TEAM_MEMBERS`

## Notes

- The script is designed to verify the backend under high concurrency, not to replace a full staging soak test.
- For a true 1000-user validation, run it against a deployed environment with MongoDB and Redis enabled.
- Expect signup and login tests to reuse the same test credentials; if you want fully unique accounts per virtual user, I can extend the script to generate unique payloads per run.
- Signup payloads are unique per request via `[<id>]`, so collisions should be avoided even under concurrency.
- There is no dedicated `events` collection or route in the current codebase, so `api/fees/default` is used as the closest current read-heavy configuration endpoint for event-style load testing.
