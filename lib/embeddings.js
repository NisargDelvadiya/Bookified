// Utility for generating embeddings using Google's text-embedding-004 model
// and performing vector similarity calculations

export async function getEmbedding(text, apiKey = process.env.GEMINI_API_KEY) {
    if (!text || !text.trim() || !apiKey) return null;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "models/text-embedding-004",
                    content: {
                        parts: [{ text: text.trim().slice(0, 4000) }],
                    },
                }),
            }
        );

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.warn("Failed to get embedding from Gemini:", err);
            return null;
        }

        const data = await res.json();
        return data.embedding?.values || null;
    } catch (e) {
        console.warn("Exception generating embedding:", e);
        return null;
    }
}

// Batch embed multiple texts (up to 100 per request)
export async function getBatchEmbeddings(texts = [], apiKey = process.env.GEMINI_API_KEY) {
    if (!texts.length || !apiKey) return [];

    const results = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const chunk = texts.slice(i, i + BATCH_SIZE);

        try {
            const requests = chunk.map((t) => ({
                model: "models/text-embedding-004",
                content: {
                    parts: [{ text: (t || "").trim().slice(0, 4000) }],
                },
            }));

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ requests }),
                }
            );

            if (res.ok) {
                const data = await res.json();
                const embeddings = (data.embeddings || []).map((e) => e?.values || null);
                results.push(...embeddings);
            } else {
                // Fallback to one-by-one or nulls
                console.warn(`Batch embedding chunk ${i} failed, skipping chunk embeddings`);
                for (let j = 0; j < chunk.length; j++) {
                    results.push(null);
                }
            }
        } catch (e) {
            console.warn(`Exception in batch embeddings at chunk ${i}:`, e);
            for (let j = 0; j < chunk.length; j++) {
                results.push(null);
            }
        }
    }

    return results;
}

// Fast in-memory cosine similarity calculation
export function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
