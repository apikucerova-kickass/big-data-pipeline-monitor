"""
Business logika pro pipeline.
Obsahuje pravidla a operace oddělené od HTTP vrstvy.
"""
from fastapi import HTTPException
from datetime import datetime, timezone
from database import supabase_get, supabase_post


def validate_pipeline_create(name: str, dataset_id: str):
    """Validace při vytváření pipeline."""
    if not name.strip():
        raise HTTPException(status_code=400, detail="Název pipeline nesmí být prázdný")

    # Ověření, že dataset existuje
    ds = supabase_get("datasets", {"id": f"eq.{dataset_id}"})
    if not ds:
        raise HTTPException(status_code=400, detail="Dataset neexistuje")


def create_pipeline(data: dict):
    """Vytvoření nové pipeline."""
    validate_pipeline_create(data["name"], data["dataset_id"])

    result = supabase_post("pipelines", {
        "dataset_id": data["dataset_id"],
        "name": data["name"],
        "description": data.get("description"),
        "schedule": data.get("schedule"),
        "active": data.get("active", True)
    })

    # Automaticky vytvořit alert pravidlo pro novou pipeline
    pipeline_id = result[0]["id"]
    supabase_post("alert_rules", {
        "pipeline_id": pipeline_id,
        "name": f"Fail alert pro {data['name']}",
        "condition": "status == failed",
        "enabled": True
    })

    return result[0]


def run_pipeline(pipeline_id: str):
    """
    Spuštění pipeline.
    Doménová pravidla:
    - Pipeline musí existovat
    - Pipeline musí být aktivní
    - Vytvoří se nový JobRun se stavem 'running'
    - Vytvoří se kroky: extract, transform, load
    """
    # 1. Načíst pipeline
    p = supabase_get("pipelines", {"id": f"eq.{pipeline_id}"})
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline nenalezena")

    pipeline = p[0]

    # 2. Ověřit, že je aktivní
    if not pipeline["active"]:
        raise HTTPException(status_code=400, detail="Pipeline není aktivní, nelze spustit")

    # 3. Vytvořit nový JobRun
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