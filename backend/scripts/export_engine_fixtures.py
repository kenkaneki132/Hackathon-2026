"""
Export golden fixtures from the Python scoring/simulation engine so the browser port
(frontend/src/utils/localEngine.js) can be tested for exact parity.

  cd backend && python scripts/export_engine_fixtures.py

Writes frontend/src/utils/__fixtures__/engine_cases.json. backend/tests/test_engine.py fails
if this file is stale, so rerun the script whenever the scoring logic changes.
"""

import itertools
import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

import main  # noqa: E402

OUT = BACKEND.parent / "frontend" / "src" / "utils" / "__fixtures__" / "engine_cases.json"


def profile_cases():
    combos = itertools.product(
        [(24, 32000, 1900), (38, 85000, 4200), (61, 140000, 6100)],     # age, income, monthly expenses
        ["employed", "self_employed", "unemployed", "retired"],
        [0, 2],                                                          # dependents
        ["rent", "own", "other"],
        [("85001", True, 4.5), ("33101", False, 0.0), ("10001", True, 1.5)],  # zip, has_savings, months
    )
    for i, ((age, inc, exp), emp, dep, housing, (zipc, has, months)) in enumerate(combos):
        if i % 5:
            continue  # sample: a prime step spreads cases across every dimension
        yield {"age": age, "annual_income": inc, "monthly_expenses": exp, "dependents": dep,
               "housing_type": housing, "zip_code": zipc, "employment": emp,
               "has_savings": has, "savings_months": months}


def sim_cases():
    combos = itertools.product(
        [(26, "under_30k"), (41, "60k_100k"), (58, "over_100k")],
        ["employed", "self_employed", "unemployed", "retired"],
        [0, 3],
        [0, 3, 6],
        [2, 8],
        ["emergency_fund", "homeownership"],
        [("buy_car", 900), ("move_city", 400), ("take_loan", 1500), ("change_job", 0)],
        [6, 24],
    )
    for i, ((age, inc), emp, dep, sav, stress, goal, (dec, cost), horizon) in enumerate(combos):
        if i % 23:
            continue
        yield {"age": age, "income_range": inc, "employment": emp, "dependents": dep, "current_savings": sav,
               "stress_level": stress, "goal_priority": goal, "decision_type": dec, "decision_cost": cost,
               "time_horizon": horizon}


def build():
    analyze = []
    for p in profile_cases():
        prof = main.UserProfile(**p)
        scores = main.calculate_risk_scores(prof)
        analyze.append({"input": p, "output": {
            "scores": scores,
            "action_plan": main.build_action_plan_finguard(prof, scores),
            "insurance_recommendations": main.get_insurance_recommendations(prof),
        }})
    simulate = [{"input": p, "output": main.build_simulation_analysis(main.SimulationProfile(**p))} for p in sim_cases()]
    chats = ["How big should my emergency fund be?", "do renters need insurance", "Explain the 50/30/20 budget",
             "what about flood risk", "Should I pay off my credit card debt", "hello", "Tell me about disability coverage"]
    return {"analyze": analyze, "simulate": simulate,
            "chat": [{"input": m, "output": main.fallback_chat(m)} for m in chats],
            "flood": {z: main.get_flood_risk(z) for z in ["00501", "12345", "33101", "85001", "99501", ""]}}


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = build()
    OUT.write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(data['analyze'])} analyze + {len(data['simulate'])} simulate cases -> {OUT}")
