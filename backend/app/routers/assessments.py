from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request
)
from sqlalchemy.orm import Session
from app.auth.permissions import require_roles
from app.auth.session import get_current_user_role
from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentQuestionCreate,
    AssessmentOptionCreate
)
from app.schemas.assessment_attempt import (
    AssessmentStartRequest,
    AssessmentSubmitRequest
)
from app.services.assessment_service import (
    create_assessment,
    get_assessment_details,
    create_question,
    create_option,
    publish_assessment
)
from app.services.assessment_attempt_service import (
    start_assessment,
    submit_assessment
)
from app.services.assessment_result_service import (
    get_assessment_results
)
from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.training import Training

router = APIRouter(
    prefix="/api/assessments",
    tags=["Assessments"]
)


# ============================================================
# CREATE ASSESSMENT
# ADMIN + COORDINATOR
# ============================================================

@router.post("")
def create_assessment_api(
    data: AssessmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

        training = (
            db.query(Training)
            .filter(
                Training.n_training_id == data.n_training_id,
                Training.n_flag == 1,
                Training.delete_flag == 0
            )
            .first()
        )

        if not training:
            raise HTTPException(
                status_code=404,
                detail="Training not found"
            )

        role_name = get_current_user_role(
            request=request,
            db=db
        )

        if (
            role_name
            and role_name.strip().upper() == "COORDINATOR"
            and training.n_created_by != current_user.n_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to create an assessment for this training"
            )

        try:

            assessment = create_assessment(
                db=db,
                data=data,
                created_by=current_user.n_user_id
            )

            return {
                "status": "success",
                "message": (
                    "Assessment created successfully"
                ),
                "n_assessment_id":
                    assessment.n_assessment_id,
                "s_status":
                    assessment.s_status
            }

        except ValueError as exc:

            return {
                "status": "failed",
                "message": str(exc)
            }


# ============================================================
# GET ASSESSMENT
# ============================================================

@router.get("/{assessment_id}")
def get_assessment_api(
    assessment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

        assessment = (
            db.query(Assessment)
            .filter(
                Assessment.n_assessment_id == assessment_id,
                Assessment.n_flag == 1,
                Assessment.delete_flag == 0
            )
            .first()
        )

        if not assessment:
            raise HTTPException(
                status_code=404,
                detail="Assessment not found"
            )

        training = (
            db.query(Training)
            .filter(
                Training.n_training_id == assessment.n_training_id,
                Training.n_flag == 1,
                Training.delete_flag == 0
            )
            .first()
        )

        if not training:
            raise HTTPException(
                status_code=404,
                detail="Training not found"
            )

        role_name = get_current_user_role(
            request=request,
            db=db
        )

        if (
            role_name
            and role_name.strip().upper() == "COORDINATOR"
            and training.n_created_by != current_user.n_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this assessment"
            )

        try:

            return get_assessment_details(
                db=db,
                assessment_id=assessment_id
            )

        except ValueError as exc:

            return {
                "status": "failed",
                "message": str(exc)
            }


# ============================================================
# ADD QUESTION
# ADMIN + COORDINATOR
# ============================================================

@router.post(
    "/{assessment_id}/questions"
)
def create_question_api(
    assessment_id: int,
    data: AssessmentQuestionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):
        

        assessment = (
            db.query(Assessment)
            .filter(
                Assessment.n_assessment_id == assessment_id,
                Assessment.n_flag == 1,
                Assessment.delete_flag == 0
            )
            .first()
        )

        if not assessment:
            raise HTTPException(
                status_code=404,
                detail="Assessment not found"
            )

        training = (
            db.query(Training)
            .filter(
                Training.n_training_id == assessment.n_training_id,
                Training.n_flag == 1,
                Training.delete_flag == 0
            )
            .first()
        )

        if not training:
            raise HTTPException(
                status_code=404,
                detail="Training not found"
            )

        role_name = get_current_user_role(
            request=request,
            db=db
        )

        if (
            role_name
            and role_name.strip().upper() == "COORDINATOR"
            and training.n_created_by != current_user.n_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to add questions to this assessment"
            )

        try:

            question = create_question(
                db=db,
                assessment_id=assessment_id,
                data=data,
                created_by=current_user.n_user_id
            )

            return {
                "status": "success",
                "message": (
                    "Question created successfully"
                ),
                "n_question_id":
                    question.n_question_id
            }

        except ValueError as exc:

            return {
                "status": "failed",
                "message": str(exc)
            }


# ============================================================
# ADD OPTION
# ADMIN + COORDINATOR
# ============================================================

@router.post(
    "/questions/{question_id}/options"
)
def create_option_api(
    question_id: int,
    data: AssessmentOptionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

        question = (
            db.query(AssessmentQuestion)
            .filter(
                AssessmentQuestion.n_question_id == question_id,
                AssessmentQuestion.n_flag == 1,
                AssessmentQuestion.delete_flag == 0
            )
            .first()
        )

        if not question:
            raise HTTPException(
                status_code=404,
                detail="Question not found"
            )

        assessment = (
            db.query(Assessment)
            .filter(
                Assessment.n_assessment_id == question.n_assessment_id,
                Assessment.n_flag == 1,
                Assessment.delete_flag == 0
            )
            .first()
        )

        if not assessment:
            raise HTTPException(
                status_code=404,
                detail="Assessment not found"
            )

        training = (
            db.query(Training)
            .filter(
                Training.n_training_id == assessment.n_training_id,
                Training.n_flag == 1,
                Training.delete_flag == 0
            )
            .first()
        )

        if not training:
            raise HTTPException(
                status_code=404,
                detail="Training not found"
            )

        role_name = get_current_user_role(
            request=request,
            db=db
        )

        if (
            role_name
            and role_name.strip().upper() == "COORDINATOR"
            and training.n_created_by != current_user.n_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to add options to this question"
            )

        try:

            option = create_option(
                db=db,
                question_id=question_id,
                data=data,
                created_by=current_user.n_user_id
            )

            return {
                "status": "success",
                "message": (
                    "Option created successfully"
                ),
                "n_option_id":
                    option.n_option_id
            }

        except ValueError as exc:

            return {
                "status": "failed",
                "message": str(exc)
            }


# ============================================================
# PUBLISH ASSESSMENT
# ADMIN + COORDINATOR
# ============================================================

@router.post(
    "/{assessment_id}/publish"
)
def publish_assessment_api(
    assessment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

        assessment = (
            db.query(Assessment)
            .filter(
                Assessment.n_assessment_id == assessment_id,
                Assessment.n_flag == 1,
                Assessment.delete_flag == 0
            )
            .first()
        )

        if not assessment:
            raise HTTPException(
                status_code=404,
                detail="Assessment not found"
            )

        training = (
            db.query(Training)
            .filter(
                Training.n_training_id == assessment.n_training_id,
                Training.n_flag == 1,
                Training.delete_flag == 0
            )
            .first()
        )

        if not training:
            raise HTTPException(
                status_code=404,
                detail="Training not found"
            )

        role_name = get_current_user_role(
            request=request,
            db=db
        )

        if (
            role_name
            and role_name.strip().upper() == "COORDINATOR"
            and training.n_created_by != current_user.n_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to publish this assessment"
            )

        try:

            return publish_assessment(
                db=db,
                assessment_id=assessment_id,
                published_by=current_user.n_user_id
            )

        except ValueError as exc:

            return {
                "status": "failed",
                "message": str(exc)
            }

        except Exception as exc:

            db.rollback()

            return {
                "status": "failed",
                "message":
                    "Assessment publishing failed",
                "reason": str(exc)
            }


# ============================================================
# START ASSESSMENT
# EMPLOYEE
# ============================================================

@router.post(
    "/{assessment_id}/start"
)
def start_assessment_api(
    assessment_id: int,
    data: AssessmentStartRequest,
    db: Session = Depends(get_db)
):

    try:

        return start_assessment(
            db=db,
            assessment_id=assessment_id,
            registration_token=(
                data.registration_token
            )
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception as exc:

        db.rollback()

        print(
            "ASSESSMENT START ERROR:",
            repr(exc)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Assessment start failed: {str(exc)}"
        )

# ============================================================
# SUBMIT ASSESSMENT
# EMPLOYEE
# ============================================================

@router.post(
    "/{assessment_id}/submit"
)
def submit_assessment_api(
    assessment_id: int,
    data: AssessmentSubmitRequest,
    db: Session = Depends(get_db)
):

    try:

        return submit_assessment(
            db=db,
            assessment_id=assessment_id,
            data=data
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Assessment submission failed"
        )
    
# ==========================================================
# GET ALL ASSESSMENTS
# ADMIN + COORDINATOR
# ==========================================================

@router.get("")
def get_assessments_api(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

    assessment_query = (
        db.query(
            Assessment,
            Training
        )
        .join(
            Training,
            Assessment.n_training_id
            == Training.n_training_id
        )
        .filter(
            Assessment.n_flag == 1,
            Assessment.delete_flag == 0,
            Training.n_flag == 1,
            Training.delete_flag == 0
        )
    )

    role_name = get_current_user_role(
        request=request,
        db=db
    )

    if role_name and role_name.strip().upper() == "COORDINATOR":
        assessment_query = assessment_query.filter(
            Training.n_created_by == current_user.n_user_id
        )

    assessments = (
        assessment_query
        .order_by(
            Assessment.n_assessment_id.desc()
        )
        .all()
    )

    return {
        "status": "success",
        "count": len(assessments),
        "assessments": [
            {
                "n_assessment_id":
                    assessment.n_assessment_id,

                "n_training_id":
                    assessment.n_training_id,

                "s_training_name":
                    training.s_training_name,

                "s_assessment_name":
                    assessment.s_assessment_name,

                "s_description":
                    assessment.s_description,

                "n_total_marks":
                    float(
                        assessment.n_total_marks
                    ),

                "n_passing_score":
                    float(
                        assessment.n_passing_score
                    ),

                "n_duration_minutes":
                    assessment.n_duration_minutes,

                "n_maximum_attempts":
                    assessment.n_maximum_attempts,

                "s_status":
                    assessment.s_status,

                "n_created_by":
                    assessment.n_created_by,

                "dt_created_at":
                    assessment.dt_created_at,

                "n_published_by":
                    assessment.n_published_by,

                "dt_published_at":
                    assessment.dt_published_at,

                "n_updated_by":
                    assessment.n_updated_by,

                "dt_updated_at":
                    assessment.dt_updated_at
            }

            for assessment, training
            in assessments
        ]
    }

# ============================================================
# GET ASSESSMENT RESULTS
# ADMIN + COORDINATOR
# ============================================================

@router.get(
    "/{assessment_id}/results"
)
def get_assessment_results_api(
    assessment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

        assessment = (
            db.query(Assessment)
            .filter(
                Assessment.n_assessment_id == assessment_id,
                Assessment.n_flag == 1,
                Assessment.delete_flag == 0
            )
            .first()
        )

        if not assessment:
            raise HTTPException(
                status_code=404,
                detail="Assessment not found"
            )

        training = (
            db.query(Training)
            .filter(
                Training.n_training_id == assessment.n_training_id,
                Training.n_flag == 1,
                Training.delete_flag == 0
            )
            .first()
        )

        if not training:
            raise HTTPException(
                status_code=404,
                detail="Training not found"
            )

        role_name = get_current_user_role(
            request=request,
            db=db
        )

        if (
            role_name
            and role_name.strip().upper() == "COORDINATOR"
            and training.n_created_by != current_user.n_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access these assessment results"
            )

        try:

            return get_assessment_results(
                db=db,
                assessment_id=assessment_id
            )

        except ValueError as exc:

            raise HTTPException(
                status_code=404,
                detail=str(exc)
            )

        except Exception:

            raise HTTPException(
                status_code=500,
                detail="Unable to load assessment results"
            )

    