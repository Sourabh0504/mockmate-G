"""
utils/file_parser.py — Extract raw text from PDF and DOCX files.

Only PDF and DOCX formats are supported. All others raise ValueError.
Text extraction is purely for passing to Gemini — no AI logic here.
"""

import io
from fastapi import UploadFile, HTTPException, status


ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

ALLOWED_EXTENSIONS = {".pdf", ".docx"}


def validate_resume_file(filename: str, content_type: str) -> str:
    """
    Validate that the uploaded file is PDF or DOCX.
    Returns the file type string ('pdf' or 'docx').
    Raises HTTPException 400 if invalid.
    """
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format. Only PDF and DOCX files are accepted. Got: '{ext or 'unknown'}'",
        )
    return ext.lstrip(".")


async def extract_text_from_file(file: UploadFile) -> str:
    """
    Extract raw text from an uploaded PDF or DOCX file.
    Returns plain text string for Gemini to parse.
    """
    file_type = validate_resume_file(file.filename, file.content_type)
    contents = await file.read()

    if file_type == "pdf":
        return _extract_from_pdf(contents)
    elif file_type == "docx":
        return _extract_from_docx(contents)


def _extract_from_pdf(contents: bytes) -> str:
    """Extract text from PDF bytes using pypdf."""
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(contents))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to read PDF file. Ensure it is not corrupted or password-protected. Error: {str(e)}",
        )


def _extract_from_docx(contents: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    try:
        from docx import Document
        document = Document(io.BytesIO(contents))
        text = "\n".join([para.text for para in document.paragraphs])
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to read DOCX file. Ensure it is not corrupted. Error: {str(e)}",
        )
