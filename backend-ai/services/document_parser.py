"""
ILA AI Feedback Service - Document Parser

Extract text from PDF and DOCX files, with token counting and truncation.
"""

import io
import httpx
from typing import Optional
from PyPDF2 import PdfReader
from docx import Document
import tiktoken

from config import get_settings


class DocumentParser:
    """Parse and extract text from various document formats"""
    
    def __init__(self):
        self.settings = get_settings()
        self.encoding = tiktoken.encoding_for_model(self.settings.openai_model)
    
    def count_tokens(self, text: str) -> int:
        """
        Count the number of tokens in text.
        
        Args:
            text: Text to count tokens for
            
        Returns:
            Number of tokens
        """
        return len(self.encoding.encode(text))
    
    def truncate_to_token_limit(self, text: str, max_tokens: int) -> tuple[str, bool]:
        """
        Truncate text to fit within token limit.
        
        Args:
            text: Text to truncate
            max_tokens: Maximum number of tokens allowed
            
        Returns:
            Tuple of (truncated_text, was_truncated)
        """
        tokens = self.encoding.encode(text)
        if len(tokens) <= max_tokens:
            return text, False
        
        # Truncate and decode
        truncated_tokens = tokens[:max_tokens]
        truncated_text = self.encoding.decode(truncated_tokens)
        return truncated_text, True
    
    async def extract_text_from_pdf(self, file_content: bytes) -> str:
        """
        Extract text from PDF file.
        
        Args:
            file_content: PDF file content as bytes
            
        Returns:
            Extracted text
            
        Raises:
            ValueError: If PDF parsing fails
        """
        try:
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            
            text_parts = []
            for page_num, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"--- Page {page_num} ---\n{page_text}")
            
            if not text_parts:
                raise ValueError("No text could be extracted from PDF")
            
            return "\n\n".join(text_parts)
        
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")
    
    async def extract_text_from_docx(self, file_content: bytes) -> str:
        """
        Extract text from DOCX file.
        
        Args:
            file_content: DOCX file content as bytes
            
        Returns:
            Extracted text
            
        Raises:
            ValueError: If DOCX parsing fails
        """
        try:
            docx_file = io.BytesIO(file_content)
            document = Document(docx_file)
            
            text_parts = []
            for paragraph in document.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)
            
            # Also extract text from tables
            for table in document.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            text_parts.append(cell.text)
            
            if not text_parts:
                raise ValueError("No text could be extracted from DOCX")
            
            return "\n\n".join(text_parts)
        
        except Exception as e:
            raise ValueError(f"Failed to extract text from DOCX: {str(e)}")
    
    async def download_file(self, url: str) -> bytes:
        """
        Download file from URL.
        
        Args:
            url: File URL
            
        Returns:
            File content as bytes
            
        Raises:
            ValueError: If download fails
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.content
        except Exception as e:
            raise ValueError(f"Failed to download file from {url}: {str(e)}")
    
    async def extract_text_from_url(self, url: str) -> str:
        """
        Download and extract text from file URL.
        
        Args:
            url: File URL (must be .pdf or .docx)
            
        Returns:
            Extracted text
            
        Raises:
            ValueError: If file format is unsupported or extraction fails
        """
        url_lower = url.lower()
        
        # Download file
        file_content = await self.download_file(url)
        
        # Extract based on file extension
        if url_lower.endswith('.pdf'):
            return await self.extract_text_from_pdf(file_content)
        elif url_lower.endswith('.docx'):
            return await self.extract_text_from_docx(file_content)
        else:
            raise ValueError(f"Unsupported file format. Only .pdf and .docx are supported. Got: {url}")
    
    async def parse_submission(
        self, 
        essay_text: str, 
        file_urls: Optional[list[str]] = None
    ) -> tuple[str, int, bool]:
        """
        Parse complete submission: essay text + files.
        
        Args:
            essay_text: Main essay text
            file_urls: Optional list of file URLs to extract text from
            
        Returns:
            Tuple of (combined_text, token_count, was_truncated)
        """
        # Start with essay text
        text_parts = [essay_text]
        
        # Extract text from files
        if file_urls:
            for i, url in enumerate(file_urls, start=1):
                try:
                    file_text = await self.extract_text_from_url(url)
                    text_parts.append(f"\n\n--- Attached File {i} ({url.split('/')[-1]}) ---\n{file_text}")
                except Exception as e:
                    # Log error but continue processing
                    text_parts.append(f"\n\n--- Attached File {i} (Error) ---\nFailed to extract: {str(e)}")
        
        # Combine all text
        combined_text = "\n".join(text_parts)
        
        # Count tokens
        token_count = self.count_tokens(combined_text)
        
        # Truncate if needed
        was_truncated = False
        if token_count > self.settings.max_input_tokens:
            combined_text, was_truncated = self.truncate_to_token_limit(
                combined_text, 
                self.settings.max_input_tokens
            )
            token_count = self.settings.max_input_tokens
        
        return combined_text, token_count, was_truncated
