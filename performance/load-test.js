import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = 'http://mock-api:8080';
const VUS = Number(__ENV.LOAD_VUS || '500');
const DURATION = __ENV.LOAD_DURATION || '5m';
const PROFILE = __ENV.RUN_PROFILE === 'smoke' ? 'smoke' : 'load';

const contractErrors = new Rate('contract_errors');
const readRequests = new Counter('read_requests');
const writeRequests = new Counter('write_requests');

export const options = {
  scenarios: {
    local_api: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    contract_errors: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

function jsonBody(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export default function () {
  // Offset by VU so approximately one fifth of concurrent VUs write.
  if ((__VU + __ITER) % 5 === 0) {
    const record = {
      id: `vu-${__VU}-iter-${__ITER}`,
      value: __ITER % 100,
    };
    const response = http.post(
      `${BASE_URL}/api/records`,
      JSON.stringify(record),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { operation: 'write' },
      }
    );
    writeRequests.add(1);
    const body = jsonBody(response);
    const valid = check(response, {
      'POST returns 201': (r) => r.status === 201,
      'POST returns stored record': () =>
        body !== null &&
        body.id === record.id &&
        body.value === record.value &&
        body.stored === true,
    });
    contractErrors.add(!valid);
  } else {
    const itemId = (__VU % 10) + 1;
    const response = http.get(`${BASE_URL}/api/items/${itemId}`, {
      tags: { operation: 'read' },
    });
    readRequests.add(1);
    const body = jsonBody(response);
    const valid = check(response, {
      'GET returns 200': (r) => r.status === 200,
      'GET returns expected item': () =>
        body !== null &&
        body.id === itemId &&
        body.name === `Item ${itemId}` &&
        body.price === itemId * 10,
    });
    contractErrors.add(!valid);
  }

  sleep(1);
}

function metricValue(data, metric, field) {
  return data.metrics[metric]?.values?.[field] ?? null;
}

function display(value, digits = 2) {
  return typeof value === 'number' ? value.toFixed(digits) : 'n/a';
}

export function handleSummary(data) {
  const thresholds = {};
  for (const [name, metric] of Object.entries(data.metrics)) {
    if (!metric.thresholds) continue;
    for (const [expression, result] of Object.entries(metric.thresholds)) {
      thresholds[`${name}: ${expression}`] = result.ok;
    }
  }

  const summary = {
    profile: PROFILE,
    executor: 'constant-vus',
    configuredVus: VUS,
    achievedVus: metricValue(data, 'vus', 'max'),
    duration: DURATION,
    requests: metricValue(data, 'http_reqs', 'count'),
    requestsPerSecond: metricValue(data, 'http_reqs', 'rate'),
    readRequests: metricValue(data, 'read_requests', 'count'),
    writeRequests: metricValue(data, 'write_requests', 'count'),
    httpErrorRate: metricValue(data, 'http_req_failed', 'rate'),
    contractErrorRate: metricValue(data, 'contract_errors', 'rate'),
    latencyMs: {
      average: metricValue(data, 'http_req_duration', 'avg'),
      p90: metricValue(data, 'http_req_duration', 'p(90)'),
      p95: metricValue(data, 'http_req_duration', 'p(95)'),
      p99: metricValue(data, 'http_req_duration', 'p(99)'),
    },
    iterations: metricValue(data, 'iterations', 'count'),
    thresholds,
    thresholdsPassed: Object.keys(thresholds).length === 3 &&
      Object.values(thresholds).every((passed) => passed === true),
  };

  const lines = [
    `Local mock API performance — ${PROFILE}`,
    `VUs: configured ${summary.configuredVus}, achieved ${summary.achievedVus ?? 'n/a'}; duration: ${DURATION}`,
    `Requests: ${summary.requests ?? 'n/a'} (${display(summary.requestsPerSecond)} req/s); GET: ${summary.readRequests ?? 'n/a'}, POST: ${summary.writeRequests ?? 'n/a'}`,
    `HTTP error rate: ${display(summary.httpErrorRate === null ? null : summary.httpErrorRate * 100)}%; contract error rate: ${display(summary.contractErrorRate === null ? null : summary.contractErrorRate * 100)}%`,
    `Latency (ms): avg ${display(summary.latencyMs.average)}, p90 ${display(summary.latencyMs.p90)}, p95 ${display(summary.latencyMs.p95)}, p99 ${display(summary.latencyMs.p99)}`,
    `Iterations: ${summary.iterations ?? 'n/a'}`,
    `Thresholds: ${summary.thresholdsPassed ? 'PASS' : 'FAIL'}`,
    ...Object.entries(thresholds).map(([name, passed]) =>
      `  ${passed ? 'PASS' : 'FAIL'} ${name}`
    ),
    '',
  ];

  return {
    [`/results/${PROFILE}-summary.json`]: `${JSON.stringify(summary, null, 2)}\n`,
    [`/results/${PROFILE}-summary.txt`]: `${lines.join('\n')}`,
    stdout: lines.join('\n'),
  };
}
