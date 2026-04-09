from fastapi import APIRouter, HTTPException
from database import supabase_get

router = APIRouter()

# GET /alerts — seznam všech alertů
@router.get("/")
def list_alerts():
    result = supabase_get("alert_events", {
        "select": "*, alert_rules(name, pipelines(name)), job_runs(status)",
        "order": "created_at.desc"
    })
    return result

# GET /alerts/:id — detail alertu
@router.get("/{alert_id}")
def get_alert(alert_id: str):
    result = supabase_get("alert_events", {
        "id": f"eq.{alert_id}",
        "select": "*, alert_rules(name, pipelines(name)), job_runs(status)"
    })
    if not result:
        raise HTTPException(status_code=404, detail="Alert nenalezen")
    return result[0]