from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.database import create_tables
from app.routers import auth_router, materials, quizzes, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="ExamAI – Personalized Exam Preparation Platform",
    version="1.0.0",
    description="Adaptive quiz platform with gamification and generative AI",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["Auth"])
app.include_router(materials.router, prefix="/api/materials", tags=["Materials"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])
app.include_router(stats.router, prefix="/api/stats", tags=["Stats"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "ExamAI API", "version": "1.0.0"}