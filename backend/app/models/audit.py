from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, Text, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class NotificationType(str, Enum):
    APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER"
    PRESCRIPTION_READY = "PRESCRIPTION_READY"
    LOW_STOCK_ALERT = "LOW_STOCK_ALERT"
    SYSTEM_ALERT = "SYSTEM_ALERT"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(SQLEnum(NotificationType), default=NotificationType.SYSTEM_ALERT, index=True, nullable=False)
    is_read = Column(Boolean, default=False, index=True, nullable=False)
    channel = Column(String(20), default="IN_APP", nullable=False)  # IN_APP, SMS
    language = Column(String(10), default="pa", nullable=False)  # Preferred language
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    
    action = Column(String(100), index=True, nullable=False)  # e.g., "VIEW_MEDICAL_RECORD", "UPDATE_PRESCRIPTION"
    resource_type = Column(String(50), index=True, nullable=False)  # e.g., "Patient", "MedicalRecord", "Auth"
    resource_id = Column(String(50), index=True, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    status = Column(String(20), default="SUCCESS", nullable=False)  # SUCCESS, DENIED, ERROR
    details = Column(Text, nullable=True)  # JSON or text description of operation
    
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

