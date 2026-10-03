# AI task matching for students

## Goal
Add a student-only matcher on the student home page. A student describes their skills, interests, and preferred work in plain language, then receives a short ranked list of currently open tasks with a clear explanation for each match.

## What will change
- Add a focused “Find my best tasks” area to the student home page with a natural-language text box, an example prompt, submit/loading/error states, and a way to refine the description.
- Send only the student’s description, existing profile skills, and a compact set of eligible open tasks to the server; exclude tasks they already submitted.
- Use Lovable AI Gateway with the required `openai/gpt-6-astra` Responses flow to rank task IDs and explain each match.
- Validate the model result against the supplied task IDs, remove duplicates or invalid IDs, limit the response to the strongest matches, and display only live task data from the app.
- Show each recommendation with match strength, concise rationale, matched skills/interests, reward, difficulty, deadline, and a direct link to the task.
- Keep the existing non-AI relevance list as the default/fallback before a student runs the matcher.

## Access and safety
- Require an authenticated student for the AI request using the app’s existing protected server-function pattern.
- Keep the API key, model prompt, and gateway call on the server.
- Validate and length-limit student input; treat task and user text as untrusted matching data, not instructions.
- Surface rate-limit, credit, access, and validation messages clearly without silently retrying or switching models.

## Technical details
- Add the AI SDK and OpenAI adapter packages if not already installed.
- Add request-scoped AI Gateway/Responses helpers in server-only files, including gateway-issued run-ID propagation.
- Add a client-safe server function for the matcher and a reusable result type.
- Update the student page and add a small focused matcher component using existing SkillSync tokens and controls.
- Record the server-side AI boundary decision in `AGENTS.md`.

## Verification
- Type-check and build the app.
- Make a real AI Gateway request with available open tasks and inspect the response.
- Test signed-out and signed-in student states, error handling, recommendation links, and desktop/mobile layouts.
