"""
Business logika pro běhy pipeline.
Obsahuje stavové přechody a automatické vytváření alertů.
"""
from fastapi import HTTPException
from datetime import datetime, timezone
from database import supabase_get, supabase_post, supabase_patch


# Doménové pravidlo: povolené přechody stavů
ALLOWED_TRANSITIONS = {
    "pending": ["running"],
    "running": ["success", "failed"],
}


def validate_status_transition(current_status: str, new_status: str):
    """Ověří, že přechod mezi stavy je povolený."""
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Nelze přejít ze stavu '{current_status}' na '{new_status}'"
        )


def update_run(run_id: str, status: str, error_message: str = None, records_processed: int = None):
    """
    Aktualizace běhu pipeline.
    Doménová pravidla:
    - Validace stavových přechodů (pending→running→success/failed)
    - Při dokončení se nastaví finished_at
    - Při failu se automaticky vytvoří alert
    """
    # Načíst aktuální stav
    current = supabase_get("job_runs", {"id": f"eq.{run_id}"})
    if not current:
        raise HTTPException(status_code=404, detail="Run nenalezen")

    current_status = current[0]["status"]

    # Validace přechodu
    validate_status_transition(current_status, status)

    # Sestavit data pro aktualizaci
    update_data = {"status": status}
    if status in ("success", "failed"):
        update_data["finished_at"] = datetime.now(timezone.utc).isoformat()
    if error_message:
        update_data["error_message"] = error_message
    if records_processed is not None:
        update_data["records_processed"] = records_processed

    # Při failu → vytvořit alert
    if status == "failed":
        create_failure_alert(run_id, current[0]["pipeline_id"], error_message)

    result = supabase_patch("job_runs", {"id": f"eq.{run_id}"}, update_data)
    return result[0]


def create_failure_alert(run_id: str, pipeline_id: str, error_message: str = None):
    """
    Automatické vytvoření alertu při selhání běhu.
    Najde všechna aktivní alert pravidla pro pipeline a vytvoří alert události.
    """
    rules = supabase_get("alert_rules", {
        "pipeline_id": f"eq.{pipeline_id}",
        "enabled": "eq.true"
    })

    for rule in rules:
        supabase_post("alert_events", {
            "rule_id": rule["id"],
            "run_id": run_id,
            "message": f"Pipeline run failed: {error_message or 'Unknown error'}",
            "severity": "critical"
        })