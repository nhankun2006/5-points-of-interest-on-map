import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from huggingface_hub.utils import HfHubHTTPError

logging.basicConfig(level=logging.INFO)

# Default model for EN->VI translation
DEFAULT_MODEL = "Helsinki-NLP/opus-mt-en-vi"

HF_API_KEY = os.environ.get("HF_API_KEY")

app = FastAPI(title="HuggingFace Proxy API")

# Allow requests from any origin (for ngrok/local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslateRequest(BaseModel):
    text: str
    model: Optional[str] = None

class TranslateResponse(BaseModel):
    translated_text: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    if not HF_API_KEY:
        raise HTTPException(status_code=500, detail="HF_API_KEY not set on server")

    model_id = req.model or DEFAULT_MODEL
    
    # Initialize the client with the API key
    client = InferenceClient(token=HF_API_KEY)

    try:
        # The translation task usually returns a list of dictionaries with 'translation_text'
        # We use the recommended 'translation' task method if available, or raw post.
        # For simplicity and generality with this specific model type, we can use the `translation` helper or `post`.
        
        # Using the dedicated translation method (if supported by the library version) or generic post
        # The InferenceClient makes it easy:
        output = client.translation(text=req.text, model=model_id)
        
        # Output format depends on the task, but for translation it's usually:
        # {'translation_text': '...'} or explicit string depending on parameters.
        # The python client typically returns the specific result object.
        
        translated_text = ""
        if isinstance(output, dict):
             translated_text = output.get("translation_text", "")
        elif isinstance(output, list) and len(output) > 0:
             translated_text = output[0].get("translation_text", "")
        elif isinstance(output, str):
             translated_text = output
             
        if not translated_text:
             # Fallback for some models that might return different structures
             logging.warning("Unexpected response format: %s", output)
             translated_text = str(output)

        return {"translated_text": translated_text}

    except HfHubHTTPError as e:
        logging.error("Hugging Face API error: %s", e)
        raise HTTPException(status_code=502, detail=f"HuggingFace API Error: {e.server_message}")
    except Exception as e:
        logging.exception("Unexpected error during translation")
        raise HTTPException(status_code=500, detail=str(e))
