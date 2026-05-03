# AI Campaign Studio

AI Campaign Studio is a full-stack AI marketing assistant that generates campaign strategies, platform-specific content cards, and marketing visuals from a structured creative brief.

The project combines a FastAPI backend with a modern HTML/CSS/JavaScript frontend. It uses the Gemini API for campaign strategy generation and the Hugging Face Inference API with FLUX.1-schnell for image generation.

## Features

- Generate a complete campaign strategy from a short creative brief
- Create platform-specific campaign cards for Instagram, TikTok, and LinkedIn
- Generate marketing visuals from AI-produced creative prompts
- Copy generated campaign strategy to clipboard
- Download campaign strategy as a text file
- Download generated visuals
- Save recent campaigns in browser-based local history
- Reload previous campaigns from clickable history cards
- Responsive frontend with a modern creative-studio interface

## Tech Stack

### Backend
- Python
- FastAPI
- Pydantic
- Gemini API
- Hugging Face Inference API
- FLUX.1-schnell
- Uvicorn
- python-dotenv

### Frontend
- HTML
- CSS
- JavaScript
- localStorage
- Marked.js
- html2canvas

## Project Structure

```text
ai-campaign-assistant/
│
├── app.py
├── requirements.txt
├── .env
├── .gitignore
│
├── static/
│   ├── style.css
│   ├── script.js
│   └── generated/
│
└── templates/
    └── index.html
```

### Example Use Case
A user enters a campaign brief such as:
```
{
  "brand": "Nike",
  "product": "Running shoes",
  "target_audience": "University students",
  "campaign_goal": "Increase online sales",
  "tone": "Energetic",
  "platform": "Instagram",
  "budget_level": "Medium"
}
```

The app generates:
- Campaign overview
- Target audience insight
- Core messaging
- Budget recommendation
- Brand safety notes
- Instagram, TikTok, and LinkedIn content cards
- Visual prompt
- AI-generated marketing image

### How It Works
1. The user fills in a structured campaign brief.
2. The FastAPI backend sends the brief to the Gemini API.
3. Gemini returns a structured campaign plan, platform cards, and a visual prompt.
4. The frontend displays the strategy and platform-specific outputs.
5. The user can generate a visual using the Hugging Face Inference API.
6. The generated campaign can be copied, downloaded, or saved in local browser history.


## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-campaign-assistant.git
cd ai-campaign-assistant
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it.

On Windows PowerShell:

```bash
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create a `.env` file

Create a `.env` file in the root folder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
HF_TOKEN=your_huggingface_token_here
```

Do not upload this file to GitHub.

### 5. Run the app

```bash
uvicorn app:app --reload
```

Open the app in your browser:

```text
http://127.0.0.1:8000
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Used for campaign strategy and structured text generation |
| `HF_TOKEN` | Used for Hugging Face image generation |

## Notes on API Usage

This project requires valid API access for:

- Gemini API
- Hugging Face Inference Providers

If an external model or provider is unavailable, the application includes fallback handling so the user experience does not fully break.

Generated images are saved locally inside:

```text
static/generated/
```

This folder is ignored by Git because generated files should not be committed.

## Deployment Notes

This app cannot be deployed with GitHub Pages alone because it requires a Python FastAPI backend and private API keys.

Recommended deployment platforms:

- Render
- Railway
- Hugging Face Spaces
- PythonAnywhere

For Render, use:

```bash
pip install -r requirements.txt
```

as the build command, and:

```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

as the start command.

Add the following environment variables in the hosting platform settings:

```text
GEMINI_API_KEY
HF_TOKEN
```

## Why I Built This

I built this project to explore how generative AI can support marketing technology workflows. The app demonstrates how AI can turn structured business inputs into campaign strategy, channel-specific outputs, and visual creative concepts.

It is designed as a practical AI software engineering project combining backend APIs, frontend interaction, LLM integration, image generation, and user-focused product design.

## Future Improvements

- Add user accounts and persistent campaign history
- Store campaigns in a database such as SQLite or PostgreSQL
- Add PDF export for campaign reports
- Support more platforms such as YouTube, Google Ads, and Email
- Add multiple image variants per campaign
- Add editable campaign sections before export
- Improve deployment persistence for generated visuals

## Screenshots



```text
screenshots/
├── home.png
├── generated-campaign.png
├── platform-cards.png
└── generated-visual.png
```

## License

This project is for educational and portfolio purposes.
