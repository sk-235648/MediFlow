from typing import Optional, List, Dict, Any
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.agents.graph import stream_triage_flow, run_triage_flow

router = APIRouter(prefix="/triage", tags=["Triage"])

class VitalsInput(BaseModel):
    heart_rate: Optional[int] = Field(None, description="Heart rate in beats per minute")
    blood_pressure_systolic: Optional[int] = Field(None, description="Systolic blood pressure in mmHg")
    blood_pressure_diastolic: Optional[int] = Field(None, description="Diastolic blood pressure in mmHg")
    respiratory_rate: Optional[int] = Field(None, description="Breaths per minute")
    spo2: Optional[int] = Field(None, description="Blood oxygen saturation percentage (e.g. 98)")
    temperature_c: Optional[float] = Field(None, description="Body temperature in Celsius")
    pain_level: Optional[int] = Field(None, ge=0, le=10, description="Pain score from 0 (none) to 10 (worst)")

class TriageRequest(BaseModel):
    message: str = Field(..., description="Patient symptom complaint or clinical inquiry")
    vitals: Optional[VitalsInput] = None
    chat_history: Optional[List[Dict[str, str]]] = []

class TriageResponse(BaseModel):
    final_response: str
    final_esi_card: Dict[str, Any]
    agent_thoughts: List[Dict[str, Any]]

@router.post("/stream", summary="Stream LangGraph agent thoughts and triage response")
async def stream_triage(payload: TriageRequest):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint.
    Emits thought trace events, tokens, and final structured ESI triage card.
    """
    vitals_dict = payload.vitals.model_dump(exclude_none=True) if payload.vitals else {}
    
    return StreamingResponse(
        stream_triage_flow(
            patient_message=payload.message,
            vitals=vitals_dict,
            chat_history=payload.chat_history
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/assess", response_model=TriageResponse, summary="Perform synchronous multi-agent triage")
async def assess_triage(payload: TriageRequest):
    """
    Direct asynchronous execution returning complete triage assessment.
    """
    vitals_dict = payload.vitals.model_dump(exclude_none=True) if payload.vitals else {}
    result = await run_triage_flow(
        patient_message=payload.message,
        vitals=vitals_dict,
        chat_history=payload.chat_history
    )
    return result
