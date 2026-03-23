import io
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models import Material, Question, User
from app.schemas import MaterialCreate, MaterialOut
from app.auth import get_current_user
from app.services.ai_service import generate_questions, ocr_image_bytes

router = APIRouter()

IMAGE_TYPES = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}


def extract_text_from_pdf(data: bytes) -> tuple[str, list[bytes]]:
    """Returns (text_content, list_of_page_images_for_ocr)."""
    try:
        import fitz  # PyMuPDF
        doc  = fitz.open(stream=data, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)

        # collect page images for pages with little or no extractable text
        image_pages: list[bytes] = []
        for page in doc:
            if len(page.get_text().strip()) < 30:
                pix = page.get_pixmap(dpi=150)
                image_pages.append(pix.tobytes("jpeg"))

        return text, image_pages
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")


def extract_text_from_docx(data: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read DOCX: {e}")


async def _save_material(
    db: AsyncSession, user: User, title: str, content: str, num_questions: int
) -> Material:
    if len(content.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Could not extract enough text from the file. Try a different file.",
        )
    num_q = max(3, min(num_questions, 15))
    raw_questions = await generate_questions(content, title, num_q)
    if not raw_questions:
        raise HTTPException(status_code=502, detail="AI failed to generate questions. Check your Groq API key.")

    material = Material(user_id=user.id, title=title, content=content, question_count=len(raw_questions))
    db.add(material)
    await db.flush()
    for q in raw_questions:
        db.add(Question(
            material_id=material.id, user_id=user.id,
            question_text=q["question"], options=q["options"],
            correct_answer=q["correct_answer"], explanation=q["explanation"], topic=q["topic"],
        ))
    await db.commit()
    await db.refresh(material)
    return material


@router.post("/", response_model=MaterialOut)
async def create_material(
    data: MaterialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _save_material(db, current_user, data.title, data.content, data.num_questions)


@router.post("/upload", response_model=MaterialOut)
async def upload_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    num_questions: int = Form(8),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filename = file.filename or "upload"
    ext = filename.rsplit(".", 1)[-1].lower()
    allowed = {"pdf", "docx", "txt"} | set(IMAGE_TYPES.keys())

    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported file. Accepted: PDF, DOCX, TXT, JPG, PNG, WEBP.")

    raw = await file.read()
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20 MB).")

    mat_title = title or filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
    content   = ""

    if ext == "pdf":
        text, image_pages = extract_text_from_pdf(raw)
        content = text.strip()
        # OCR image-only pages and append
        if image_pages:
            ocr_parts = []
            for img_bytes in image_pages[:8]:  # limit to 8 pages
                try:
                    ocr_text = await ocr_image_bytes(img_bytes, "image/jpeg")
                    if ocr_text:
                        ocr_parts.append(ocr_text)
                except Exception:
                    pass
            if ocr_parts:
                content = (content + "\n\n" + "\n\n".join(ocr_parts)).strip()

    elif ext == "docx":
        content = extract_text_from_docx(raw)

    elif ext == "txt":
        content = raw.decode("utf-8", errors="ignore")

    else:
        # Direct image upload — full OCR
        mime = IMAGE_TYPES[ext]
        content = await ocr_image_bytes(raw, mime)

    return await _save_material(db, current_user, mat_title, content, num_questions)


@router.get("/", response_model=List[MaterialOut])
async def list_materials(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Material).where(Material.user_id == current_user.id).order_by(Material.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{material_id}")
async def delete_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Material).where(Material.id == material_id, Material.user_id == current_user.id)
    )
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    await db.delete(material)
    await db.commit()
    return {"message": "Deleted"}