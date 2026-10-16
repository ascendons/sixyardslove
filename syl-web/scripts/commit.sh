#!/usr/bin/env bash
# Commit script: run build, test, format, lint, npm audit.
# Updates docs/COMMIT-CHECKS.md and docs/COMMIT-CHECKS.log. If all pass, runs git commit.
# Usage: ./scripts/commit.sh "your commit message"
#    or: npm run commit -- "your commit message"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RUN_DATE=$(date "+%Y-%m-%d %H:%M:%S")

# 1. Build
if npm run build >/dev/null 2>&1; then B_RES="Pass"; B=0; else B_RES="Fail"; B=1; fi

# 2. Test
if npm run test >/dev/null 2>&1; then T_RES="Pass"; T=0; else T_RES="Fail"; T=1; fi

# 3. Format (writes to files)
if npm run format >/dev/null 2>&1; then F_RES="Pass"; F=0; else F_RES="Fail"; F=1; fi

# 4. Lint
if npm run lint >/dev/null 2>&1; then L_RES="Pass"; L=0; else L_RES="Fail"; L=1; fi

# 5. Audit
if npm audit >/dev/null 2>&1; then A_RES="Pass"; A=0; else A_RES="Fail"; A=1; fi

# Overall
if [ "$B" -eq 0 ] && [ "$T" -eq 0 ] && [ "$F" -eq 0 ] && [ "$L" -eq 0 ] && [ "$A" -eq 0 ]; then
  OVERALL="Pass"
else
  OVERALL="Fail"
fi

# Commit info for the doc (message if we will commit, else -)
if [ "$OVERALL" = "Pass" ] && [ $# -ge 1 ]; then
  COMMIT_INFO="$*"
else
  COMMIT_INFO="-"
fi

# Append to log (tab-separated; avoid | in commit message)
printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
  "$RUN_DATE" "$B_RES" "$T_RES" "$F_RES" "$L_RES" "$A_RES" "$OVERALL" "$COMMIT_INFO" \
  >> docs/COMMIT-CHECKS.log

# Build History table from last 10 log lines
HIST=""
if [ -f docs/COMMIT-CHECKS.log ]; then
  HIST=$(tail -10 docs/COMMIT-CHECKS.log | while IFS=$'\t' read -r d b t f l a o c; do
    echo "| $d | $b | $t | $f | $l | $a | $o | $c |"
  done)
fi
[ -z "$HIST" ] && HIST="*(no history yet)*"

# Write COMMIT-CHECKS.md
cat > docs/COMMIT-CHECKS.md << EOF
# Commit checks

Updated by \`scripts/commit.sh\`. Run: \`./scripts/commit.sh "your message"\` or \`npm run commit -- "your message"\`

- **Build:** \`npm run build\`
- **Test:** \`npm run test\`
- **Format:** \`npm run format\` (Prettier)
- **Lint:** \`npm run lint\`
- **Audit:** \`npm audit\` (vulnerabilities block commit)

## Last run

| Date | Build | Test | Format | Lint | Audit | Overall | Commit |
|------|-------|------|--------|------|-------|---------|--------|
| $RUN_DATE | $B_RES | $T_RES | $F_RES | $L_RES | $A_RES | $OVERALL | $COMMIT_INFO |

## History (last 10)

| Date | Build | Test | Format | Lint | Audit | Overall | Commit |
|------|-------|------|--------|------|-------|---------|--------|
"$HIST"
EOF

# Commit if all pass and message given
if [ "$OVERALL" = "Pass" ] && [ $# -ge 1 ]; then
  git add -A
  git commit -m "$*"
  echo "Committed: $*"
  exit 0
else
  if [ "$OVERALL" != "Pass" ]; then
    echo "Checks failed (Build / Test / Format / Lint / Audit). Fix and re-run. See docs/COMMIT-CHECKS.md"
    echo "  Build: $B_RES | Test: $T_RES | Format: $F_RES | Lint: $L_RES | Audit: $A_RES"
  elif [ $# -lt 1 ]; then
    echo "All checks passed. Provide a commit message: ./scripts/commit.sh \"your message\""
  fi
  exit 1
fi
