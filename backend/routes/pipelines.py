from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase_get
from services.pipeline_service import create_pipeline, run_pipeline

router = APIRouter()

class PipelineCreate(BaseModel):
    dataset_id: str
    name: str
    description: Optional[str] = None
    schedule: Optional[str] = None
    active: bool = True

# POST /pipelines — vytvoření nové pipeline
@router.post("/")
def create_pipeline_route(pipeline: PipelineCreate):
    return create_pipeline(pipeline.model_dump())

# GET /pipelines — seznam všech pipeline
@router.get("/")
def list_pipelines():
    result = supabase_get("pipelines", {
        "select": "*, datasets(name)",
        "order": "created_at.desc"
    })
    return result

# GET /pipelines/:id — detail jedné pipeline
@router.get("/{pipeline_id}")
def get_pipeline(pipeline_id: str):
    result = supabase_get("pipelines", {
        "id": f"eq.{pipeline_id}",
        "select": "*, datasets(name)"
    })
    if not result:
        raise HTTPException(status_code=404, detail="Pipeline nenalezena")
    return result[0]

# POST /pipelines/:id/run — spuštění pipeline
@router.post("/{pipeline_id}/run")
def run_pipeline_route(pipeline_id: str):
    return run_pipeline(pipeline_id)