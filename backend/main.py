from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.datasets import router as datasets_router
from routes.pipelines import router as pipelines_router
from routes.runs import router as runs_router
from routes.alerts import router as alerts_router
from routes.alert_rules import router as alert_rules_router

app = FastAPI(title="Big Data Pipeline Monitor")

# Povolení CORS (aby frontend mohl volat backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets_router, prefix="/datasets", tags=["Datasets"])
app.include_router(pipelines_router, prefix="/pipelines", tags=["Pipelines"])
app.include_router(runs_router, prefix="/runs", tags=["Runs"])
app.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
app.include_router(alert_rules_router, prefix="/alert-rules", tags=["Alert Rules"])

@app.get("/")
def root():
    return {"message": "Big Data Pipeline Monitor API is running"}