/* Persona Homepage: mock data.
 *
 * Everything in this file is invented. The applications, accounts, divisions,
 * teams, jobs, notices and figures are placeholders chosen to look like the
 * shape of real data without being any. No account numbers, no people.
 */

/* Two dimensions, not three. Scope is what the page reads a persona from, and an
 * account already implies the thing that owns it: a third selector that can only
 * ever agree with the second is a control with no state of its own. */
const SCOPE = {
  contributor: [
    { k: 'account', v: 'acct-atlas-prod' },
    { k: 'division', v: 'Any' }
  ],
  leader: [
    { k: 'division', v: 'Platform Engineering', wide: true },
    { k: 'account', v: 'Any' }
  ]
};

/* Layout templates the product curates. Users pick one and edit their copy; they
 * do not author templates in this build. */
const TEMPLATES = [
  { name: 'Daily focus', for: 'contributor', keep: ['maturity', 'notices', 'jobs'] },
  { name: 'Cost review', for: 'contributor', keep: ['cost', 'costsvc', 'topres'] },
  { name: 'Division rollup', for: 'leader', keep: ['maturity', 'rollup', 'accounts'] }
];

const CATEGORIES = [
  ['Maturity & compliance', [
    ['maturity', 'Maturity score', 'Letter grade plus a 0–100 score'],
    ['score', 'Score (numeric)', 'The same score as a bare number'],
    ['delta7', '7-day delta', 'Score change over the trailing week'],
    ['trend', 'Maturity score trend', 'Line chart of the trailing 90 days'],
    ['breakdown', 'Job breakdown', 'Progress split by job category'],
    ['upcoming', 'Upcoming requirements', 'Compliance calendar with days to deadline'],
    ['jobsopen', 'Jobs open', 'Count of open jobs'],
    ['burndown', 'Job burndown', 'Open jobs over time'],
    ['jobs', 'Jobs', 'Full jobs table']
  ]],
  ['Governance automation', [
    ['governance', 'Governance automation', 'Automated, deleted, in progress'],
    ['pipeline', 'Pipeline events', 'Recent build events with status'],
    ['change', 'Change status', 'Freeze state and the next window'],
    ['campaigns', 'Automated campaigns', 'Table of campaigns'],
    ['remediations', 'Remediations', 'Open remediations plus overdue']
  ]],
  ['Cost', [
    ['cost', 'Cloud cost', 'Current month, month over month, savings'],
    ['costsvc', 'Cost by service', 'Stacked bars per service']
  ]],
  ['Alerts & health', [
    ['notices', 'Recent notices', 'Notice list with a severity chip'],
    ['health', 'Service health', 'Green / amber / red tally']
  ]],
  ['Portfolio', [
    ['appdetails', 'Application details', 'Seven-field detail row'],
    ['apps', 'Applications', 'Every application in scope'],
    ['accounts', 'Accounts', 'Every account in scope'],
    ['rollup', 'Divisional rollup', 'Cross-division comparison'],
    ['topres', 'Top resources by jobs', 'Ranked list of the top eight']
  ]],
  ['Layout', [
    ['section', 'Section title', 'Editable heading for a named section'],
    ['smartstack', 'Smart stack', 'Auto-rotating stack by time of day']
  ]]
];

const WIDGETS = {};
CATEGORIES.forEach(([cat, list]) => list.forEach(([id, name, blurb]) => {
  WIDGETS[id] = { id, name, blurb, cat };
}));

/* The two shipped defaults. A cell is either one widget id or a stack of them. */
const PRESETS = {
  contributor: [
    { w: ['maturity'], size: 1 },
    { w: ['trend', 'breakdown'], size: 1 },
    { w: ['governance'], size: 1 },
    { w: ['notices'], size: 3 },
    { w: ['cost', 'costsvc'], size: 2 },
    { w: ['health'], size: 1 },
    { w: ['jobs', 'campaigns'], size: 3 }
  ],
  leader: [
    { w: ['maturity'], size: 1 },
    { w: ['trend', 'breakdown'], size: 1 },
    { w: ['governance'], size: 1 },
    { w: ['rollup'], size: 3 },
    { w: ['apps', 'accounts'], size: 2 },
    { w: ['change'], size: 1 },
    { w: ['cost', 'costsvc'], size: 2 },
    { w: ['notices'], size: 1 }
  ]
};

const NOT_IN_DEFAULT = ['Application details', 'Pipeline events', 'Job burndown',
  'Remediations', 'Upcoming requirements', 'Top resources by jobs'];

/* ------------------------------------------------------------------ data */
const D = {
  grade: { letter: 'A-', score: 92, refreshed: 'Aug 26', threshold: 80, pass: true },
  gradeLeader: { letter: 'B+', score: 88, refreshed: 'Aug 26', threshold: 80, pass: true },
  trend90: [91, 90, 90, 91, 89, 88, 88, 89, 87, 86, 87, 86, 85, 86, 85, 84, 85, 84],
  breakdown: [
    { k: 'Security & governance', v: 61, c: '#013D5B' },
    { k: 'Cost', v: 24, c: '#3E9B57' },
    { k: 'Resiliency', v: 15, c: '#E4922B' }
  ],
  governance: { automated: 2, window: 'last 60 days', scheduled: 3, inprogress: 0, deleted: 0 },
  governanceLeader: { automated: 1821, window: 'last 30 days', scheduled: 46, inprogress: 4, deleted: 12 },
  notices: [
    { sev: 'critical', t: 'Runtime 18.x reaches end of life', d: 'Unsupported from Sep 15. Move to 20.x LTS before the freeze.', w: '12m ago' },
    { sev: 'critical', t: 'Public bucket policy detected', d: 'One bucket in acct-atlas-prod allows list from any principal.', w: '1h ago' },
    { sev: 'warning', t: 'Certificate expires in 21 days', d: 'Edge certificate for the public gateway renews manually today.', w: '3h ago' },
    { sev: 'warning', t: 'Backup window missed twice', d: 'Nightly snapshot skipped on the 3rd and the 5th.', w: '1d ago' },
    { sev: 'warning', t: 'Idle load balancer', d: 'No traffic in 30 days. Candidate for the next cost campaign.', w: '2d ago' }
  ],
  cost: { month: 2300, avg6: 2500, mom: -11.9, delta: -310, savings: 640,
    months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], totals: [2710, 2600, 2480, 2380, 2560, 2300] },
  costLeader: { month: 19400, avg6: 20100, mom: -3.4, delta: -680, savings: 2100,
    months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], totals: [21400, 20900, 20100, 19800, 20200, 19400] },
  costsvc: [
    { k: 'Object storage', v: 34, c: '#013D5B' },
    { k: 'Compute', v: 27, c: '#0070A8' },
    { k: 'Managed database', v: 18, c: '#4FA3C7' },
    { k: 'Networking', v: 12, c: '#8FC6DD' },
    { k: 'Everything else', v: 9, c: '#C9E1EB' }
  ],
  jobs: [
    ['Encrypt legacy object buckets', 'S&G', 'Sep 12', 'Critical'],
    ['Rotate keys older than 90 days', 'S&G', 'Sep 21', 'High'],
    ['Tag untagged compute instances', 'Cost', 'Oct 3', 'Medium'],
    ['Add readiness probes to prod pods', 'Resiliency', 'Oct 8', 'Medium'],
    ['Right-size over-provisioned volumes', 'Cost', 'Oct 10', 'Medium'],
    ['Remove unused network gateways', 'Cost', 'Oct 24', 'Low']
  ],
  campaigns: [
    ['Untagged resource sweep', 'Cost', 'Running'],
    ['Key rotation, quarter three', 'S&G', 'Scheduled'],
    ['Idle gateway cleanup', 'Cost', 'Complete'],
    ['Probe coverage backfill', 'Resiliency', 'Scheduled']
  ],
  health: { green: 9, amber: 2, red: 0, checked: '4 min ago' },
  change: { state: 'Freeze active', until: 'Sep 15', next: 'Sep 14 – 16', requests: 14 },
  rollup: [
    ['Platform Foundations', 'A- (92)', '+3', 18, '$1.24M', 6],
    ['Identity Services', 'B (82)', '+1', 34, '$0.98M', 9],
    ['Data Services', 'A (94)', '+1', 21, '$1.65M', 4],
    ['Delivery Engineering', 'C+ (71)', '−4', 61, '$0.71M', 12]
  ],
  apps: [
    ['APP-ATLAS', 'A- (92)', 3, '$62K', '+1.8%'],
    ['APP-BEACON', 'A- (91)', 6, '$48K', '+0.2%'],
    ['APP-CINDER', 'B (84)', 12, '$76K', '−1.4%'],
    ['APP-DELTA', 'B+ (87)', 8, '$54K', '+0.9%']
  ],
  accounts: [
    ['acct-atlas-prod', 'APP-ATLAS', 'prod', 'Team Atlas', 6],
    ['acct-atlas-qa', 'APP-ATLAS', 'qa', 'Team Atlas', 2],
    ['acct-beacon-prod', 'APP-BEACON', 'prod', 'Team Beacon', 4],
    ['acct-beacon-dev', 'APP-BEACON', 'dev', 'Team Beacon', 1],
    ['acct-cinder-prod', 'APP-CINDER', 'prod', 'Team Cinder', 9]
  ],
  topres: [
    ['object-store-archive', 11], ['edge-gateway-01', 9], ['db-primary-atlas', 7],
    ['queue-ingest', 6], ['cache-session', 4], ['batch-runner-03', 4],
    ['log-shipper', 3], ['cdn-static', 2]
  ],
  upcoming: [
    ['Encryption at rest, tier 1', 'Sep 12', 5], ['Key rotation policy', 'Sep 21', 14],
    ['Runtime upgrade', 'Oct 3', 26], ['Probe coverage', 'Oct 8', 31]
  ],
  pipeline: [
    ['deploy · APP-ATLAS', 'passed', '7m ago'], ['scan · APP-ATLAS', 'passed', '31m ago'],
    ['deploy · APP-BEACON', 'blocked', '1h ago'], ['scan · APP-CINDER', 'passed', '2h ago']
  ],
  burndown: [61, 58, 55, 52, 49, 47, 44, 41, 39, 36, 33, 31],
  remediations: { open: 4, overdue: 1 },
  appdetails: [
    ['Application', 'APP-ATLAS'], ['Division', 'Platform Engineering'], ['Tier', 'Tier 1'],
    ['Environments', 'prod, qa, dev'], ['Owner', 'Team Atlas'], ['Accounts', '3'], ['Open jobs', '6']
  ]
};

/* Which scope dimensions each widget accepts. Everything not listed accepts
 * both, which is the common case and not worth writing out.
 *
 * This is the part of the spec that stops "page scope" from being a lie. A
 * divisional rollup cannot be scoped to one account and a resource ranking
 * cannot be scoped to a whole division, so a page-level filter alone either
 * applies something wrong or drops it without saying. Declaring the dimensions
 * per widget is what lets the card say which of the two happened.
 */
const WIDGET_DIMS = {
  rollup: ['division'],
  appdetails: ['account'],
  topres: ['account'],
  pipeline: ['account'],
  accounts: ['division'],
  apps: ['division']
};

/* What a dimension falls back to when the page cannot supply it. */
const SCOPE_DEFAULTS = {
  account: 'acct-atlas-prod',
  division: 'Platform Engineering'
};

/* What a widget can be pinned to, one level down from the page. */
const SCOPE_CHOICES = {
  account: ['acct-atlas-prod', 'acct-atlas-qa', 'acct-beacon-prod', 'acct-cinder-prod'],
  division: ['Platform Engineering', 'Identity Services', 'Data Services']
};
