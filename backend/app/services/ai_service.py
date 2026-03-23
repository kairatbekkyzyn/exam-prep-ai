import json
import os
import base64
from groq import AsyncGroq

client = AsyncGroq(api_key=os.getenv("OPENAI_API_KEY"))
TEXT_MODEL   = "llama-3.3-70b-versatile"
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


async def ocr_image_bytes(image_bytes: bytes, mime: str = "image/jpeg") -> str:
    """Extract all text from an image using Groq vision model."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    response = await client.chat.completions.create(
        model=VISION_MODEL,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": { "url": f"data:{mime};base64,{b64}" }
                },
                {
                    "type": "text",
                    "text": (
                        "Extract ALL text from this image exactly as it appears. "
                        "Include every word, number, formula, and label. "
                        "Preserve the logical reading order. "
                        "Output only the extracted text, nothing else."
                    )
                }
            ]
        }],
        max_tokens=2000,
    )
    return response.choices[0].message.content.strip()


async def generate_questions(content: str, title: str, num_questions: int = 8) -> list[dict]:
    prompt = f"""You are an expert exam question creator for university-level exams.
Generate exactly {num_questions} multiple-choice questions from the study material below.

Material Title: {title}
Material Content:
{content[:6000]}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{{
  "questions": [
    {{
      "question": "Clear, specific question text ending with ?",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correct_answer": 0,
      "explanation": "Concise explanation of why this answer is correct (1-2 sentences)",
      "topic": "Specific subtopic or concept being tested (2-4 words)"
    }}
  ]
}}

Rules:
- Questions must test UNDERSTANDING, not just keyword memorization
- Each question must have EXACTLY 4 distinct options
- correct_answer is the INTEGER index (0, 1, 2, or 3) of the correct option
- Topics should be concise, specific subtopics (e.g. "Gradient Descent", "OSI Model Layer 3")
- Vary difficulty: 30% easy, 50% medium, 20% hard
- Make wrong options plausible (not obviously incorrect)"""

    response = await client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=4000,
    )

    try:
        data = json.loads(response.choices[0].message.content)
        questions = data.get("questions", [])
        valid = []
        for q in questions:
            if (
                isinstance(q.get("question"), str)
                and isinstance(q.get("options"), list)
                and len(q["options"]) == 4
                and isinstance(q.get("correct_answer"), int)
                and 0 <= q["correct_answer"] <= 3
                and isinstance(q.get("explanation"), str)
                and isinstance(q.get("topic"), str)
            ):
                valid.append(q)
        return valid
    except (json.JSONDecodeError, KeyError):
        return []


async def get_ai_recommendation(weak_topics: list[dict]) -> str:
    if not weak_topics:
        return "Great start! Upload study materials and take quizzes to get personalized recommendations."

    very_weak     = [t for t in weak_topics if t["accuracy"] < 0.5]
    somewhat_weak = [t for t in weak_topics if 0.5 <= t["accuracy"] < 0.7]

    if not very_weak and not somewhat_weak:
        return (
            "Excellent performance across all topics! "
            "You're scoring above 70% everywhere. "
            "Keep practicing to solidify your knowledge before the exam."
        )

    focus_topics = very_weak[:2] + somewhat_weak[:1]
    prompt = f"""A student is preparing for an exam. Their weakest topics are: {', '.join([f'"{t["topic"]}"' for t in focus_topics])}.
Accuracy: {', '.join([f'{t["topic"]}: {int(t["accuracy"]*100)}%' for t in focus_topics])}.

Write 2-3 sentences of specific, actionable, encouraging study advice.
Be direct and practical. No bullet points. No headers. Plain text only."""

    response = await client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.6,
    )
    return response.choices[0].message.content.strip()