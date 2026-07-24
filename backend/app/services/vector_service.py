import numpy as np
import faiss
import re
import math
from typing import List, Dict, Any, Tuple
from app.services.code_parser import CodeChunk

class VectorService:
    def __init__(self, dimension: int = 256):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(self.dimension) # Inner product similarity (normalized vectors = cosine sim)
        self.chunks: List[CodeChunk] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}

    def _tokenize(self, text: str) -> List[str]:
        """Simple, fast code tokenizer using regex."""
        words = re.findall(r'[A-Za-z0-9_]+', text.lower())
        return [w for w in words if len(w) > 1]

    def _build_tfidf_vocab(self, docs: List[str]):
        """Build vocabulary and inverse document frequencies."""
        doc_count = len(docs)
        freq = {}
        for doc in docs:
            tokens = set(self._tokenize(doc))
            for t in tokens:
                freq[t] = freq.get(t, 0) + 1

        # Keep top terms
        sorted_terms = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:self.dimension]
        self.vocabulary = {term: idx for idx, (term, _) in enumerate(sorted_terms)}
        
        self.idf = {}
        for term, idx in self.vocabulary.items():
            self.idf[term] = math.log((doc_count + 1) / (freq[term] + 1)) + 1.0

    def _embed_text(self, text: str) -> np.ndarray:
        """Embed text using TF-IDF vectorizer projected to dimension."""
        vec = np.zeros(self.dimension, dtype=np.float32)
        tokens = self._tokenize(text)
        if not tokens:
            return vec
            
        tf = {}
        for t in tokens:
            if t in self.vocabulary:
                tf[t] = tf.get(t, 0) + 1

        for term, count in tf.items():
            idx = self.vocabulary[term]
            vec[idx] = count * self.idf[term]

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def index_chunks(self, chunks: List[CodeChunk]):
        """Build FAISS index from list of code chunks."""
        self.chunks = chunks
        if not chunks:
            return
            
        # Prepare text representations combining path, names, and content
        documents = []
        for chunk in chunks:
            doc_str = f"{chunk.file_path} {chunk.class_name or ''} {chunk.function_name or ''} {chunk.summary} {chunk.code_content}"
            documents.append(doc_str)

        self._build_tfidf_vocab(documents)
        
        vectors = []
        for doc in documents:
            v = self._embed_text(doc)
            vectors.append(v)
            
        vectors_np = np.array(vectors, dtype=np.float32)
        
        # Reset and add to FAISS index
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(vectors_np)

    def search(self, query: str, top_k: int = 5) -> List[Tuple[CodeChunk, float]]:
        """Search top_k relevant code chunks for a natural language query."""
        if not self.chunks or self.index.ntotal == 0:
            return []

        query_vec = self._embed_text(query).reshape(1, -1)
        distances, indices = self.index.search(query_vec, min(top_k, len(self.chunks)))
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx >= 0 and idx < len(self.chunks):
                # Cosine similarity score bounded 0 to 1
                score = float(max(0.0, min(1.0, dist)))
                results.append((self.chunks[idx], score))
                
        return results
