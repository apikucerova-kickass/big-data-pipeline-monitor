from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase_get
from services.run_service import update_run

router = APIRouter()

class RunUpdate(BaseModel):
    status: str
    error_message: Optional[str] = None
    records_processed: Optional[int] = None

# GET /runs — seznam všech běhů
@router.get("/")
def list_runs(pipeline_id: Optional[str] = None, status: Optional[str] = None):
    params = {
        "select": "*, pipelines(name)",
        "order": "created_at.desc"
    }

    if pipeline_id:
        params["pipeline_id"] = f"eq.{pipeline_id}"
    if status:
        params["status"] = f"eq.{status}"

    result = supabase_get("job_runs", params)
    return result

# GET /runs/:id — detail jednoho běhu
@router.get("/{run_id}")
def get_run(run_id: str):
    result = supabase_get("job_runs", {
        "id": f"eq.{run_id}",
        "select": "*, pipelines(name)"
    })
    if not result:
        raise HTTPException(status_code=404, detail="Run nenalezen")

    # Načíst i kroky běhu
    steps = supabase_get("job_run_steps", {
        "run_id": f"eq.{run_id}",
        "order": "created_at"
    })

    run_data = result[0]
    run_data["steps"] = steps
    return run_data

# PATCH /runs/:id — změna stavu běhu
@router.patch("/{run_id}")
def update_run_route(run_id: str, update: RunUpdate):
    return update_run(
        run_id=run_id,
        status=update.status,
        error_message=update.error_message,
        records_processed=update.records_processed
    )