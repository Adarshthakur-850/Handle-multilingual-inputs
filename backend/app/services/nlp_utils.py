import re
import io
import urllib.parse
from typing import List, Dict, Any, Tuple
import requests
from bs4 import BeautifulSoup
import PyPDF2
import docx
import nltk
from nltk.corpus import stopwords

# Programmatic download of nltk dependencies
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text.strip()

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    text = ""
    for para in doc.paragraphs:
        if para.text:
            text += para.text + "\n"
    return text.strip()

def extract_text_from_url(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    # Remove script and style elements
    for script in soup(["script", "style", "nav", "header", "footer"]):
        script.decompose()
        
    text = soup.get_text(separator=' ')
    
    # Clean whitespace
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = '\n'.join(chunk for chunk in chunks if chunk)
    return text.strip()

def get_sentences(text: str) -> List[str]:
    # Use NLTK sent_tokenize, fallback to regex if it fails
    try:
        sentences = nltk.sent_tokenize(text)
        return [s.strip() for s in sentences if s.strip()]
    except Exception:
        # Fallback simple sentence splitter
        sentence_end = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s')
        return [s.strip() for s in sentence_end.split(text) if s.strip()]

def get_words(text: str) -> List[str]:
    # Regex word extractor
    return re.findall(r'\b\w+\b', text.lower())

def count_syllables(word: str) -> int:
    word = word.lower()
    count = 0
    vowels = "aeiouy"
    if not word:
        return 0
    if word[0] in vowels:
        count += 1
    for index in range(1, len(word)):
        if word[index] in vowels and word[index - 1] not in vowels:
            count += 1
    if word.endswith("e"):
        count -= 1
    if count == 0:
        count += 1
    return count

def calculate_readability(text: str) -> float:
    """Calculates Flesch Reading Ease score."""
    sentences = get_sentences(text)
    words = get_words(text)
    
    if not sentences or not words:
        return 0.0
        
    num_sentences = len(sentences)
    num_words = len(words)
    
    num_syllables = sum(count_syllables(w) for w in words)
    
    asl = num_words / num_sentences
    asw = num_syllables / num_words
    
    # Flesch Reading Ease Formula
    score = 206.835 - (1.015 * asl) - (84.6 * asw)
    return max(0.0, min(100.0, round(score, 2)))

def extract_keywords(text: str, top_n: int = 8) -> List[str]:
    """Extracts keywords based on frequency and stopword filtration."""
    words = get_words(text)
    if not words:
        return []
        
    try:
        stop_words = set(stopwords.words('english'))
    except Exception:
        stop_words = {"the", "and", "a", "of", "to", "in", "is", "that", "it", "on", "for", "with", "as", "was", "at"}
        
    # Additional generic keywords to filter
    stop_words.update({"said", "has", "have", "would", "could", "should", "also", "its", "their", "this", "these", "those"})
    
    filtered_words = [w for w in words if len(w) > 3 and w not in stop_words]
    
    freq = {}
    for w in filtered_words:
        freq[w] = freq.get(w, 0) + 1
        
    sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [kw[0] for kw in sorted_keywords[:top_n]]

def extract_entities(text: str) -> List[Dict[str, str]]:
    """Rule-based Named Entity Recognition (NER) for lightning-fast parsing."""
    entities = []
    seen = set()
    
    # Email addresses
    emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    for email in emails:
        if email not in seen:
            entities.append({"text": email, "label": "EMAIL"})
            seen.add(email)
            
    # Dates (e.g. 2026-05-23, May 23, 2026)
    dates = re.findall(r'\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b', text)
    for date in dates:
        if date not in seen:
            entities.append({"text": date, "label": "DATE"})
            seen.add(date)
            
    # Percentages and Monetary values
    values = re.findall(r'\b\d+(?:\.\d+)?%\b|\b\$[0-9,]+(?:\.\d+)?\b|\b[0-9,]+ USD\b', text)
    for val in values:
        if val not in seen:
            entities.append({"text": val, "label": "VALUE"})
            seen.add(val)
            
    # Capitalized sequences representing People/Organizations/Locations
    # Match sequences like "United Nations", "Sundar Pichai", "New York"
    caps_sequences = re.findall(r'\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+\b', text)
    for seq in caps_sequences:
        # Ignore common starts like sentence beginnings if they match common stopwords
        words = seq.lower().split()
        if words[0] in {"the", "a", "an", "this", "that", "he", "she", "they", "in", "on", "at"}:
            continue
        if seq not in seen:
            # Basic heuristics to classify
            label = "ORG"
            if any(term in seq.lower() for term in ["corporation", "company", "inc", "group", "association", "limited", "co", "ltd", "university", "institute", "organization", "agency"]):
                label = "ORG"
            elif any(term in seq.lower() for term in ["city", "state", "country", "river", "mountain", "ocean", "valley", "park", "street", "road", "avenue"]):
                label = "LOC"
            elif len(seq.split()) == 2:
                # Often a person's name (e.g. John Smith)
                label = "PERSON"
            entities.append({"text": seq, "label": label})
            seen.add(seq)
            
    return entities[:15]  # Limit to top 15 entities to keep UI clean
