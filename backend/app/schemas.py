from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserRegister(BaseModel):
    email: str
    name: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class OTPVerify(BaseModel):
    email: str
    code: str


class OTPResend(BaseModel):
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    xp: int
    streak_days: int
    is_verified: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class MaterialCreate(BaseModel):
    title: str
    content: str
    num_questions: int = 8


class MaterialOut(BaseModel):
    id: int
    title: str
    content: str
    question_count: int
    created_at: datetime
    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    id: int
    question_text: str
    options: List[str]
    topic: str
    material_title: Optional[str] = None
    model_config = {"from_attributes": True}


class AnswerSubmit(BaseModel):
    question_id: int
    selected_answer: int


class AnswerResult(BaseModel):
    is_correct: bool
    correct_answer: int
    explanation: str
    xp_gained: int
    new_total_xp: int
    new_badges: List[str] = []


class TopicStat(BaseModel):
    topic: str
    total: int
    correct: int
    accuracy: float


class UserStats(BaseModel):
    total_attempts: int
    correct_attempts: int
    overall_accuracy: float
    xp: int
    streak_days: int
    topics: List[TopicStat]
    ai_recommendation: str