from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase_get, supabase_post

router = APIRouter()

class AlertRuleCreate(BaseModel):
    pipeline_id: str
    name: str
    condition: str
    enabled: bool = True

# POST /alert-rules — vytvoření nového pravidla
@router.post("/")
def create_alert_rule(rule: AlertRuleCreate):
    if not rule.name.strip():
        raise HTTPException(status_code=400, detail="Název pravidla nesmí být prázdný")

    # Ověření, že pipeline existuje
    p = supabase_get("pipelines", {"id": f"eq.{rule.pipeline_id}"})
    if not p:
        raise HTTPException(status_code=400, detail="Pipeline neexistuje")

    result = supabase_post("alert_rules", {
        "pipeline_id": rule.pipeline_id,
        "name": rule.name,
        "condition": rule.condition,
        "enabled": rule.enabled
    })

    return result[0]

# GET /alert-rules — seznam všech pravidel
@router.get("/")
def list_alert_rules():
    result = supabase_get("alert_rules", {
        "select": "*, pipelines(name)"
    })
    return result

# GET /alert-rules/:id — detail pravidla
@router.get("/{rule_id}")
def get_alert_rule(rule_id: str):
    result = supabase_get("alert_rules", {
        "id": f"eq.{rule_id}",
        "select": "*, pipelines(name)"
    })
    if not result:
        raise HTTPException(status_code=404, detail="Alert rule nenalezen")
    return result[0]