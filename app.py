import json
import os
import uuid
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from huggingface_hub import InferenceClient


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing. Add it to your .env file.")

client = genai.Client(api_key=api_key)

hf_token = os.getenv("HF_TOKEN")

if not hf_token:
    raise RuntimeError("HF_TOKEN is missing. Add it to your .env file.")

hf_client = InferenceClient(token=hf_token)

app = FastAPI(
    title="AI Campaign Assistant",
    description="Generates campaign plans, platform-specific cards, and campaign visuals using Gemini.",
    version="2.0.0",
)

# Create folder for generated images
generated_dir = Path("static/generated")
generated_dir.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


class CampaignRequest(BaseModel):
    brand: str = Field(..., example="Nike")
    product: str = Field(..., example="Running shoes")
    target_audience: str = Field(..., example="University students")
    campaign_goal: str = Field(..., example="Increase online sales")
    tone: str = Field(..., example="Energetic")
    platform: str = Field(..., example="Instagram")
    budget_level: str = Field(..., example="Medium")


class PlatformCard(BaseModel):
    platform: str
    audience_angle: str
    content_format: str
    hook: str
    caption: str
    cta: str
    creative_direction: str


class CampaignResponse(BaseModel):
    output: str
    source: str
    platforms: List[PlatformCard]
    visual_prompt: str
    visual_url: Optional[str] = None


class VisualRequest(BaseModel):
    brand: str
    product: str
    target_audience: str
    campaign_goal: str
    tone: str
    platform: str
    budget_level: str
    visual_prompt: str


class VisualResponse(BaseModel):
    image_url: Optional[str]
    source: str
    visual_prompt: str
    fallback: bool = False
    detail: Optional[str] = None


def clean_json_text(text: str) -> str:
    text = text.strip()

    if text.startswith("```json"):
        text = text.replace("```json", "", 1).strip()

    if text.startswith("```"):
        text = text.replace("```", "", 1).strip()

    if text.endswith("```"):
        text = text[:-3].strip()

    return text


def build_fallback_platforms(request: CampaignRequest) -> List[PlatformCard]:
    return [
        PlatformCard(
            platform="Instagram",
            audience_angle=f"Show how {request.product} fits a visual, aspirational lifestyle for {request.target_audience}.",
            content_format="Reels + Stories + carousel posts",
            hook=f"Move better. Look sharper. Feel ready with {request.brand}.",
            caption=f"From busy mornings to late training sessions, {request.brand} {request.product} keeps you moving with confidence.",
            cta="Shop now and discover your next everyday essential.",
            creative_direction="Bright, stylish, energetic visuals with clean lifestyle scenes and product-focused close-ups."
        ),
        PlatformCard(
            platform="TikTok",
            audience_angle=f"Use fast, authentic, trend-aware content that feels relatable to {request.target_audience}.",
            content_format="Short-form vertical video",
            hook=f"POV: you found the pair that matches your pace.",
            caption=f"Unbox, style, and test {request.brand} {request.product} in a quick, energetic clip with a relatable campus/workout vibe.",
            cta="Try it, style it, and share your look.",
            creative_direction="Fast cuts, trend-driven editing, dynamic movement, authentic and casual creator-style visuals."
        ),
        PlatformCard(
            platform="LinkedIn",
            audience_angle="Position the campaign in a more polished and insight-driven way for a professional audience.",
            content_format="Thought-leadership post + clean static creative",
            hook=f"Designing campaigns that connect performance, lifestyle, and brand value.",
            caption=f"This concept positions {request.brand} {request.product} as a product that supports modern routines while reflecting practical consumer needs.",
            cta="Learn more about the strategy behind the campaign.",
            creative_direction="Clean, minimal, polished visuals with premium product presentation and professional composition."
        ),
    ]


def build_fallback_visual_prompt(request: CampaignRequest) -> str:
    return (
        f"Create a premium advertising visual for {request.brand} {request.product}. "
        f"The target audience is {request.target_audience}. "
        f"The tone should be {request.tone.lower()} and suitable for {request.platform}. "
        f"Show a modern, polished scene with strong product focus, clean composition, "
        f"subtle brand presence, realistic lighting, and no unreadable text clutter. "
        f"The image should feel like a high-quality digital marketing creative."
    )


def build_fallback_campaign(request: CampaignRequest):
    platforms = build_fallback_platforms(request)
    visual_prompt = build_fallback_visual_prompt(request)

    output = f"""
# Campaign Plan for {request.brand} {request.product}

## 1. Campaign Concept
Build a {request.tone.lower()} campaign for **{request.brand} {request.product}**, focused on **{request.target_audience}** and the goal of **{request.campaign_goal}**.

## 2. Target Audience Insight
The audience is likely to respond to messaging that connects the product with everyday lifestyle, confidence, convenience, and performance.

## 3. Core Messaging
Highlight product value, lifestyle fit, and a strong emotional connection between brand and audience.

## 4. Budget Recommendation
With a **{request.budget_level.lower()}** budget, prioritize a small number of high-quality creatives and test different messaging angles.

## 5. Brand Safety Notes
Avoid exaggerated claims, offensive messaging, and sensitive targeting.

---
**Note:** Gemini structured output was unavailable, so this response was generated using the local fallback system.
""".strip()

    return output, platforms, visual_prompt


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


@app.post("/generate-campaign", response_model=CampaignResponse)
def generate_campaign(request: CampaignRequest):
    prompt = f"""
You are an AI marketing strategist.

Return ONLY valid JSON.
Do not include markdown fences.
Do not include extra commentary.

The JSON must follow this structure exactly:
{{
  "campaign_markdown": "string",
  "visual_prompt": "string",
  "platform_cards": [
    {{
      "platform": "Instagram",
      "audience_angle": "string",
      "content_format": "string",
      "hook": "string",
      "caption": "string",
      "cta": "string",
      "creative_direction": "string"
    }},
    {{
      "platform": "TikTok",
      "audience_angle": "string",
      "content_format": "string",
      "hook": "string",
      "caption": "string",
      "cta": "string",
      "creative_direction": "string"
    }},
    {{
      "platform": "LinkedIn",
      "audience_angle": "string",
      "content_format": "string",
      "hook": "string",
      "caption": "string",
      "cta": "string",
      "creative_direction": "string"
    }}
  ]
}}

Campaign details:
Brand: {request.brand}
Product: {request.product}
Target audience: {request.target_audience}
Campaign goal: {request.campaign_goal}
Tone: {request.tone}
Main platform: {request.platform}
Budget level: {request.budget_level}

Rules:
- campaign_markdown should be clean markdown with sections.
- platform_cards must contain exactly 3 cards: Instagram, TikTok, LinkedIn.
- visual_prompt should be a strong image-generation prompt for a polished marketing creative.
- Keep everything practical and realistic.
- Avoid unsupported claims, offensive language, and sensitive targeting.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw_text = response.text or ""
        cleaned = clean_json_text(raw_text)
        parsed = json.loads(cleaned)

        campaign_markdown = parsed["campaign_markdown"]
        visual_prompt = parsed["visual_prompt"]
        platform_cards = [PlatformCard(**item) for item in parsed["platform_cards"]]

        return CampaignResponse(
            output=campaign_markdown,
            source="Gemini API",
            platforms=platform_cards,
            visual_prompt=visual_prompt,
            visual_url=None
        )

    except Exception:
        fallback_output, fallback_platforms, fallback_visual_prompt = build_fallback_campaign(request)

        return CampaignResponse(
            output=fallback_output,
            source="Local fallback",
            platforms=fallback_platforms,
            visual_prompt=fallback_visual_prompt,
            visual_url=None
        )


@app.post("/generate-visual", response_model=VisualResponse)
def generate_visual(request: VisualRequest):
    aspect_ratio_note = {
        "Instagram": "square 1:1 composition",
        "TikTok": "vertical 9:16 composition",
        "LinkedIn": "professional 4:3 composition",
    }.get(request.platform, "square 1:1 composition")

    final_prompt = f"""
A premium advertising visual for {request.brand} {request.product}.

Target audience: {request.target_audience}
Campaign goal: {request.campaign_goal}
Tone: {request.tone}
Platform: {request.platform}
Budget level: {request.budget_level}

Creative direction:
{request.visual_prompt}

Style requirements:
high-quality marketing photography, realistic, polished, modern, clean composition,
strong product focus, {aspect_ratio_note}, no text, no watermark, no logo distortion.
"""

    try:
        image = hf_client.text_to_image(
            prompt=final_prompt,
            model="black-forest-labs/FLUX.1-schnell"
        )

        filename = f"{uuid.uuid4().hex}.png"
        file_path = generated_dir / filename
        image.save(file_path)

        return VisualResponse(
            image_url=f"/static/generated/{filename}",
            source="Hugging Face Inference API (FLUX.1-schnell)",
            visual_prompt=request.visual_prompt,
            fallback=False
        )

    except Exception as e:
        return VisualResponse(
            image_url=None,
            source="Prompt fallback",
            visual_prompt=request.visual_prompt,
            fallback=True,
            detail=f"Hugging Face image generation failed: {str(e)}"
        )