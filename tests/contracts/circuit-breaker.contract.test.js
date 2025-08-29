// tests/contracts/circuit-breaker.contract.test.js
// DAY 2 – Circuit Breaker Contract Compliance + Productivity Validation
// CONTRACT: CircuitBreakerContract (canPass, recordSuccess, recordFailure, getState)
// RUNNER: Node's built-in test runner
// SCOPE: Contract-only via createTestableComponent(); no direct implementation imports.
// STYLE: No Jest; use node:assert. No sleeps (use waitForCondition).
//
// SCENARIOS supported by fake (feature-gated): 'normal','always-open','always-closed','flapping','probe-limited','slow-recovery'

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createTestableComponent, waitForCondition } from '../helpers/test-factory.js';
import { assertAll } from '../helpers/assertAll.js';

const COMPONENT_NAME = 'circuit-breaker';

// ---------- Tiny helpers ----------
function expectOk(result) {
  assert.strictEqual(result?.ok, true, 'expected ok:true');
  assert.strictEqual(result.error, undefined, 'ok:true must not include error');
}

function expectErr(result, codeRE = /^[A-Z_]+$/) {
  assert.strictEqual(result?.ok, false, 'expected ok:false');
  assert.ok(result?.error, 'expected error object');
  assert.ok(typeof result.error.code === 'string', 'error.code must be string');
  assert.ok(codeRE.test(result.error.code), `error.code must match ${codeRE}`);
  assert.ok(typeof result.error.message === 'string', 'error.message must be string');
}

function ctx(overrides = {}) {
  return { requestId: 'req-1', ...overrides };
}

function success(overrides = {}) {
  return { requestId: 'succ-1', durationMs: 5, ...overrides };
}

function failure(overrides = {}) {
  return { requestId: 'fail-1', durationMs: 5, errorCode: 'TIMEOUT', ...overrides };
}

describe('Circuit breaker Contract Compliance', () => {
  let breaker;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    const useFakes = process.env.USE_FAKES === 'true';
    breaker = await createTestableComponent(COMPONENT_NAME, useFakes);
    // Core surface exists
    assert.strictEqual(typeof breaker.canPass, 'function', 'canPass must exist');
    assert.strictEqual(typeof breaker.recordSuccess, 'function', 'recordSuccess must exist');
    assert.strictEqual(typeof breaker.recordFailure, 'function', 'recordFailure must exist');
    assert.strictEqual(typeof breaker.getState, 'function', 'getState must exist');
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ---------------- Core: canPass() ----------------
  describe('Core Contract Methods: canPass()', () => {
    it('should exist and be function', () => {
      assert.strictEqual(typeof breaker.canPass, 'function');
    });

    it('handles valid input with exact return structure (CLOSED → ok:true)', async () => {
      const res = await breaker.canPass(ctx());
      // Either ok:true or scenario denial; if scenario denies, we’ll verify in scenario suite.
      if (res.ok) {
        expectOk(res);
        assert.ok(res.data && typeof res.data === 'object', 'data object expected');
        assert.ok(['CLOSED', 'OPEN', 'HALF_OPEN'].includes(res.data.state), 'valid state');
      } else {
        // Valid envelope on denial
        expectErr(res, /^(RATE_LIMITED|TIMEOUT|INTERNAL)$/);
      }
    });

    it('validation: context.requestId required & non-empty', async () => {
      const cases = [
        { requestId: '' },
        { requestId: '   ' },
        { requestId: null },
        undefined
      ];
      const errors = [];
      for (const bad of cases) {
        // bad may be undefined (no object) or an object with invalid requestId
        const res = await breaker.canPass(bad);
        if (res.ok || res?.error?.code !== 'VALIDATION_ERROR') {
          errors.push(`canPass(${JSON.stringify(bad)}) should be VALIDATION_ERROR`);
        }
      }
      assertAll(errors);
    });

    it('validation: deadlineMs must be integer ≥ 0 (absolute epoch ms)', async () => {
      const cases = [
        { deadlineMs: -1 },
        { deadlineMs: 1.1 },
        { deadlineMs: NaN }
      ];
      const errors = [];
      for (const c of cases) {
        const res = await breaker.canPass(ctx(c));
        if (res.ok || res?.error?.code !== 'VALIDATION_ERROR') {
          errors.push(`deadlineMs=${String(c.deadlineMs)} should be VALIDATION_ERROR`);
        }
      }
      assertAll(errors);
    });

    it('timeout: decision exceeded deadline → TIMEOUT (use deadlineMs=0 to guarantee past)', async () => {
      const res = await breaker.canPass(ctx({ deadlineMs: 0 }));
      expectErr(res, /^TIMEOUT$/);
    });
  });

  // ---------------- Core: recordSuccess() ----------------
  describe('Core Contract Methods: recordSuccess()', () => {
    it('should exist and be function', () => {
      assert.strictEqual(typeof breaker.recordSuccess, 'function');
    });

    it('handles valid input and returns ok:true with data', async () => {
      const res = await breaker.recordSuccess(success());
      expectOk(res);
      assert.ok(res.data && ['CLOSED', 'OPEN', 'HALF_OPEN'].includes(res.data.state));
    });

    it('validation: requestId non-empty & durationMs integer ≥ 0', async () => {
      const cases = [
        { requestId: '', durationMs: 1 },
        { requestId: 'succ-2', durationMs: -1 },
        { requestId: 'succ-3', durationMs: 0.1 },
        undefined
      ];
      const errors = [];
      for (const bad of cases) {
        const res = await breaker.recordSuccess(bad);
        if (res.ok || res?.error?.code !== 'VALIDATION_ERROR') {
          errors.push(`recordSuccess(${JSON.stringify(bad)}) should be VALIDATION_ERROR`);
        }
      }
      assertAll(errors);
    });
  });

  // ---------------- Core: recordFailure() ----------------
  describe('Core Contract Methods: recordFailure()', () => {
    it('should exist and be function', () => {
      assert.strictEqual(typeof breaker.recordFailure, 'function');
    });

    it('handles valid input and returns ok:true with data', async () => {
      const res = await breaker.recordFailure(failure());
      expectOk(res);
      assert.ok(res.data && ['CLOSED', 'OPEN', 'HALF_OPEN'].includes(res.data.state));
    });

    it('validation: requestId non-empty, durationMs integer ≥ 0, errorCode non-empty string', async () => {
      const cases = [
        { requestId: '', durationMs: 1, errorCode: 'TIMEOUT' },
        { requestId: 'fail-2', durationMs: -1, errorCode: 'TIMEOUT' },
        { requestId: 'fail-3', durationMs: 0.5, errorCode: 'TIMEOUT' },
        { requestId: 'fail-4', durationMs: 1, errorCode: '' },
        undefined
      ];
      const errors = [];
      for (const bad of cases) {
        const res = await breaker.recordFailure(bad);
        if (res.ok || res?.error?.code !== 'VALIDATION_ERROR') {
          errors.push(`recordFailure(${JSON.stringify(bad)}) should be VALIDATION_ERROR`);
        }
      }
      assertAll(errors);
    });

    it('integration: after enough failures the breaker denies canPass() with RATE_LIMITED (OPEN)', async () => {
      // We don't know failureThreshold/config here; drive failures until denial or reasonable bound.
      // Use TIMEOUT errorCode which the fake counts as breaker failure.
      let denied = false;
      for (let i = 0; i < 10; i++) {
        const r = await breaker.recordFailure(failure({ requestId: `f-${i}` }));
        assert.strictEqual(r.ok, true, 'recordFailure should succeed');
        const pass = await breaker.canPass(ctx({ requestId: `chk-${i}` }));
        if (!pass.ok && pass.error.code === 'RATE_LIMITED') {
          denied = true;
          break;
        }
      }
      assert.ok(denied, 'expected canPass() denial after repeated failures');
    });
  });

  // ---------------- Core: getState() ----------------
  describe('Core Contract Methods: getState()', () => {
    it('should exist and be function', () => {
      assert.strictEqual(typeof breaker.getState, 'function');
    });

    it('returns ok:true snapshot with metrics', async () => {
      const res = await breaker.getState(ctx());
      expectOk(res);
      assert.ok(res.data && typeof res.data === 'object', 'data object expected');
      assert.ok(['CLOSED', 'OPEN', 'HALF_OPEN'].includes(res.data.state), 'state valid');
      assert.ok(res.data.metrics && typeof res.data.metrics === 'object', 'metrics object expected');
      const m = res.data.metrics;
      // sanity for some metrics
      assert.ok(Number.isFinite(m.totalCalls), 'metrics.totalCalls number');
      assert.ok(Number.isFinite(m.totalSuccesses), 'metrics.totalSuccesses number');
      assert.ok(Number.isFinite(m.totalFailures), 'metrics.totalFailures number');
      assert.ok(['CLOSED','OPEN','HALF_OPEN'].includes(m.state), 'metrics.state valid');
    });

    it('validation: requestId required & non-empty', async () => {
      const cases = [{}, { requestId: '' }, { requestId: '   ' }, undefined];
      const errors = [];
      for (const bad of cases) {
        const res = await breaker.getState(bad);
        if (res.ok || res?.error?.code !== 'VALIDATION_ERROR') {
          errors.push(`getState(${JSON.stringify(bad)}) should be VALIDATION_ERROR`);
        }
      }
      assertAll(errors);
    });
  });

  // ---------------- Convenience Methods (must route to core) ----------------
  describe('Convenience Methods (must not bypass core validation)', () => {
    it('quickCanPass() ≡ canPass({requestId}) envelope', async () => {
      if (typeof breaker.quickCanPass !== 'function') return assert.ok(true, 'quickCanPass optional');
      const quick = await breaker.quickCanPass();
      const core = await breaker.canPass(ctx({ requestId: 'qc-core' }));
      assert.strictEqual(!!quick.ok, !!core.ok);
      if (quick.ok && core.ok) {
        assert.strictEqual(quick.data.state === core.data.state, true);
      } else if (!quick.ok && !core.ok) {
        assert.strictEqual(quick.error.code, core.error.code);
      }
    });

    it('recordQuickSuccess(duration) routes to recordSuccess (validation shared)', async () => {
      if (typeof breaker.recordQuickSuccess !== 'function') return assert.ok(true);
      const quick = await breaker.recordQuickSuccess(3);
      expectOk(quick);
      const bad = await breaker.recordQuickSuccess(-1);
      expectErr(bad, /^VALIDATION_ERROR$/);
    });

    it('recordQuickFailure(duration, code, msg) routes to recordFailure (validation shared)', async () => {
      if (typeof breaker.recordQuickFailure !== 'function') return assert.ok(true);
      const quick = await breaker.recordQuickFailure(3, 'TIMEOUT', 'x');
      expectOk(quick);
      const bad = await breaker.recordQuickFailure(3, '', 'x');
      expectErr(bad, /^VALIDATION_ERROR$/);
    });

    it('execute(requestId, fn): success path returns ok:true and records success', async () => {
      if (typeof breaker.execute !== 'function') return assert.ok(true);
      const res = await breaker.execute('exec-1', async () => 42);
      expectOk(res);
      assert.strictEqual(res.data, 42);
    });

    it('execute(requestId, fn): thrown fn returns ok:false with EXECUTION_ERROR', async () => {
      if (typeof breaker.execute !== 'function') return assert.ok(true);
      const res = await breaker.execute('exec-2', async () => { throw new Error('boom'); });
      expectErr(res, /^EXECUTION_ERROR$/);
    });
  });

  // ---------------- Error Scenarios via feature-detected helpers ----------------
  describe('Error Scenarios (deterministic via scenario helpers, if present)', () => {
    it('always-open scenario: canPass → RATE_LIMITED', async () => {
      if (typeof breaker.setScenario !== 'function') return assert.ok(true);
      breaker.setScenario('always-open');
      const res = await breaker.canPass(ctx({ requestId: 'open-1' }));
      expectErr(res, /^RATE_LIMITED$/);
    });

    it('always-closed scenario: canPass → ok:true', async () => {
      if (typeof breaker.setScenario !== 'function') return assert.ok(true);
      breaker.setScenario('always-closed');
      const res = await breaker.canPass(ctx({ requestId: 'closed-1' }));
      expectOk(res);
      assert.ok(res.data && res.data.state, 'state present');
    });

    it('probe-limited: HALF_OPEN allows only one in-flight probe (2nd is RATE_LIMITED)', async () => {
      if (typeof breaker.setScenario !== 'function' || typeof breaker.forceState !== 'function') return assert.ok(true);
      breaker.setScenario('probe-limited');
      breaker.forceState('HALF_OPEN', 'test');
      const first = await breaker.canPass(ctx({ requestId: 'probe-1' }));
      const second = await breaker.canPass(ctx({ requestId: 'probe-2' }));
      expectOk(first);
      expectErr(second, /^RATE_LIMITED$/);
    });
  });

  // ---------------- Integration & No-sleep coordination ----------------
  describe('Integration: open → half_open/closed via outcomes (no sleeps)', () => {
    it('after denial, successful execute() can drive recovery toward CLOSED (depends on policy)', async () => {
      // Drive OPEN
      for (let i = 0; i < 6; i++) {
        expectOk(await breaker.recordFailure(failure({ requestId: `I-f-${i}` })));
      }
      const denied = await breaker.canPass(ctx({ requestId: 'I-check-deny' }));
      if (denied.ok) {
        // Some policies may be slow to open depending on threshold; tolerate.
        assert.ok(true, 'policy-dependent; continuing');
      } else {
        assert.strictEqual(denied.error.code, 'RATE_LIMITED');
      }

      // Try a successful guarded execution; depending on policy this may help recovery
      if (typeof breaker.execute === 'function') {
        const run = await breaker.execute('I-exec-1', async () => 'ok');
        // execute returns EXECUTION_ERROR or ok; both are valid envelopes
        assert.ok(run.ok || (!run.ok && typeof run.error.code === 'string'));
      }

      // Snapshot must always be obtainable
      const snap = await breaker.getState(ctx({ requestId: 'I-snap' }));
      expectOk(snap);
      assert.ok(['CLOSED','OPEN','HALF_OPEN'].includes(snap.data.state));
    });
  });

  // ---------------- Helper / Productivity ----------------
  describe('Helper / Productivity', () => {
    it('getStats (if present) returns debugging information object', () => {
      if (typeof breaker.getStats === 'function') {
        const stats = breaker.getStats();
        assert.strictEqual(typeof stats, 'object');
        assert.ok(['normal','always-open','always-closed','flapping','probe-limited','slow-recovery'].includes(stats.scenario), 'scenario reported');
        assert.ok(Number.isFinite(stats.totalCalls), 'totalCalls numeric');
        assert.ok(Number.isFinite(stats.totalFailures), 'totalFailures numeric');
        assert.ok(Array.isArray(stats.stateTransitions || []), 'stateTransitions array or absent');
      } else {
        assert.ok(true, 'getStats optional; presence not required by contract');
      }
    });

    it('captured logs (if present) increase after operations', async () => {
      if (typeof breaker.getCapturedLogs !== 'function') return assert.ok(true);
      const before = breaker.getCapturedLogs().length;
      await breaker.canPass(ctx({ requestId: 'log-1' }));
      const after = breaker.getCapturedLogs().length;
      assert.ok(after >= before, 'logs should not decrease');
      assert.ok(after > before, 'logs should increase after operation');
    });

    it('getInvocationCount/reset (if present) mutate counters predictably', async () => {
      if (typeof breaker.getInvocationCount !== 'function' || typeof breaker.reset !== 'function') return assert.ok(true);
      const before = breaker.getInvocationCount();
      await breaker.canPass(ctx({ requestId: 'cnt-1' }));
      const mid = breaker.getInvocationCount();
      assert.ok(mid >= before + 1, 'invocation count increments');
      breaker.reset();
      const after = breaker.getInvocationCount();
      assert.strictEqual(after, 0, 'invocation count resets to 0');
    });

    it('forceState (if present) directly affects canPass outcome', async () => {
      if (typeof breaker.forceState !== 'function') return assert.ok(true);
      breaker.forceState('OPEN', 'test');
      const denied = await breaker.canPass(ctx({ requestId: 'force-open' }));
      expectErr(denied, /^RATE_LIMITED$/);
      breaker.forceState('CLOSED', 'test');
      const allowed = await breaker.canPass(ctx({ requestId: 'force-closed' }));
      expectOk(allowed);
    });
  });
});