# PAUL config — finance-pwa

autonomous: true
loop_engine: schedulewakeup
quality_gate: true
payoff_gate: true
reality_check_gate: true
intent_alignment_gate: true

# Milestone actif : v0.7 (phases 11 → 13). Ignore les phases 01/02/03/07/10 (milestones antérieurs abandonnés).
active_phases: 11,12,13

# E2E : suite Playwright existante (lancée seulement en fin de milestone).
e2e: npm run test:e2e
