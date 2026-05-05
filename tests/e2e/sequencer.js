const Sequencer = require('@jest/test-sequencer').default;

const FLOW_ORDER = [
  'bootstrap',
  'onboarding',
  'issuance',
  'transfer',
  'freeze',
  'forced-transfer',
  'claims',
  'pause',
  'agent-roles',
  'batch-issuance',
  'compliance-sim',
  'indexing',
  'portfolio',
];

class E2ESequencer extends Sequencer {
  sort(tests) {
    const path = require('path');
    return [...tests].sort((a, b) => {
      const indexA = FLOW_ORDER.findIndex(name => path.basename(a.path) === `${name}.e2e-spec.ts`);
      const indexB = FLOW_ORDER.findIndex(name => path.basename(b.path) === `${name}.e2e-spec.ts`);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });
  }
}

module.exports = E2ESequencer;
