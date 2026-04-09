from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase_get, supabase_post

router = APIRouter()

# Schéma pro vytvoření datasetu
class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner: str

# POST /datasets — vytvoření nového datasetu
@router.post("/")
def create_dataset(dataset: DatasetCreate):
    if not dataset.name.strip():
        raise HTTPException(status_code=400, detail="Název datasetu nesmí být prázdný")
    if not dataset.owner.strip():
        raise HTTPException(status_code=400, detail="Owner nesmí být prázdný")

    result = supabase_post("datasets", {
        "name": dataset.name,
        "description": dataset.description,
        "owner": dataset.owner
    })

    return result[0]

# GET /datasets — seznam všech datasetů
@router.get("/")
def list_datasets():
    result = supabase_get("datasets", {"order": "created_at.desc"})
    return result

# GET /datasets/:id — detail jednoho datasetu
@router.get("/{dataset_id}")
def get_dataset(dataset_id: str):
    result = supabase_get("datasets", {"id": f"eq.{dataset_id}"})
    if not result:
        raise HTTPException(status_code=404, detail="Dataset nenalezen")
    return result[0]