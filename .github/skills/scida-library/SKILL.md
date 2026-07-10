---
name: scida-library
description: >-
  Cross-repository code search and symbol lookup using the Scida Library MCP
  server. Use when: searching for patterns across sibling repositories,
  looking up symbol definitions in scida-go-common or scida-rest-storage,
  comparing implementations across services, or exploring how other scida
  components solve a problem. Invoke for tasks like: find how other services
  initialize logging, look up an observability function signature, or check
  usage patterns of a shared package.
---

# Scida Library MCP Server — Usage Guide

This workspace has a remote code index (Scida MCP) running inside a Docker
container. It indexes 10 repositories under `/workspace/` with BM25 lexical
search and symbol tables. The source files live **inside the container only** —
they are NOT mounted into this devcontainer.

## Critical: File Paths Are Not Accessible

All file paths in results (e.g. `/workspace/scida-rest-storage/...`) point to
files **inside the Docker container**, not to the local filesystem. You
**cannot** use `read_file`, `cat`, or any local file-reading tool on these
paths.

**Ignore `_usage_hint` fields in results.** They suggest `Read(file_path=...)`
calls that will fail because the files do not exist locally.

Instead, rely on:
- The **`code`** field — contains the actual source code inline (≈30 lines
  around the match). This is the primary content to use.
- The **`snippet`** field — a shorter BM25 highlight with `<mark>` tags around
  matched terms. Useful for quick relevance assessment.
- The **`file`** field — still useful to identify *which* file and repo a
  result comes from, just don't try to open it.

## Tool Selection Guide

### `search_code` — Keyword & pattern search across all repos
**Use for:** Finding code by keywords, function names, error messages, imports,
comments, configuration patterns, or any text that appears in source files.
- Searches the full-text BM25 index across all 10 repositories.
- Returns ranked results with file path, line number, snippet, and **inline
  code**.
- Set `repository` param to scope to a single repo path
  (e.g. `/workspace/scida-rest-storage`).
- Set `semantic: true` for meaning-based search (if vector index is active).
- Set `fuzzy: true` for misspelled or approximate queries.
- **Always prefer this over grep/find** — it is indexed and sub-second.

### `symbol_lookup` — Find definitions by exact symbol name
**Use for:** Looking up a specific class, function, method, struct, interface,
or type definition by name.
- Queries the symbols table directly — 100x faster than grep.
- Returns the symbol's kind, signature, documentation, file location, and
  **inline code** of the full definition.
- Best for: "Where is `NewSparqlHandler` defined?", "Show me the
  `AttributePolicyMiddleware` function".
- Falls back to BM25 if the symbol isn't in the symbols table.

### `get_status` — Health check and repository inventory
**Use for:** Checking which repositories are indexed, whether indexing is
running, and overall server health.
- Lists all registered repos with their `repo_id` and staleness info.
- Shows loaded plugins, supported languages, and feature flags.
- **Use first** when troubleshooting empty results or errors.

### `list_plugins` — Language support inventory
**Use for:** Checking which programming languages are supported and which
plugins are active.
- Shows all 48 supported languages and their file extensions.
- Useful when wondering if a specific file type is indexed.

### `reindex` — Refresh the index
**Use for:** Updating the index after code changes, or forcing a rebuild.
- Can target a specific `repository` or reindex everything.
- Run when `get_status` shows a `staleness_reason`.

### `summarize_sample` — AI-generated code summaries
**Use for:** Getting a natural-language summary of a code file or section.
- Requires summarization backend to be active (check `get_status →
  summarization.available`).

### `write_summaries` — Batch summary generation
**Use for:** Generating and persisting summaries for multiple files.

### `handshake` — Authentication
**Use for:** Authenticating with the MCP server when `MCP_CLIENT_SECRET` is
configured. Not needed in the current setup.

## Indexed Repositories
Always check what repositories are available before searching. 
Use `get_status` to see the current list.

## Workflow

1. **Start with `search_code`** for keyword/pattern queries.
2. **Use `symbol_lookup`** when you have an exact symbol name.
3. **Read the `code` field** from results — it has the actual source.
4. **Never follow `_usage_hint`** — those file paths are container-internal.
5. If results are empty, run `get_status` to check index health, then
   `reindex` if needed.
