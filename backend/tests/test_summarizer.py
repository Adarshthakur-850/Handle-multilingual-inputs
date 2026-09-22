import unittest
from app.services.nlp_utils import get_sentences, calculate_readability, extract_keywords
from app.services.summarizer import SummarizerEngine

class TestSummarizerEngine(unittest.TestCase):
    def setUp(self):
        self.engine = SummarizerEngine()
        self.sample_text = (
            "FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ "
            "based on standard Python type hints. The key features are very fast performance, fast coding "
            "speed, fewer bugs, intuitive design, and robust production-ready code. FastAPI is built on ASGI "
            "standards which makes it incredibly fast for asynchronous programming. It has built-in support "
            "for database integrations, automated document parsing, validation, and OAuth2 security authentication."
        )

    def test_sentence_tokenization(self):
        sentences = get_sentences(self.sample_text)
        self.assertGreaterEqual(len(sentences), 3)
        self.assertIn("FastAPI is a modern", sentences[0])

    def test_readability_score(self):
        score = calculate_readability(self.sample_text)
        self.assertGreater(score, 0.0)
        self.assertLessEqual(score, 100.0)

    def test_keywords_extraction(self):
        keywords = extract_keywords(self.sample_text, top_n=3)
        self.assertEqual(len(keywords), 3)
        self.assertIn("fastapi", keywords)

    def test_extractive_tfidf(self):
        summary = self.engine.extractive_tfidf(self.sample_text, ratio=0.5)
        self.assertIsNotNone(summary)
        self.assertLess(len(summary), len(self.sample_text))

    def test_extractive_textrank(self):
        summary = self.engine.extractive_textrank(self.sample_text, ratio=0.5)
        self.assertIsNotNone(summary)
        self.assertLess(len(summary), len(self.sample_text))

if __name__ == "__main__":
    unittest.main()
