# Graph Report - server/src/routes  (2026-05-29)

## Corpus Check
- 7 files · ~613 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 19 nodes · 12 edges · 7 communities (1 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b3feef25`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]

## God Nodes (most connected - your core abstractions)
1. `router` - 1 edges
2. `router` - 1 edges
3. `router` - 1 edges
4. `router` - 1 edges
5. `router` - 1 edges
6. `router` - 1 edges
7. `tempDir` - 1 edges
8. `storage` - 1 edges
9. `upload` - 1 edges
10. `router` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (7 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (4): router, storage, tempDir, upload

## Knowledge Gaps
- **10 isolated node(s):** `router`, `router`, `router`, `router`, `router` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `router`, `router`, `router` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._