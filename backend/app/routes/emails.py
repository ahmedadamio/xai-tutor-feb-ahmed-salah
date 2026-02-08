from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.database import get_db
from app.schemas.email import EmailCreate, EmailResponse, EmailUpdate
from app.services import email_service

router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("", response_model=list[EmailResponse])
def list_emails(
    filter: Literal["all", "unread", "archived"] = Query(default="all"),
    search: str | None = Query(default=None),
):
    try:
        with get_db() as conn:
            return email_service.list_emails(conn, filter, search)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@router.get("/{email_id}", response_model=EmailResponse)
def get_email(email_id: int):
    try:
        with get_db() as conn:
            email = email_service.get_email(conn, email_id)
            if email is None:
                raise HTTPException(status_code=404, detail="Email not found")
            return email
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@router.post("", response_model=EmailResponse, status_code=201)
def create_email(payload: EmailCreate):
    try:
        with get_db() as conn:
            return email_service.create_email(conn, payload)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@router.put("/{email_id}", response_model=EmailResponse)
def update_email(email_id: int, payload: EmailUpdate):
    try:
        with get_db() as conn:
            existing = email_service.get_email(conn, email_id)
            if existing is None:
                raise HTTPException(status_code=404, detail="Email not found")

            updated = email_service.update_email(conn, email_id, payload)
            if updated is None:
                raise HTTPException(status_code=404, detail="Email not found")
            return updated
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@router.delete("/{email_id}", status_code=204)
def delete_email(email_id: int):
    try:
        with get_db() as conn:
            deleted = email_service.delete_email(conn, email_id)
            if not deleted:
                raise HTTPException(status_code=404, detail="Email not found")
            return None
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
