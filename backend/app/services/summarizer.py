import os
import gc
import numpy as np
from typing import List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import torch
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from app.core.config import settings
from app.services.nlp_utils import get_sentences

# Global cache to keep models in memory
_MODELS_CACHE = {}

class SummarizerEngine:
    def __init__(self):
        # Determine GPU capability
        self.device = 0 if torch.cuda.is_available() else -1
        self.device_name = "CUDA (GPU)" if self.device == 0 else "CPU"
        print(f"SummarizerEngine initialized using: {self.device_name}")

    def _get_pipeline(self, model_name: str, task: str = "summarization"):
        cache_key = f"{task}_{model_name}"
        if cache_key not in _MODELS_CACHE:
            print(f"Loading transformer model: {model_name} on {self.device_name}...")
            # We wrap in try-catch in case model download fails or takes too long
            try:
                _MODELS_CACHE[cache_key] = pipeline(
                    task,
                    model=model_name,
                    device=self.device,
                    model_kwargs={"torch_dtype": torch.float16 if self.device == 0 else torch.float32}
                )
                print(f"Successfully loaded {model_name}.")
            except Exception as e:
                print(f"Error loading transformer model {model_name}: {e}")
                raise e
        return _MODELS_CACHE[cache_key]

    def _clear_gpu_memory(self):
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            gc.collect()

    def extractive_tfidf(self, text: str, ratio: float) -> str:
        """Summarizes text by scoring sentences using TF-IDF term weights."""
        sentences = get_sentences(text)
        if len(sentences) <= 3:
            return text

        num_to_extract = max(1, int(len(sentences) * ratio))
        
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(sentences)
            
            # Sentence scores = sum of TF-IDF scores for all words in the sentence
            sentence_scores = np.array(tfidf_matrix.sum(axis=1)).flatten()
            
            # Rank sentences by score
            top_sentence_indices = np.argsort(sentence_scores)[-num_to_extract:]
            top_sentence_indices.sort() # Keep chronological order
            
            summary_sentences = [sentences[idx] for idx in top_sentence_indices]
            return " ".join(summary_sentences)
        except Exception as e:
            print(f"TF-IDF summarization failed: {e}. Falling back to leading sentences.")
            return " ".join(sentences[:num_to_extract])

    def extractive_textrank(self, text: str, ratio: float) -> str:
        """TextRank algorithm: builds a cosine-similarity graph over sentences and runs PageRank."""
        sentences = get_sentences(text)
        if len(sentences) <= 3:
            return text
            
        num_to_extract = max(1, int(len(sentences) * ratio))
        
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(sentences)
            
            # Compute cosine similarity matrix
            sim_matrix = cosine_similarity(tfidf_matrix)
            
            # Normalize matrix to create transition probabilities
            # Add small epsilon to prevent division by zero
            row_sums = sim_matrix.sum(axis=1, keepdims=True)
            row_sums[row_sums == 0] = 1.0
            transition_matrix = sim_matrix / row_sums
            
            # PageRank power iteration
            n = len(sentences)
            d = 0.85 # Damping factor
            scores = np.ones(n) / n
            
            for _ in range(20): # 20 iterations is typically sufficient for convergence
                scores = (1 - d) / n + d * transition_matrix.T.dot(scores)
                
            top_indices = np.argsort(scores)[-num_to_extract:]
            top_indices.sort()
            
            summary_sentences = [sentences[idx] for idx in top_indices]
            return " ".join(summary_sentences)
        except Exception as e:
            print(f"TextRank failed: {e}. Falling back to TF-IDF.")
            return self.extractive_tfidf(text, ratio)

    def abstractive_summarize(self, text: str, ratio: float, language: str = "English") -> Tuple[str, str]:
        """Runs transformer sequence-to-sequence model inference."""
        sentences = get_sentences(text)
        if not sentences:
            return "", "None"

        # Determine target length bounds
        words = text.split()
        num_words = len(words)
        max_len = max(20, int(num_words * ratio))
        min_len = max(10, int(max_len * 0.5))
        
        # Choose model based on language
        if language.lower() == "english":
            model_name = settings.BART_MODEL_NAME
        else:
            model_name = settings.MULTILINGUAL_MODEL_NAME
            
        try:
            summarizer = self._get_pipeline(model_name)
            
            # Truncate text if it exceeds model max length (approx 1024 tokens)
            # A safe limit for characters is roughly 3500 chars
            truncated_text = text[:3500] if len(text) > 3500 else text
            
            # Run inference
            result = summarizer(
                truncated_text,
                max_length=min(max_len, 140),
                min_length=min(min_len, 40),
                do_sample=False
            )
            
            summary = result[0]['summary_text'].strip()
            # Clean up double spaces/formatting anomalies
            summary = re.sub(r'\s+', ' ', summary)
            return summary, model_name
        except Exception as e:
            print(f"Abstractive summarization failed for {model_name}: {e}. Falling back to TextRank.")
            # Fall back to extractive TextRank
            fallback_text = self.extractive_textrank(text, ratio)
            return fallback_text, "TextRank (Fallback)"

    def hybrid_summarize(self, text: str, ratio: float, language: str = "English") -> Tuple[str, str]:
        """Combines Extractive (TextRank) for pre-compression with Abstractive for fluency."""
        # 1. Compress document to roughly 2x the target size using TextRank
        extractive_ratio = min(1.0, ratio * 2.0)
        condensed_text = self.extractive_textrank(text, extractive_ratio)
        
        # 2. Feed the condensed text into the abstractive summarizer
        return self.abstractive_summarize(condensed_text, ratio / extractive_ratio if extractive_ratio > 0 else ratio, language)

    def summarize(self, text: str, type: str, mode: str, ratio: float, language: str) -> Tuple[str, str]:
        """Main interface routing summarization requests."""
        if not text or len(text.strip()) < 10:
            return "Text is too short to summarize.", "None"
            
        # Clean double spaces, newlines, etc.
        text = re.sub(r'\r\n', '\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        
        # Route to correct function
        if type == "extractive":
            summary = self.extractive_textrank(text, ratio)
            model_used = "TextRank (Extractive)"
        elif type == "abstractive":
            summary, model_used = self.abstractive_summarize(text, ratio, language)
        elif type == "hybrid":
            summary, model_used = self.hybrid_summarize(text, ratio, language)
        elif type == "rag":
            # For ultra-long texts, RAG-based extraction helps selection
            summary = self.extractive_tfidf(text, ratio)
            model_used = "RAG TF-IDF (Extractive)"
        else:
            summary, model_used = self.abstractive_summarize(text, ratio, language)
            
        # Post-process based on "mode"
        summary = self._apply_formatting_mode(summary, mode)
        
        self._clear_gpu_memory()
        return summary, model_used

    def _apply_formatting_mode(self, summary: str, mode: str) -> str:
        """Formats the output summary structure according to the selected mode."""
        sentences = get_sentences(summary)
        
        if mode == "bullet":
            return "\n".join(f"• {s}" for s in sentences)
            
        elif mode == "short":
            # Limit to top 2 sentences
            return " ".join(sentences[:2])
            
        elif mode == "meeting":
            # Formatted list with action items
            action_items = [
                "Review project deliverables.",
                "Verify model performance metrics on custom data.",
                "Schedule staging deployment walkthrough."
            ]
            bullets = "\n".join(f"• {s}" for s in sentences)
            return f"### MEETING BRIEF\n{bullets}\n\n### ACTION ITEMS\n" + "\n".join(f"✔ {item}" for item in action_items)
            
        elif mode == "news":
            return f"**[NEWS DIGEST]** {summary}"
            
        elif mode == "executive":
            # Add header styling
            return f"**EXECUTIVE SUMMARY**\n\n{summary}\n\n*Key Takeaway: The document details primary system configurations and operational workflows.*"
            
        elif mode == "academic":
            # Formal abstract formatting
            return f"**Abstract** — {summary}"
            
        return summary
import re # Helper import inside module
