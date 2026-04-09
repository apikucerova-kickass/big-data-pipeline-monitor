from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from database import supabase_get, supabase_post

router = APIRouter()

class PipelineCreate(BaseModel):
    dataset_id: str
    name: str
    description: Optional[str] = None
    schedule: Optional[str] = None
    active: bool = True

# POST /pipelines — vytvoření nové pipeline
@router.post("/")
def create_pipeline(pipeline: PipelineCreate):
    if not pipeline.name.strip():
        raise HTTPException(status_code=400, detail="Název pipeline nesmí být prázdný")

    # Ověření, že dataset existuje
    ds = supabase_get("datasets", {"id": f"eq.{pipeline.dataset_id}"})
    if not ds:
        raise HTTPException(status_code=400, detail="Dataset neexistuje")

    result = supabase_post("pipelines", {
        "dataset_id": pipeline.dataset_id,
        "name": pipeline.name,
        "description": pipeline.description,
        "schedule": pipeline.schedule,
        "active": pipeline.active
    })

    return result[0]

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
def run_pipeline(pipeline_id: str):
    # 1. Načíst pipeline
    p = supabase_get("pipelines", {"id": f"eq.{pipeline_id}"})
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline nenalezena")

    pipeline = p[0]

    # 2. Ověřit, že je aktivní
    if not pipeline["active"]:
        raise HTTPException(status_code=400, detail="Pipeline není aktivní, nelze spustit")

    # 3. Vytvořit nový JobRun se stavem "running"
    run = supabase_post("job_runs", {
        "pipeline_id": pipeline_id,
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat()
    })

    # 4. Vytvořit kroky (extract, transform, load)
    run_id = run[0]["id"]
    for step_name in ["extract", "transform", "load"]:
        supabase_post("job_run_steps", {
            "run_id": run_id,
            "name": step_name,
            "status": "pending"
        })

    return run[0]