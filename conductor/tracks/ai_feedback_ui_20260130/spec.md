# Track Specification: Refine AI Feedback Logic and UI Integration

## 1. Goal
To improve the quality, specificity, and actionability of the AI-generated feedback for student projects and to enhance the user interface to display this feedback in a clear, engaging, and "Professional & Academic" manner.

## 2. Requirements
### Backend AI (Python)
- [ ] Update `backend-ai/agents/project_evaluator.py` to use a more structured prompt that encourages specific, actionable advice.
- [ ] Ensure the AI output returns structured data (e.g., JSON) with distinct sections for "Strengths", "Areas for Improvement", and "Actionable Steps".
- [ ] Validate the AI response schema using Pydantic models.

### Frontend (React)
- [ ] Create or update a `FeedbackDisplay` component in `src/components/ui/` to render the structured feedback.
- [ ] Use `shadcn/ui` components (Card, Accordion, Badge) to organize the feedback sections.
- [ ] Ensure the design adheres to the "Professional & Academic" tone (clean typography, clear hierarchy).
- [ ] Display a "Loading" state while feedback is being generated.
- [ ] Handle error states gracefully with informative messages.

## 3. User Stories
- As a **student**, I want to receive specific advice on how to improve my essay so that I can get a better grade on the next submission.
- As a **student**, I want the feedback to be organized into clear sections so that I can easily digest the information.
- As an **instructor**, I want to trust that the AI is providing high-quality feedback so that I don't have to correct it manually.

## 4. Design Guidelines
- **Tone:** Professional, precise, and encouraging.
- **Visuals:** Use the project's color palette (defined in `tailwind.config.ts`) to differentiate between feedback types (e.g., green for strengths, amber for improvements).
- **Accessibility:** Ensure all text is legible and compatible with screen readers.
