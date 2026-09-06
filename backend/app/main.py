from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config.settings import settings

from app.routers.auth import router as auth_router
from app.routers.system import router as system_router
from app.routers.users import router as users_router
from app.routers.audit_logs import router as audit_logs_router
from app.routers.roles import router as roles_router
from app.routers.trainings import router as trainings_router
from app.routers.emails import router as emails_router
from app.routers.registration import router as registration_router
from app.routers.attendance import router as attendance_router
from app.routers.assessments import router as assessment_router
from app.routers.email_logs import router as email_logs_router
from app.routers.dashboard import router as dashboard_router
from app.routers.analytics import router as analytics_router


app = FastAPI(
    title="Training Portal API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://10.11.48.39:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SESSION
# ============================================================

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
    session_cookie="training_portal_session",
    max_age=60 * 60 * 8,
    path="/",
    same_site="lax",
    https_only=False,
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(system_router)
app.include_router(users_router)
app.include_router(audit_logs_router)
app.include_router(roles_router)
app.include_router(trainings_router)
app.include_router(emails_router)
app.include_router(registration_router)
app.include_router(attendance_router)
app.include_router(assessment_router)
app.include_router(email_logs_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)

# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "success",
        "message": "Training Portal API is running"
    }