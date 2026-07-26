function cmpString(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function cmpNumber(a, b) {
  return a - b;
}

function sortBy(items, keyFn, cmp = cmpString) {
  return [...items].sort((a, b) => cmp(keyFn(a), keyFn(b)));
}

function normalizeVerificationResults(results) {
  const kindOrder = { commit: 0, pull_request: 1 };
  return [...results].sort((a, b) => {
    const ka = kindOrder[a.kind] ?? 99;
    const kb = kindOrder[b.kind] ?? 99;
    if (ka !== kb) return ka - kb;
    if (a.kind === "commit" && b.kind === "commit") return cmpString(a.sha, b.sha);
    if (a.kind === "pull_request" && b.kind === "pull_request") {
      return cmpNumber(a.number, b.number);
    }
    return 0;
  });
}

function normalizePullRequest(pr) {
  return {
    ...pr,
    files: sortBy(pr.files ?? [], (f) => f.path),
    commits: sortBy(pr.commits ?? [], (c) => c.committedDate + "\0" + c.oid),
    checks: sortBy(pr.checks ?? [], (c) => c.name),
    issueComments: sortBy(pr.issueComments ?? [], (c) => c.id, cmpNumber),
    reviews: sortBy(pr.reviews ?? [], (r) => r.id, cmpNumber),
  };
}

/**
 * Deterministically sort nested raw-snapshot collections.
 * Does not invent fields or drop fetched observations.
 */
export function normalizeRawSnapshot(snapshot) {
  return {
    ...snapshot,
    verification: {
      ...snapshot.verification,
      results: normalizeVerificationResults(snapshot.verification?.results ?? []),
    },
    pullRequests: sortBy(snapshot.pullRequests ?? [], (p) => p.number, cmpNumber).map(
      normalizePullRequest,
    ),
  };
}

export function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
