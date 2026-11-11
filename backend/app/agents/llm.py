import logging
from typing import Optional, List, Dict, Any
from app.config import settings

logger = logging.getLogger("mediflow.llm")

def generate_llm_response(
    patient_message: str,
    vitals: Dict[str, Any],
    esi_level: int,
    acuity_label: str,
    venue: str,
    time_window: str,
    rationale: str,
    actions: List[str],
    protocols: List[Dict[str, Any]],
    refinement_critique: str = ""
) -> Optional[str]:
    """
    Optionally invokes Gemini or OpenAI when configured with valid API keys.
    Returns None if LLM_PROVIDER is 'mock', keys are missing, or any API failure occurs,
    allowing the system to seamlessly fall back to deterministic clinical templates.
    """
    provider = settings.LLM_PROVIDER.lower().strip()
    if provider == "mock":
        return None

    # Compile clinical context for the LLM
    protocol_citations = "\n".join(
        f"- {p.get('title', 'Guideline')}: {p.get('content', '')[:200]}..."
        for p in protocols[:3]
    )
    vitals_str = ", ".join(f"{k}: {v}" for k, v in vitals.items() if v is not None) if vitals else "None recorded"
    actions_str = "\n".join(f"- {act}" for act in actions)

    system_instruction = (
        "You are MediFlow's Clinical Triage Reasoner agent. "
        "Your task is to write a concise, compassionate, and medically grounded triage assessment. "
        "CRITICAL SAFETY CONSTRAINTS:\n"
        f"1. You MUST maintain the calculated acuity tier: ESI Level {esi_level} ({acuity_label}).\n"
        f"2. Recommended care venue MUST be: {venue} within {time_window}.\n"
        "3. NEVER prescribe medications or give specific drug dosages.\n"
        "4. ALWAYS end with this exact disclaimer:\n"
        "'Safety Disclaimer: This is an automated clinical triage assessment intended for prioritization and decision support. It does not replace professional medical diagnosis. If you experience severe or rapidly worsening symptoms, immediately call 911 or visit the nearest emergency department.'"
    )

    critique_instruction = f"\n\nPRIOR SAFETY CRITIQUE TO RESOLVE:\n{refinement_critique}" if refinement_critique else ""

    user_prompt = (
        f"Patient Presentation: {patient_message}\n"
        f"Physiological Vitals: {vitals_str}\n"
        f"Calculated Acuity: ESI Level {esi_level} - {acuity_label}\n"
        f"Target Care Venue: {venue} ({time_window})\n"
        f"Clinical Rationale: {rationale}\n"
        f"Guideline Protocols:\n{protocol_citations}\n"
        f"Immediate Actions Required:\n{actions_str}"
        f"{critique_instruction}\n\n"
        "Draft the clinical triage assessment according to the rules."
    )

    # 1. Google Gemini Provider
    if provider == "gemini":
        if not settings.GEMINI_API_KEY:
            logger.info("GEMINI_API_KEY not set. Using offline clinical fallback.")
            return None
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=system_instruction
            )
            response = model.generate_content(user_prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini API call failed, falling back to mock engine: {e}")
            return None

    # 2. OpenAI Provider
    elif provider == "openai":
        if not settings.OPENAI_API_KEY:
            logger.info("OPENAI_API_KEY not set. Using offline clinical fallback.")
            return None
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            completion = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=600
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"OpenAI API call failed, falling back to mock engine: {e}")
            return None

    return None

