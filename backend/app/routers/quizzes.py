import random
from datetime import datetime, date
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from app.database import get_db
from app.models import User, Question, QuizAttempt, Badge, UserBadge, Material
from app.schemas import QuestionOut, AnswerSubmit, AnswerResult
from app.auth import get_current_user

router = APIRouter()

XP_CORRECT     = 10
XP_WRONG       = 2
XP_PERFECT_BONUS = 30

BADGE_DEFS = [
    {"key": "first_answer",  "name": "First Step",    "icon": "🎯", "description": "Answer your first question"},
    {"key": "correct_10",    "name": "On a Roll",     "icon": "🔥", "description": "Get 10 correct answers"},
    {"key": "correct_50",    "name": "Scholar",       "icon": "📚", "description": "Get 50 correct answers"},
    {"key": "streak_3",      "name": "Consistent",    "icon": "📅", "description": "Study 3 days in a row"},
    {"key": "streak_7",      "name": "Dedicated",     "icon": "⚡", "description": "Study 7 days in a row"},
    {"key": "perfect_quiz",  "name": "Perfectionist", "icon": "💎", "description": "Answer 5 in a row correctly"},
    {"key": "attempts_100",  "name": "Exam Ready",    "icon": "🏆", "description": "Complete 100 quiz attempts"},
]


async def ensure_badges(db: AsyncSession):
    for b in BADGE_DEFS:
        result = await db.execute(select(Badge).where(Badge.key == b["key"]))
        if not result.scalar_one_or_none():
            db.add(Badge(**b))
    await db.commit()


async def check_and_award_badges(user, db, correct_total, attempt_total) -> list[str]:
    result = await db.execute(
        select(UserBadge, Badge).join(Badge).where(UserBadge.user_id == user.id)
    )
    earned_keys = {row.Badge.key for row in result.all()}
    conditions  = {
        "first_answer": attempt_total >= 1,
        "correct_10":   correct_total >= 10,
        "correct_50":   correct_total >= 50,
        "streak_3":     user.streak_days >= 3,
        "streak_7":     user.streak_days >= 7,
        "attempts_100": attempt_total >= 100,
    }
    new_badges = []
    for key, met in conditions.items():
        if met and key not in earned_keys:
            badge_res = await db.execute(select(Badge).where(Badge.key == key))
            badge = badge_res.scalar_one_or_none()
            if badge:
                db.add(UserBadge(user_id=user.id, badge_id=badge.id))
                new_badges.append(badge.name)
    await db.commit()
    return new_badges


def update_streak(user: User):
    today = date.today().isoformat()
    if user.last_active_date == today:
        return
    try:
        from datetime import date as dt
        prev = dt.fromisoformat(user.last_active_date) if user.last_active_date else None
        if prev and (date.today() - prev).days == 1:
            user.streak_days += 1
        else:
            user.streak_days = 1
    except Exception:
        user.streak_days = 1
    user.last_active_date = today


@router.get("/next", response_model=QuestionOut)
async def get_next_question(
    material_id: Optional[int] = None,
    seen_ids: List[int] = Query(default=[]),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ensure_badges(db)

    q_query = select(Question).where(Question.user_id == current_user.id)
    if material_id:
        q_query = q_query.where(Question.material_id == material_id)

    result    = await db.execute(q_query)
    questions = result.scalars().all()

    if not questions:
        raise HTTPException(status_code=404, detail="No questions found. Upload study materials first.")

    # Build attempt stats
    a_result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.user_id == current_user.id)
    )
    attempt_map: dict = defaultdict(lambda: {"total": 0, "correct": 0})
    for a in a_result.scalars().all():
        attempt_map[a.question_id]["total"]   += 1
        if a.is_correct:
            attempt_map[a.question_id]["correct"] += 1

    # Exclude questions the user has already answered CORRECTLY in this session
    # Wrong answers stay in the pool — they should be repeated
    correctly_answered = {qid for qid in seen_ids if attempt_map[qid]["correct"] > 0}
    pool = [q for q in questions if q.id not in correctly_answered]

    # If every question has been answered correctly — full reset, start over
    if not pool:
        pool = questions

    # Adaptive priority: unseen and wrong-answered questions first
    def priority(q):
        s = attempt_map[q.id]
        if s["total"] == 0:
            return 1000.0  # never seen — highest priority
        if s["correct"] == 0:
            return 500.0 + s["total"]  # answered but always wrong — high priority
        accuracy = s["correct"] / s["total"]
        return (1 - accuracy) * 100 - min(s["total"] * 2, 20)

    sorted_pool = sorted(pool, key=priority, reverse=True)
    candidates  = sorted_pool[:min(5, len(sorted_pool))]
    question    = random.choice(candidates)

    mat_res  = await db.execute(select(Material).where(Material.id == question.material_id))
    material = mat_res.scalar_one_or_none()

    return QuestionOut(
        id=question.id,
        question_text=question.question_text,
        options=question.options,
        topic=question.topic,
        material_title=material.title if material else None,
    )


@router.post("/answer", response_model=AnswerResult)
async def submit_answer(
    data: AnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q_res    = await db.execute(
        select(Question).where(Question.id == data.question_id, Question.user_id == current_user.id)
    )
    question = q_res.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = data.selected_answer == question.correct_answer
    db.add(QuizAttempt(
        user_id=current_user.id, question_id=question.id,
        selected_answer=data.selected_answer, is_correct=is_correct,
    ))

    update_streak(current_user)
    xp_gained        = XP_CORRECT if is_correct else XP_WRONG
    current_user.xp += xp_gained
    await db.flush()

    total_res   = await db.execute(select(func.count(QuizAttempt.id)).where(QuizAttempt.user_id == current_user.id))
    total_att   = total_res.scalar() or 0
    correct_res = await db.execute(select(func.count(QuizAttempt.id)).where(QuizAttempt.user_id == current_user.id, QuizAttempt.is_correct == True))
    correct_tot = correct_res.scalar() or 0

    recent_res = await db.execute(
        select(QuizAttempt).where(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.created_at.desc()).limit(5)
    )
    recent = recent_res.scalars().all()
    if len(recent) >= 5 and all(a.is_correct for a in recent):
        current_user.xp += XP_PERFECT_BONUS
        xp_gained       += XP_PERFECT_BONUS
        badge_res = await db.execute(select(Badge).where(Badge.key == "perfect_quiz"))
        badge = badge_res.scalar_one_or_none()
        if badge:
            exists = await db.execute(select(UserBadge).where(UserBadge.user_id == current_user.id, UserBadge.badge_id == badge.id))
            if not exists.scalar_one_or_none():
                db.add(UserBadge(user_id=current_user.id, badge_id=badge.id))

    await db.commit()
    await db.refresh(current_user)
    new_badges = await check_and_award_badges(current_user, db, correct_tot, total_att)

    return AnswerResult(
        is_correct=is_correct, correct_answer=question.correct_answer,
        explanation=question.explanation, xp_gained=xp_gained,
        new_total_xp=current_user.xp, new_badges=new_badges,
    )


@router.get("/badges")
async def get_badges(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await ensure_badges(db)
    all_res = await db.execute(select(Badge))
    all_badges = all_res.scalars().all()
    earned_res = await db.execute(select(UserBadge).where(UserBadge.user_id == current_user.id))
    earned_map = {ub.badge_id: ub.earned_at for ub in earned_res.scalars().all()}
    return [
        {"key": b.key, "name": b.name, "description": b.description, "icon": b.icon,
         "earned": b.id in earned_map, "earned_at": earned_map.get(b.id)}
        for b in all_badges
    ]