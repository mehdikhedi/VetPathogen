"""Alignment utilities for comparing sequences."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from Bio.Align import PairwiseAligner


@dataclass
class AlignmentResult:
    score: float
    identity: float
    coverage: float
    alignment_length: int


def _compute_identity(alignment) -> tuple[float, int]:
    seq_a, seq_b, score, _, _ = alignment
    matches = sum(1 for a, b in zip(seq_a, seq_b) if a == b and a != "-" and b != "-")
    alignment_length = max(len(seq_a.replace("-", "")), len(seq_b.replace("-", "")))
    if alignment_length == 0:
        return 0.0, 0
    identity = (matches / alignment_length) * 100
    return identity, alignment_length


def align_sequences(seq_a: str, seq_b: str) -> AlignmentResult:
    """
    Align two sequences and derive simple alignment metrics.

    Uses Biopython's globalxx (match=1, mismatch=0) as a lightweight stand-in. In production,
    replace this with BLAST/MMseqs2 wrappers and populate the same metrics.
    """

    if not seq_a or not seq_b:
        return AlignmentResult(score=0.0, identity=0.0, coverage=0.0, alignment_length=0)

    aligner = PairwiseAligner()
    aligner.mode = "global"
    aligner.match_score = 1
    aligner.mismatch_score = 0
    aligner.open_gap_score = -1
    aligner.extend_gap_score = -0.5

    alignments = aligner.align(seq_a.upper(), seq_b.upper())
    alignment = alignments[0]
    # Convert to strings similar to pairwise2 output
    seq_a_aligned = alignment.aligned[0]
    seq_b_aligned = alignment.aligned[1]
    # Build strings for identity computation
    a_str = []
    b_str = []
    idx_a = 0
    idx_b = 0
    for (start_a, end_a), (start_b, end_b) in zip(seq_a_aligned, seq_b_aligned):
        # Add gaps if needed
        if start_a > idx_a:
            a_str.append(seq_a[idx_a:start_a])
            b_str.append("-" * (start_a - idx_a))
        if start_b > idx_b:
            b_str.append(seq_b[idx_b:start_b])
            a_str.append("-" * (start_b - idx_b))
        a_str.append(seq_a[start_a:end_a])
        b_str.append(seq_b[start_b:end_b])
        idx_a = end_a
        idx_b = end_b
    a_str.append(seq_a[idx_a:])
    b_str.append("-" * (len(seq_a) - idx_a))
    b_str.append(seq_b[idx_b:])
    a_full = "".join(a_str)
    b_full = "".join(b_str)
    identity, alignment_length = _compute_identity((a_full, b_full, alignment.score, None, None))
    score = alignment.score

    coverage = 0.0
    if len(seq_b) > 0:
        coverage = min(100.0, (alignment_length / len(seq_b)) * 100)

    return AlignmentResult(
        score=score,
        identity=round(identity, 2),
        coverage=round(coverage, 2),
        alignment_length=alignment_length,
    )


def best_match(sequence: str, reference_records: Iterable[tuple[str, str]]) -> tuple[str, AlignmentResult]:
    """
    Return the reference entry with the highest identity to the sequence.

    reference_records should yield (label, sequence) pairs.
    """

    best_label = ""
    best_alignment = AlignmentResult(score=0.0, identity=0.0, coverage=0.0, alignment_length=0)
    for label, ref_sequence in reference_records:
        result = align_sequences(sequence, ref_sequence)
        if result.identity > best_alignment.identity or (
            result.identity == best_alignment.identity and result.score > best_alignment.score
        ):
            best_label = label
            best_alignment = result
    return best_label, best_alignment
