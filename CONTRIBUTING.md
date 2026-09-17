# Contributing to GoreeCloud Memos

GoreeCloud Memos is under active development. Material changes should use a short-lived, purpose-specific branch and a pull request targeting `main`.

Before opening a pull request:

```bash
npm run check
npm test
```

Keep changes focused, avoid committing secrets or machine-local state, update repository documentation when behavior changes, and do not represent planned roadmap work as implemented without corresponding source and verification evidence.

Branch names should follow GoreeCloud's `<type>/<descriptive-kebab-case-subject>` convention, such as `feature/local-search` or `fix/draft-recovery`.
