from typing import TypedDict, List, Dict, Any, Optional

class Vitals(TypedDict, total=False):
    heart_rate: Optional[int]
    blood_pressure_systolic: Optional[int]
    blood_pressure_diastolic: Optional[int]
    respiratory_rate: Optional[int]
    spo2: Optional[int]
    temperature_c: Optional[float]
    pain_level: Optional[int]  # 0 to 10

class ExtractedSymptoms(TypedDict, total=False):
    primary_complaint: str
    duration: str
    severity: str
    triggers: List[str]
    associated_symptoms: List[str]
    has_red_flags: bool
    red_flag_descriptions: List[str]

class DraftAssessment(TypedDict, total=False):
    esi_level: int  # 1 (Resuscitation) to 5 (Non-urgent)
    acuity_label: str # "Resuscitation" | "Emergent" | "Urgent" | "Less Urgent" | "Non-urgent"
    recommended_venue: str # "Emergency Department (ED)" | "Urgent Care" | "Primary Care Clinic" | "Telehealth" | "Self-Care at Home"
    time_window: str # e.g. "Immediate (0-15 mins)" | "Within 1-2 hours" | "Within 24-48 hours" | "Elective"
    clinical_rationale: str
    immediate_actions: List[str]
    draft_response: str

class GuardrailFeedback(TypedDict, total=False):
    is_safe: bool
    hallucination_score: float  # 0.0 (grounded) to 1.0 (hallucinated)
    violations: List[str]
    critique_prompt: str
    passes_disclaimer: bool
    passes_rx_policy: bool
    passes_red_flag_alignment: bool

class AgentThought(TypedDict):
    agent_name: str
    step_type: str  # "extraction" | "retrieval" | "reasoning" | "guardrail_check" | "refinement" | "final"
    thought: str
    timestamp: str

class TriageState(TypedDict, total=False):
    patient_message: str
    chat_history: List[Dict[str, str]]
    vitals: Vitals
    extracted_symptoms: ExtractedSymptoms
    retrieved_protocols: List[Dict[str, Any]]
    draft_assessment: DraftAssessment
    guardrail_feedback: GuardrailFeedback
    iteration_count: int
    agent_thoughts: List[AgentThought]
    final_response: str
    final_esi_card: Dict[str, Any]
