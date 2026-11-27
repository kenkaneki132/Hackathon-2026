"""Backend tests: scoring determinism, simulator invariants, offline coach, API routes.

Run:  cd backend && pip install -r requirements.txt -r requirements-dev.txt && pytest -q
"""

import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND / "scripts"))

import main  # noqa: E402
import export_engine_fixtures as fx  # noqa: E402

client = TestClient(main.app)

BASE_PROFILE = {"age": 32, "annual_income": 72000, "monthly_expenses": 3200, "dependents": 1,
                "housing_type": "rent", "zip_code": "85281", "employment": "employed",
                "has_savings": True, "savings_months": 2.5}
BASE_SIM = {"age": 30, "income_range": "60k_100k", "employment": "employed", "dependents": 0,
            "current_savings": 3, "stress_level": 5, "goal_priority": "emergency_fund",
            "decision_type": "buy_car", "decision_cost": 900, "time_horizon": 12}


# ── scoring ───────────────────────────────────────────────────────────────────

def test_scores_are_deterministic():
    """Regression: insurance score used to be random.randint(30, 70)."""
    a = client.post("/api/analyze", json=BASE_PROFILE).json()
    b = client.post("/api/analyze", json=BASE_PROFILE).json()
    assert a["scores"] == b["scores"]


@pytest.mark.parametrize("p", list(fx.profile_cases()))
def test_all_scores_in_range(p):
    s = main.calculate_risk_scores(main.UserProfile(**p))
    assert 0 <= s["overall"] <= 100
    assert 20 <= s["insurance"]["score"] <= 90
    assert 0 <= s["emergency_fund"]["score"] <= 100
    assert s["emergency_fund"]["gap_amount"] >= 0


def test_dependents_raise_fund_target_and_require_life_insurance():
    s0 = main.calculate_risk_scores(main.UserProfile(**{**BASE_PROFILE, "dependents": 0}))
    s2 = main.calculate_risk_scores(main.UserProfile(**{**BASE_PROFILE, "dependents": 2}))
    assert s0["emergency_fund"]["target_months"] == 3 and s2["emergency_fund"]["target_months"] == 6
    assert "life" in s2["insurance"]["recommended"] and "life" not in s0["insurance"]["recommended"]
    assert s2["insurance"]["score"] < s0["insurance"]["score"]


def test_more_savings_never_lowers_overall_score():
    prev = -1
    for months in [0, 1, 2, 3, 6, 12]:
        o = main.calculate_risk_scores(main.UserProfile(**{**BASE_PROFILE, "savings_months": months}))["overall"]
        assert o >= prev
        prev = o


@pytest.mark.parametrize("zipc,risk", [("33101", "high"), ("85001", "low"), ("10001", "low"), ("20001", "medium"), ("", "medium")])
def test_flood_risk_by_zip_prefix(zipc, risk):
    assert main.get_flood_risk(zipc) == risk


def test_umbrella_only_for_higher_income():
    low = {r["id"] for r in main.get_insurance_recommendations(main.UserProfile(**{**BASE_PROFILE, "annual_income": 40000}))}
    high = {r["id"] for r in main.get_insurance_recommendations(main.UserProfile(**{**BASE_PROFILE, "annual_income": 120000}))}
    assert "umbrella" not in low and "umbrella" in high


# ── simulator ─────────────────────────────────────────────────────────────────

def test_simulation_shape_and_bounds():
    r = client.post("/api/simulate", json=BASE_SIM).json()
    assert [s["id"] for s in r["scenarios"]] == ["safe", "balanced", "risky"]
    for s in r["scenarios"]:
        for k in ("financial_score", "stress_score", "risk_score", "goal_score", "resilience_score"):
            assert 0 <= s[k] <= 100
        assert [t["month"] for t in s["timeline"]] == sorted(t["month"] for t in s["timeline"])
    assert len(r["shock_test"]["results"]) == 3
    assert all(v >= 0 for v in r["metrics"].values())


def test_risky_path_costs_more_per_month_than_safe():
    r = main.build_simulation_analysis(main.SimulationProfile(**BASE_SIM))
    cost = {s["id"]: s["monthly_impact"] for s in r["scenarios"]}
    assert cost["safe"] < cost["balanced"] < cost["risky"]


def test_job_loss_hurts_unemployed_more_than_employed():
    emp = main.build_simulation_analysis(main.SimulationProfile(**BASE_SIM))
    unemp = main.build_simulation_analysis(main.SimulationProfile(**{**BASE_SIM, "employment": "unemployed"}))
    assert unemp["shock_test"]["results"][1]["shock"]["cash_hit"] > emp["shock_test"]["results"][1]["shock"]["cash_hit"]


# ── chat ──────────────────────────────────────────────────────────────────────

def test_chat_without_key_uses_offline_coach(monkeypatch):
    monkeypatch.setattr(main, "GEMINI_API_KEY", "")
    r = client.post("/api/chat", json={"message": "How do I start an emergency fund?"}).json()
    assert r["source"] == "fallback" and "Emergency Fund" in r["response"]


def test_chat_rejects_empty_message():
    assert client.post("/api/chat", json={"message": "   "}).status_code == 400


@pytest.mark.parametrize("msg,needle", [("budget help", "50/30/20"), ("credit card debt", "avalanche"),
                                        ("flood zone?", "FEMA"), ("hi", "What would you like to know")])
def test_fallback_topics(msg, needle):
    assert needle in main.fallback_chat(msg)


def test_protected_routes_require_auth():
    assert client.get("/api/me").status_code == 401
    assert client.post("/api/tts", json={"text": "hi"}).status_code == 401


def test_invalid_profile_is_rejected():
    assert client.post("/api/analyze", json={**BASE_PROFILE, "annual_income": 0}).status_code == 422


# ── JS parity fixtures ────────────────────────────────────────────────────────

def test_js_fixtures_are_up_to_date():
    """frontend/src/utils/localEngine.js is tested against this file; regenerate it if logic changes."""
    assert fx.OUT.exists(), "run: python scripts/export_engine_fixtures.py"
    current = json.loads(json.dumps(fx.build(), ensure_ascii=False))
    assert json.loads(fx.OUT.read_text(encoding="utf-8")) == current, "stale fixtures: run scripts/export_engine_fixtures.py"
