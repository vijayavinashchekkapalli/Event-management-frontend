const autocannon = require('autocannon');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const VUS = Number(process.env.VUS || 1000);
const DURATION = Number(process.env.DURATION || 60);
const PIPES = Number(process.env.PIPES || 10);
const MODE = process.env.MODE || 'single';

const TEST_PHONE = process.env.TEST_PHONE || '9999999999';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Password@123';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_FIRST_NAME = process.env.TEST_FIRST_NAME || 'Test';
const TEST_LAST_NAME = process.env.TEST_LAST_NAME || 'User';

if (process.setMaxListeners) {
  process.setMaxListeners(0);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function buildAuthHeader() {
  const token = process.env.TEST_TOKEN;
  return token ? { authorization: `Bearer ${token}` } : {};
}

function runBenchmark(label, options) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const instance = autocannon(options, (error, result) => {
      if (error) return reject(error);
      const elapsedMs = Math.round(performance.now() - startedAt);
      console.log(`\n=== ${label} ===`);
      console.log(`Requests: ${formatNumber(result.requests.total)}`);
      console.log(`Latency avg: ${Math.round(result.latency.average)} ms`);
      console.log(`Latency p99: ${Math.round(result.latency.p99)} ms`);
      console.log(`Throughput avg: ${formatNumber(result.throughput.average)} bytes/sec`);
      console.log(`Non-2xx: ${formatNumber(result.non2xx)}`);
      console.log(`Errors: ${formatNumber(result.errors)}`);
      console.log(`Duration: ${elapsedMs} ms`);
      resolve(result);
    });

    if (MODE !== 'matrix') {
      autocannon.track(instance, { renderProgressBar: true, renderResultsTable: false });
    }
  });
}

async function main() {
  console.log(`Target: ${BASE_URL}`);
  console.log(`Virtual users: ${VUS}`);
  console.log(`Duration: ${DURATION}s`);
  console.log(`Connections: ${PIPES}`);

  const commonHeaders = {
    'content-type': 'application/json'
  };

  const runs = MODE === 'matrix'
    ? [100, 500, 1000, 5000]
    : [VUS];

  await runBenchmark('Health check warmup', {
    url: `${BASE_URL}/api/health`,
    connections: Math.min(100, VUS),
    amount: Math.max(1000, VUS * 5),
    pipelining: 1
  });

  await runBenchmark('Public health endpoint warmup', {
    url: `${BASE_URL}/health`,
    connections: Math.min(100, VUS),
    amount: Math.max(1000, VUS * 5),
    pipelining: 1
  });

  for (const vus of runs) {
    const endpointLabel = `Load scenario - ${vus} users`;
    console.log(`\n=== ${endpointLabel} ===`);

    await runBenchmark(`${endpointLabel} - GET /health`, {
      url: `${BASE_URL}/health`,
      connections: vus,
      duration: DURATION,
      pipelining: 1
    });

    await runBenchmark(`${endpointLabel} - GET /api/health`, {
      url: `${BASE_URL}/api/health`,
      connections: vus,
      duration: DURATION,
      pipelining: 1
    });

    await runBenchmark(`${endpointLabel} - GET /api/banner`, {
      url: `${BASE_URL}/api/banner`,
      connections: vus,
      duration: DURATION,
      pipelining: 1
    });

    await runBenchmark(`${endpointLabel} - GET /api/admin/dashboard`, {
      url: `${BASE_URL}/api/admin/dashboard`,
      connections: vus,
      duration: DURATION,
      pipelining: 1,
      headers: buildAuthHeader()
    });

    const signupPayload = JSON.stringify({
      firstName: `${TEST_FIRST_NAME}-[<id>]`,
      middleName: '',
      lastName: `${TEST_LAST_NAME}-[<id>]`,
      phone: `9[<id>]`,
      password: TEST_PASSWORD,
      email: `user[<id>]@example.com`
    });

    await runBenchmark(`${endpointLabel} - POST /api/auth/signup`, {
      url: `${BASE_URL}/api/auth/signup`,
      method: 'POST',
      connections: PIPES,
      pipelining: 1,
      duration: DURATION,
      headers: commonHeaders,
      body: signupPayload,
      idReplacement: true
    });

    const loginPayload = JSON.stringify({
      phone: TEST_PHONE,
      password: TEST_PASSWORD
    });

    await runBenchmark(`${endpointLabel} - POST /api/auth/login`, {
      url: `${BASE_URL}/api/auth/login`,
      method: 'POST',
      connections: PIPES,
      pipelining: 1,
      duration: DURATION,
      headers: commonHeaders,
      body: loginPayload
    });

    const token = process.env.TEST_TOKEN;
    if (token) {
      const teamPayload = JSON.stringify({
        teamName: process.env.TEAM_NAME || 'Load Test Team',
        leaderName: process.env.TEAM_LEADER || 'Load Tester',
        year: process.env.TEAM_YEAR || '4',
        stream: process.env.TEAM_STREAM || 'CSE',
        contact: process.env.TEAM_CONTACT || TEST_PHONE,
        members: (process.env.TEAM_MEMBERS || 'Member A,Member B').split(',').map((member) => member.trim()).filter(Boolean)
      });

      await runBenchmark(`${endpointLabel} - POST /api/teams/register`, {
        url: `${BASE_URL}/api/teams/register`,
        method: 'POST',
        connections: PIPES,
        pipelining: 1,
        duration: DURATION,
        headers: {
          ...commonHeaders,
          authorization: `Bearer ${token}`
        },
        body: teamPayload
      });
    } else {
      console.log('\nSkipping team registration test because TEST_TOKEN is not set.');
    }
  }

  console.log('\nLoad test complete. If latencies stay stable and non-2xx/errors stay near zero at VUS=1000, the app is handling the target load for these endpoints.');
}

main().catch((error) => {
  console.error('Load test failed:', error.message);
  process.exit(1);
});
