import pytest
from app.rag.retriever import rag_retriever
from app.rag.evaluator import triage_evaluator
from app.agents.symptom_extractor import extract_symptoms_node
from app.agents.rag_agent import rag_specialist_node
from app.agents.triage_reasoner import triage_reasoner_node
from app.agents.safety_guardrail import safety_guardrail_node
from app.agents.state import TriageState

def test_rag_retrieval():
    results = rag_retriever.search("acute chest pain radiating to left arm", top_k=2)
    assert len(results) > 0
    assert any("cardiovascular" in r.source_file.lower() or "esi" in r.source_file.lower() for r in results)
    assert results[0].similarity_score > 0.3

def test_emergency_cardiac_triage():
    state: TriageState = {
        "patient_message": "Severe crushing chest pain radiating to my left arm with cold sweat",
        "vitals": {"heart_rate": 110, "spo2": 95, "blood_pressure_systolic": 140, "pain_level": 9},
        "chat_history": [],
        "agent_thoughts": []
    }

    # Step 1: Extract
    state.update(extract_symptoms_node(state))
    assert state["extracted_symptoms"]["has_red_flags"] is True
    assert "Chest Pain" in state["extracted_symptoms"]["red_flag_descriptions"]

    # Step 2: RAG
    state.update(rag_specialist_node(state))
    assert len(state["retrieved_protocols"]) > 0

    # Step 3: Triage Reasoner
    state.update(triage_reasoner_node(state))
    assert state["draft_assessment"]["esi_level"] in [1, 2]
    assert "Emergency" in state["draft_assessment"]["recommended_venue"]

    # Step 4: Safety Guardrail
    state.update(safety_guardrail_node(state))
    assert state["guardrail_feedback"]["is_safe"] is True

def test_routine_self_care_triage():
    state: TriageState = {
        "patient_message": "Mild runny nose and occasional sneeze for 2 days, feeling okay otherwise",
        "vitals": {"heart_rate": 72, "spo2": 99, "pain_level": 1},
        "chat_history": [],
        "agent_thoughts": []
    }

    state.update(extract_symptoms_node(state))
    assert state["extracted_symptoms"]["has_red_flags"] is False

    state.update(rag_specialist_node(state))
    state.update(triage_reasoner_node(state))
    assert state["draft_assessment"]["esi_level"] in [4, 5]

def test_guardrail_catches_prescription_dosages():
    unsafe_text = "You should take 500mg amoxicillin twice daily with meals."
    guardrail_result = triage_evaluator.check_guardrails(unsafe_text)
    assert guardrail_result["rx_violation"] is True
    assert guardrail_result["passed"] is False

def test_benchmark_metrics():
    benchmark = triage_evaluator.run_benchmark()
    assert "25" in benchmark["hallucination_reduction_achieved"]
    assert float(benchmark["factual_accuracy_rate"].replace("%", "")) >= 90.0
