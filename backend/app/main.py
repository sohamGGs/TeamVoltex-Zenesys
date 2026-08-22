import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
from app.routers import auth, purchase_requests, vendors, approvals, dashboard

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ProcureIQ - Intelligent NetSuite-Aligned ERP Procurement",
    description="Streamlining procurement from Purchase Request to Purchase Order with automated RFQ bidding, dynamic multi-rule approvals, Gemini 2.5 Flash AI auditing, and 3-Way Match tracking.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure generated_pos folder exists
GENERATED_POS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated_pos")
os.makedirs(GENERATED_POS_DIR, exist_ok=True)

# Mount Routers
app.include_router(auth.router, prefix="/api")
app.include_router(purchase_requests.router, prefix="/api")
app.include_router(vendors.router, prefix="/api")
app.include_router(approvals.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/")
def root():
    return {
        "system": "ProcureIQ Enterprise ERP",
        "status": "Online",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "sqlite:///procureiq.db",
        "engine": "FastAPI + SQLAlchemy + Gemini 2.5 Flash"
    }
