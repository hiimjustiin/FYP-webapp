# ILA AI Feedback Service

Python-based FastAPI microservice for AI-powered evaluation of student project submissions using Pydantic AI and OpenAI GPT-4o.

## Features

- **9-Dimension Rubric Evaluation**: Automated scoring against interdisciplinary learning assessment criteria
- **Structured AI Outputs**: Pydantic AI ensures consistent, validated feedback
- **Async Processing**: Non-blocking evaluation with background task processing
- **Smart Caching**: Content-based caching to reduce API costs
- **Token Management**: Automatic truncation at 10K tokens
- **Instructor Overrides**: Instructors can adjust AI scores with comments
- **Cost Tracking**: Track tokens used and estimated costs per submission

## Architecture

```
┌─────────────────┐
│  Express.js     │
│  Backend        │ ──HTTP──┐
└─────────────────┘         │
                            ▼
                   ┌─────────────────┐
                   │  FastAPI        │
                   │  AI Service     │
                   └─────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Pydantic   │    │  PostgreSQL │    │  OpenAI     │
│  AI Agent   │    │  Database   │    │  GPT-4o API │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Run Locally

```bash
# Development mode with hot reload
uvicorn main:app --reload --port 8000

# Or use Python directly
python main.py
```

### 4. Run with Docker

```bash
docker build -t ila-ai-service .
docker run -p 8000:8000 --env-file .env ila-ai-service
```

## API Endpoints

### POST `/api/evaluate`

Trigger AI evaluation for a submission (async).

**Request:**
```json
{
  "submission_id": "uuid",
  "project_id": "uuid",
  "course_id": "uuid",
  "user_id": "uuid",
  "essay_text": "Student essay content...",
  "file_urls": ["https://example.com/file.pdf"],
  "reanalyze": false
}
```

**Response:**
```json
{
  "success": true,
  "submission_id": "uuid",
  "status": "processing",
  "message": "Submission queued for AI evaluation. This may take 30-60 seconds."
}
```

### GET `/api/feedback/{submission_id}`

Get AI feedback results.

**Response:**
```json
{
  "success": true,
  "submission_id": "uuid",
  "processing_status": "completed",
  "dimension_scores": [
    {
      "dimension_id": 1,
      "ai_score": 2,
      "ai_reasoning": "Clear purpose stated...",
      "ai_strengths": ["Well-defined problem"],
      "ai_improvements": ["Add more context"],
      "ai_examples": "Quote from submission..."
    }
  ],
  "overall_feedback": {
    "ai_overall_summary": "Strong start...",
    "ai_overall_strengths": ["Clear writing", "Good sources"],
    "ai_priority_improvements": ["More integration", "Add limitations", "Broader impacts"],
    "ai_estimated_level": "Intermediate"
  }
}
```

### POST `/api/reanalyze/{submission_id}`

Re-trigger AI analysis (bypasses cache).

### POST `/api/override`

Instructor override for a dimension score.

**Request:**
```json
{
  "submission_id": "uuid",
  "dimension_id": 1,
  "override_score": 3,
  "comment": "Excellent integration shown",
  "instructor_id": "uuid"
}
```

### GET `/health`

Health check endpoint.

## Rubric Dimensions

1. **Frame the problem** - Integrative approach with purpose and rationale
2. **Stakeholder consideration** - Number of stakeholders (count-based)
3. **Range of disciplinary perspectives** - Number of disciplines (count-based)
4. **Disciplinary reasoning** - Explanation quality for insights
5. **Credibility of knowledge** - Source reliability assessment
6. **Number of integrations** - Evidence of building knowledge (count-based)
7. **Depth of integration** - How insights connect vs just listing
8. **Social impact** - Local + broader society + who is affected
9. **Limitations** - Identification + resolutions provided

## Scoring Scale

- **Level 1 (Naïve/Novice)**: Poorly made, missing critical elements
- **Level 2 (Intermediate)**: Partially addressed, developing understanding
- **Level 3 (Mastery)**: Well structured, meets all expectations

## Document Parsing

Supports:
- **PDF**: Extracts text from all pages
- **DOCX**: Extracts text from paragraphs and tables
- **Token Limit**: Automatic truncation at 10,000 tokens
- **Error Handling**: Graceful fallback if file parsing fails

## Caching Strategy

- **Content Hash**: SHA-256 of `essay_text + sorted(file_urls)`
- **Cache Check**: Before calling AI API
- **Cache Copy**: Duplicate results for identical submissions
- **Cache TTL**: 24 hours (configurable)

## Cost Optimization

- **Token Limit**: Max 10K input tokens per submission
- **GPT-4o Pricing**: $0.0025/1K input, $0.01/1K output
- **Estimated Cost**: ~$0.01-0.03 per submission
- **Caching**: Eliminates costs for duplicate submissions
- **Tracking**: All costs logged to database

## Development

### Project Structure

```
backend-ai/
├── main.py                 # FastAPI application
├── config.py               # Settings and rubric criteria
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container config
├── models/
│   └── evaluation.py       # Pydantic models
├── agents/
│   └── project_evaluator.py  # Pydantic AI agent
├── services/
│   ├── document_parser.py  # PDF/DOCX extraction
│   └── database.py         # PostgreSQL operations
└── utils/
```

### Running Tests

```bash
# Install dev dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Integration with Express Backend

### Trigger Evaluation (from Express)

```typescript
// In projectController.ts - after submission creation
const response = await fetch('http://localhost:8000/api/evaluate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submission_id: submissionId,
    project_id: projectId,
    course_id: courseId,
    user_id: userId,
    essay_text: essayText,
    file_urls: fileUrls
  })
});
```

### Poll for Results (from Express)

```typescript
// In feedbackController.ts
const response = await fetch(`http://localhost:8000/api/feedback/${submissionId}`);
const data = await response.json();

if (data.processing_status === 'completed') {
  // Display results to student
}
```

## Environment Variables

See `.env.example` for all configuration options.

**Required:**
- `OPENAI_API_KEY` - Your OpenAI API key
- `DATABASE_URL` - PostgreSQL connection string

**Optional:**
- `MAX_INPUT_TOKENS` - Token limit (default: 10000)
- `CACHE_ENABLED` - Enable caching (default: true)
- `LOG_LEVEL` - Logging level (default: INFO)

## Monitoring

- **Structured Logging**: JSON logs via structlog
- **Health Checks**: `/health` endpoint
- **Cost Tracking**: Per-submission token/cost logging
- **Error Handling**: Automatic retries (max 3 attempts)

## License

MIT
