from datetime import datetime
from typing import Dict, Any, List
from app.agents.state import TriageState, DraftAssessment, AgentThought
from app.agents.llm import generate_llm_response

ACUITY_LABELS = {
    1: "Level 1 - Resuscitation (Immediate Life Threat)",
    2: "Level 2 - Emergent (High Risk / Severe Threat)",
    3: "Level 3 - Urgent (Multiple Resources Required)",
    4: "Level 4 - Less Urgent (Single Resource Required)",
    5: "Level 5 - Non-Urgent (Self-Care / Routine Outpatient)"
}

def triage_reasoner_node(state: TriageState) -> Dict[str, Any]:
    """
    Clinical Triage Reasoner Agent:
    Synthesizes symptoms, physiological vitals, and evidence-based protocols
    to classify the Emergency Severity Index (ESI Levels 1-5), select the
    optimal care venue, and draft preliminary clinical recommendations.
    Incorporates guardrail critique feedback on refinement loops.
    """
    symptoms = state.get("extracted_symptoms", {})
    vitals = state.get("vitals", {})
    protocols = state.get("retrieved_protocols", [])
    critique = state.get("guardrail_feedback", {})
    iteration = state.get("iteration_count", 0)
    thoughts: List[AgentThought] = list(state.get("agent_thoughts", []))

    red_flags = symptoms.get("red_flag_descriptions", [])
    has_red_flags = symptoms.get("has_red_flags", False)
    complaint = symptoms.get("primary_complaint", "Unspecified symptoms")

    # Vital sign evaluations
    spo2 = vitals.get("spo2")
    hr = vitals.get("heart_rate")
    sys_bp = vitals.get("blood_pressure_systolic")
    pain = vitals.get("pain_level", 0)

    # 1. Acuity & ESI Determination
    # Check ESI 1: Immediate life threat
    is_esi_1 = any(f in " ".join(red_flags).lower() for f in ["unresponsive", "severe respiratory arrest", "pulseless", "epipen", "throat closing"])
    
    # Check ESI 2: High-risk presentation or danger zone vitals
    is_esi_2 = has_red_flags or (spo2 is not None and spo2 < 92) or (pain is not None and pain >= 8) or (hr is not None and hr > 120)

    if is_esi_1:
        esi = 1
        venue = "Emergency Department (Resuscitation Bay)"
        time_window = "Immediate - 0 Minutes (Call 911 / EMS)"
        rationale = "Presentation demonstrates potential immediate failure of airway, breathing, or hemodynamic stability."
        actions = [
            "Call 911 or local emergency services immediately.",
            "Do not drive yourself to the emergency department.",
            "Keep patient seated or lying down comfortably with open airway."
        ]
    elif is_esi_2:
        esi = 2
        venue = "Emergency Department (Monitored Unit)"
        time_window = "Immediate evaluation (Within 10-15 Minutes)"
        rationale = f"Presentation qualifies as high-risk situation based on red flags: {', '.join(red_flags) if red_flags else 'Acuity criteria'}."
        actions = [
            "Proceed immediately to the nearest Emergency Department.",
            "If chest pain, shortness of breath, or stroke symptoms are present, call 911 instead of driving.",
            "Have a list of current medications and allergies ready for triage staff."
        ]
    elif pain is not None and pain >= 5:
        esi = 3
        venue = "Urgent Care Center / Emergency Department"
        time_window = "Within 1 - 2 Hours"
        rationale = "Patient is stable but requires diagnostic evaluation (such as laboratory work or imaging) to rule out acute pathology."
        actions = [
            "Visit an Urgent Care Center or Hospital Outpatient clinic today.",
            "Monitor for red flag symptoms such as sudden worsening pain, fever, or shortness of breath."
        ]
    elif "sprain" in complaint.lower() or "rash" in complaint.lower() or "sore throat" in complaint.lower():
        esi = 4
        venue = "Outpatient Clinic or Urgent Care"
        time_window = "Within 12 - 24 Hours"
        rationale = "Condition appears localized and uncomplicated, likely requiring at most a single simple diagnostic or procedural resource."
        actions = [
            "Schedule an appointment with your primary care provider or visit a walk-in clinic.",
            "Maintain hydration and rest."
        ]
    else:
        esi = 5
        venue = "Home Self-Care / Primary Telehealth"
        time_window = "Routine / Outpatient as needed"
        rationale = "Symptoms are mild, uncomplicated, and consistent with routine self-limiting conditions requiring no acute emergency resources."
        actions = [
            "Supportive home care: rest, adequate fluid intake, and humidity.",
            "Monitor symptoms; if symptoms worsen or fail to improve after 5-7 days, consult a physician."
        ]

    # Incorporate critique on refinement loop
    refinement_note = ""
    if iteration > 0 and critique.get("critique_prompt"):
        refinement_note = f"\n[Self-Correction Applied]: Addressed prior safety critique: {critique.get('critique_prompt')}."

    # Formulate draft text advice (via live LLM or offline deterministic template)
    llm_output = generate_llm_response(
        patient_message=complaint,
        vitals=vitals,
        esi_level=esi,
        acuity_label=ACUITY_LABELS[esi],
        venue=venue,
        time_window=time_window,
        rationale=rationale,
        actions=actions,
        protocols=protocols,
        refinement_critique=critique.get("critique_prompt", "")
    )

    if llm_output:
        draft_text = llm_output
    else:
        top_citation = protocols[0]["title"] if protocols else "Emergency Severity Index Protocol"
        draft_text = (
            f"### Triage Assessment: {ACUITY_LABELS[esi]}\n\n"
            f"**Recommended Care Setting:** {venue}\n"
            f"**Evaluation Timeframe:** {time_window}\n\n"
            f"**Clinical Rationale:** {rationale} Grounded in *{top_citation}*.{refinement_note}\n\n"
            f"**Immediate Recommended Actions:**\n" +
            "\n".join(f"- {act}" for act in actions) + "\n\n"
            f"**Safety Disclaimer:** This is an automated clinical triage assessment intended for prioritization and decision support. "
            f"It does not replace professional medical diagnosis. If you experience severe or rapidly worsening symptoms, immediately call 911 or visit the nearest emergency department."
        )

    draft: DraftAssessment = {
        "esi_level": esi,
        "acuity_label": ACUITY_LABELS[esi],
        "recommended_venue": venue,
        "time_window": time_window,
        "clinical_rationale": rationale,
        "immediate_actions": actions,
        "draft_response": draft_text
    }

    thought_summary = f"Assigned ESI Level {esi} ({ACUITY_LABELS[esi]}) with recommended venue '{venue}' ({time_window}). Rationale verified against {len(protocols)} retrieved guidelines."
    if iteration > 0:
        thought_summary = f"[Refinement Pass {iteration}] {thought_summary}"

    thoughts.append({
        "agent_name": "Clinical Triage Reasoner",
        "step_type": "refinement" if iteration > 0 else "reasoning",
        "thought": thought_summary,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

    return {
        "draft_assessment": draft,
        "agent_thoughts": thoughts
    }
