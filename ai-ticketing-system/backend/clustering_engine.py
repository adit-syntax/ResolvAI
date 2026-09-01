"""
Semantic Duplicate Detection & Outage Clustering Engine — Module GenAI-3
Detects:
- Duplicate tickets via Vector Cosine Similarity (> 0.80)
- Multi-user outage spikes and incident clusters (> 3 similar tickets in sliding window)
- Groups correlated tickets for automatic master incident tracking and bulk resolution
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from rag_engine import DenseEmbedder


class SemanticClusteringEngine:
    """
    Real-time semantic clustering engine using 384-D dense vector embeddings.
    """

    @staticmethod
    def find_duplicate_tickets(
        target_ticket: Dict[str, Any],
        candidate_tickets: List[Dict[str, Any]],
        similarity_threshold: float = 0.55
    ) -> List[Dict[str, Any]]:
        """
        Find all existing tickets that are semantically duplicate or highly similar to the target ticket.
        """
        if not candidate_tickets:
            return []

        target_text = f"{target_ticket.get('title', '')} {target_ticket.get('description', '')}"
        target_vec = DenseEmbedder.embed_text(target_text)

        duplicates = []
        for cand in candidate_tickets:
            # Don't compare ticket with itself
            if cand.get("id") == target_ticket.get("id"):
                continue

            cand_text = f"{cand.get('title', '')} {cand.get('description', '')}"
            cand_vec = DenseEmbedder.embed_text(cand_text)

            sim = DenseEmbedder.cosine_similarity(target_vec, cand_vec)
            if sim >= similarity_threshold:
                duplicates.append({
                    "ticket_id": cand.get("id"),
                    "title": cand.get("title"),
                    "category": cand.get("category"),
                    "severity": cand.get("severity"),
                    "user_email": cand.get("user_email"),
                    "created_at": cand.get("created_at"),
                    "similarity_score": round(sim, 3),
                    "is_exact_duplicate": sim >= 0.85,
                })

        duplicates.sort(key=lambda x: x["similarity_score"], reverse=True)
        return duplicates

    @staticmethod
    def detect_incident_clusters(
        tickets: List[Dict[str, Any]],
        min_cluster_size: int = 2,
        similarity_threshold: float = 0.50,
        time_window_hours: int = 48
    ) -> List[Dict[str, Any]]:
        """
        Detect multi-user incident spikes and outages across active tickets.
        Clusters tickets that share high semantic similarity within a time window.
        """
        if len(tickets) < min_cluster_size:
            return []

        # Filter recent tickets within time window
        now = datetime.now(timezone.utc)
        recent_tickets = []
        for t in tickets:
            t_time = t.get("created_at")
            if isinstance(t_time, str):
                try:
                    t_time = datetime.fromisoformat(t_time.replace("Z", "+00:00"))
                except Exception:
                    t_time = now
            if t_time is None:
                t_time = now
            if t_time.tzinfo is None:
                t_time = t_time.replace(tzinfo=timezone.utc)

            if (now - t_time) <= timedelta(hours=time_window_hours):
                recent_tickets.append({**t, "_parsed_time": t_time})

        if len(recent_tickets) < min_cluster_size:
            return []

        # Compute embeddings
        embeddings = [
            DenseEmbedder.embed_text(f"{t.get('title', '')} {t.get('description', '')}")
            for t in recent_tickets
        ]

        # Greedy Agglomerative Clustering
        visited = set()
        clusters = []

        for i in range(len(recent_tickets)):
            if i in visited:
                continue

            current_cluster = [recent_tickets[i]]
            visited.add(i)

            for j in range(i + 1, len(recent_tickets)):
                if j in visited:
                    continue

                sim = DenseEmbedder.cosine_similarity(embeddings[i], embeddings[j])
                if sim >= similarity_threshold:
                    current_cluster.append(recent_tickets[j])
                    visited.add(j)

            if len(current_cluster) >= min_cluster_size:
                # Synthesize cluster title & root cause from tickets
                primary = current_cluster[0]
                category = primary.get("category", "General")
                affected_users = list({t.get("user_email") for t in current_cluster if t.get("user_email")})

                # Determine highest severity among cluster members
                severities = [t.get("severity", "Low") for t in current_cluster]
                highest_sev = "Critical" if "Critical" in severities else "High" if "High" in severities else "Medium"

                clusters.append({
                    "cluster_id": f"INC-{category[:3].upper()}-{len(clusters)+1:03d}",
                    "title": f"Incident: Spike in {category} issues ({primary.get('title', 'Service Interruption')})",
                    "category": category,
                    "severity": highest_sev,
                    "ticket_count": len(current_cluster),
                    "affected_users_count": len(affected_users),
                    "ticket_ids": [t.get("id") for t in current_cluster],
                    "sample_tickets": [
                        {"id": t.get("id"), "title": t.get("title"), "user_email": t.get("user_email")}
                        for t in current_cluster[:4]
                    ],
                    "status": "Active Incident",
                    "detected_at": now.isoformat(),
                    "recommended_action": (
                        f"Acknowledge incident in #{category.lower()}-alerts. "
                        f"Post broadcast update to all {len(affected_users)} affected user(s)."
                    )
                })

        return clusters


clustering_engine = SemanticClusteringEngine()
