import os
import json
from typing import List, Dict, Any, Optional

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CORPUS_PATH = os.path.join(PROJECT_ROOT, "data", "knowledge_base", "financial_corpus.json")

_embedding_model = None
_faiss_index = None
_corpus_docs: List[Dict[str, Any]] = []

def _load_corpus() -> List[Dict[str, Any]]:
    global _corpus_docs
    if not _corpus_docs and os.path.exists(CORPUS_PATH):
        try:
            with open(CORPUS_PATH, "r", encoding="utf-8") as f:
                _corpus_docs = json.load(f)
        except Exception as e:
            print("Error loading financial corpus:", e)
    return _corpus_docs

def _initialize_index():
    global _embedding_model, _faiss_index, _corpus_docs
    if _faiss_index is not None:
        return

    docs = _load_corpus()
    if not docs:
        return

    try:
        from sentence_transformers import SentenceTransformer
        import faiss

        # Fast, high-quality, lightweight 384-dimensional embedding model
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        texts = [f"{d['topic']}: {d['content']}" for d in docs]
        embeddings = _embedding_model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

        dimension = embeddings.shape[1]
        _faiss_index = faiss.IndexFlatIP(dimension)  # Cosine similarity
        _faiss_index.add(embeddings)
    except Exception as e:
        print("Notice: Vector indexing initialization fallback:", e)

def search_knowledge_base(query: str, top_k: int = 2) -> List[Dict[str, Any]]:
    """
    Retrieves top-k most semantically relevant financial & YouTube video knowledge chunks using FAISS.
    """
    docs = _load_corpus()
    if not docs:
        return []

    _initialize_index()

    if _faiss_index is not None and _embedding_model is not None:
        try:
            query_emb = _embedding_model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
            distances, indices = _faiss_index.search(query_emb, top_k)

            results = []
            for score, idx in zip(distances[0], indices[0]):
                if 0 <= idx < len(docs):
                    if float(score) >= 0.28:
                        doc = dict(docs[idx])
                        doc["similarity_score"] = round(float(score), 4)
                        results.append(doc)
            if results:
                return results
        except Exception as e:
            print("FAISS search notice:", e)

    # Keyword Overlap Fallback
    q_lower = query.lower()
    scored = []
    for d in docs:
        combined = f"{d['topic']} {d['content']}".lower()
        overlap = sum(1 for word in q_lower.split() if len(word) > 3 and word in combined)
        if overlap > 0:
            scored.append((overlap, d))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:top_k]]
