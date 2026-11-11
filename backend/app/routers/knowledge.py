from fastapi import APIRouter, Query
from typing import Optional
from app.rag.retriever import rag_retriever

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base & RAG"])

@router.get("/search", summary="Search clinical protocols via RAG")
def search_protocols(q: str = Query(..., description="Query symptom or protocol keyword"), top_k: int = 4):
    results = rag_retriever.search(query=q, top_k=top_k)
    return {
        "query": q,
        "results_count": len(results),
        "protocols": [r.model_dump() for r in results]
    }

@router.get("/protocols", summary="Retrieve all indexed clinical reference protocols")
def get_all_protocols():
    return {
        "protocols": rag_retriever.get_all_protocols()
    }

@router.get("/stats", summary="Get knowledge base vector statistics")
def get_stats():
    return rag_retriever.get_stats()
