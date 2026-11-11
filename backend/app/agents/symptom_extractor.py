import re
from datetime import datetime
from typing import Dict, Any, List
from app.agents.state import TriageState, ExtractedSymptoms, AgentThought

RED_FLAG_PATTERNS = {
    "chest_pain": r"\b(chest\s+pain|chest\s+pressure|heaviness\s+in\s+chest|tightness\s+in\s+chest|angina|crushing\s+chest)\b",
    "stroke": r"\b(facial\s+droop|face\s+droop|slurr(ed|ing)\s+speech|arm\s+weak(ness)?|loss\s+of\s+balance|vision\s+loss|be-fast)\b",
    "severe_dyspnea": r"\b(shortness\s+of\s+breath|cannot\s+breathe|gasping|stridor|choking|cyanosis|blue\s+lips)\b",
    "anaphylaxis": r"\b(throat\s+closing|lip\s+swelling|tongue\s+swelling|epipen|hives\s+and\s+breath)\b",
    "altered_mental": r"\b(unresponsive|passed\s+out|syncope|fainted|unconscious|disoriented|confused)\b",
    "severe_bleeding": r"\b(spurting\s+blood|vomiting\s+blood|coughing\s+blood|hematemesis|uncontrolled\s+bleed)\b"
}

def extract_symptoms_node(state: TriageState) -> Dict[str, Any]:
    """
    Symptom & Vitals Extractor Agent:
    Parses patient natural language input and physiological vitals
    to extract clinical symptoms, duration, severity, and red flags.
    """
    message = state.get("patient_message", "").strip()
    vitals = state.get("vitals", {})
    thoughts: List[AgentThought] = list(state.get("agent_thoughts", []))

    # Red Flag Detection
    detected_red_flags = []
    text_to_scan = message.lower()
    
    for flag_name, pattern in RED_FLAG_PATTERNS.items():
        if re.search(pattern, text_to_scan):
            detected_red_flags.append(flag_name.replace("_", " ").title())

    # Check Vitals Red Flags
    hr = vitals.get("heart_rate")
    spo2 = vitals.get("spo2")
    sys_bp = vitals.get("blood_pressure_systolic")
    pain = vitals.get("pain_level", 0)

    if spo2 is not None and spo2 < 92:
        detected_red_flags.append(f"Critical Hypoxia (SpO2: {spo2}%)")
    if hr is not None and (hr > 125 or hr < 45):
        detected_red_flags.append(f"Severe Arrhythmia / Tachycardia (HR: {hr} bpm)")
    if sys_bp is not None and sys_bp >= 180:
        detected_red_flags.append(f"Severe Hypertensive Crisis (Systolic BP: {sys_bp} mmHg)")
    if pain is not None and pain >= 8:
        detected_red_flags.append(f"Severe Acute Distress (Pain Score: {pain}/10)")

    has_red_flags = len(detected_red_flags) > 0

    # Extract duration heuristically if present
    duration_match = re.search(r"(\d+\s*(?:day|days|hour|hours|minute|minutes|week|weeks|month|months))", text_to_scan)
    duration = duration_match.group(1) if duration_match else "Unspecified / Acute onset"

    # Identify primary complaint
    complaint = message.split(".")[0] if message else "Unspecified complaint"
    if len(complaint) > 80:
        complaint = complaint[:80] + "..."

    extracted: ExtractedSymptoms = {
        "primary_complaint": complaint,
        "duration": duration,
        "severity": f"High (Red Flags: {len(detected_red_flags)})" if has_red_flags else "Standard / Moderate",
        "triggers": [],
        "associated_symptoms": detected_red_flags,
        "has_red_flags": has_red_flags,
        "red_flag_descriptions": detected_red_flags
    }

    thought_summary = f"Extracted complaint: '{complaint}'. Identified {len(detected_red_flags)} critical red flags: {detected_red_flags if detected_red_flags else 'None detected'}."
    thoughts.append({
        "agent_name": "Symptom & Vitals Extractor",
        "step_type": "extraction",
        "thought": thought_summary,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

    return {
        "extracted_symptoms": extracted,
        "agent_thoughts": thoughts
    }
