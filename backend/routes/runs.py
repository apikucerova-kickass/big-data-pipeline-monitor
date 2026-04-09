from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from database import supabase_get, supabase_post, supabase_patch

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
def update_run(run_id: str, update: RunUpdate):
    # Načíst aktuální stav
    current = supabase_get("job_runs", {"id": f"eq.{run_id}"})
    if not current:
        raise HTTPException(status_code=404, detail="Run nenalezen")

    current_status = current[0]["status"]

    # Doménové pravidlo: povolené přechody stavů
    allowed = {
        "pending": ["running"],
        "running": ["success", "failed"],
    }

    if update.status not in allowed.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Nelze přejít ze stavu '{current_status}' na '{update.status}'"
        )

    update_data = {"status": update.status}
    if update.status in ("success", "failed"):
        update_data["finished_at"] = datetime.now(timezone.utc).isoformat()
    if update.error_message:
        update_data["error_message"] = update.error_message
    if update.records_processed is not None:
        update_data["records_processed"] = update.records_processed

    # Pokud fail → vytvořit alert
    if update.status == "failed":
        pipeline_id = current[0]["pipeline_id"]

        # Najdi aktivní alert pravidla pro tuto pipeline
        rules = supabase_get("alert_rules", {
            "pipeline_id": f"eq.{pipeline_id}",
            "enabled": "eq.true"
        })

        for rule in rules:
            supabase_post("alert_events", {
                "rule_id": rule["id"],
                "run_id": run_id,
                "message": f"Pipeline run failed: {update.error_message or 'Unknown error'}",
                "severity": "critical"
            })

    result = supabase_patch("job_runs", {"id": f"eq.{run_id}"}, update_data)
    return result[0]