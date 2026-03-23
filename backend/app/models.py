from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    email            = Column(String, unique=True, index=True, nullable=False)
    name             = Column(String, nullable=False)
    password_hash    = Column(String, nullable=False)
    is_verified      = Column(Boolean, default=False)
    otp_code         = Column(String, nullable=True)
    otp_expires_at   = Column(DateTime, nullable=True)
    xp               = Column(Integer, default=0)
    streak_days      = Column(Integer, default=0)
    last_active_date = Column(String, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)

    materials   = relationship("Material",    back_populates="user", cascade="all, delete")
    attempts    = relationship("QuizAttempt", back_populates="user", cascade="all, delete")
    user_badges = relationship("UserBadge",   back_populates="user", cascade="all, delete")


class Material(Base):
    __tablename__ = "materials"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    title          = Column(String, nullable=False)
    content        = Column(Text, nullable=False)
    question_count = Column(Integer, default=0)
    created_at     = Column(DateTime, default=datetime.utcnow)

    user      = relationship("User",     back_populates="materials")
    questions = relationship("Question", back_populates="material", cascade="all, delete")


class Question(Base):
    __tablename__ = "questions"

    id             = Column(Integer, primary_key=True, index=True)
    material_id    = Column(Integer, ForeignKey("materials.id"), nullable=False)
    user_id        = Column(Integer, ForeignKey("users.id"),     nullable=False)
    question_text  = Column(Text,    nullable=False)
    options        = Column(JSON,    nullable=False)
    correct_answer = Column(Integer, nullable=False)
    explanation    = Column(Text,    nullable=False)
    topic          = Column(String,  nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow)

    material = relationship("Material",    back_populates="questions")
    attempts = relationship("QuizAttempt", back_populates="question", cascade="all, delete")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"),     nullable=False)
    question_id     = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_answer = Column(Integer, nullable=False)
    is_correct      = Column(Boolean, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    user     = relationship("User",     back_populates="attempts")
    question = relationship("Question", back_populates="attempts")


class Badge(Base):
    __tablename__ = "badges"

    id          = Column(Integer, primary_key=True, index=True)
    key         = Column(String, unique=True, nullable=False)
    name        = Column(String, nullable=False)
    description = Column(String, nullable=False)
    icon        = Column(String, nullable=False)

    user_badges = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id"),  nullable=False)
    badge_id  = Column(Integer, ForeignKey("badges.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    user  = relationship("User",  back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")