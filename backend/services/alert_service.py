"""
Business logika pro alerty a alert pravidla.
Obsahuje validaci a operace s alerty.
"""
from fastapi import HTTPException
from database import supabase_get, supabase_post


def validate_alert_rule_create(name: str, pipeline_id: str):
    """Validace při vytváření alert pravidla."""
    if not name.strip():
        raise HTTPException(status_code=400, detail="Název pravidla nesmí být prázdný")

    # Ověření, že pipeline existuje
    p = supabase_get("pipelines", {"id": f"eq.{pipeline_id}"})
    if not p:
        raise HTTPException(status_code=400, detail="Pipeline neexistuje")


def create_alert_rule(data: dict):
    """Vytvoření nového alert pravidla."""
    validate_alert_rule_create(data["name"], data["pipeline_id"])

    result = supabase_post("alert_rules", {
        "pipeline_id": data["pipeline_id"],
        "name": data["name"],
        "condition": data["condition"],
        "enabled": data.get("enabled", True)
    })

    return result[0]