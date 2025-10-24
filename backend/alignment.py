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


def _compute_identity(alignment_tuple) -> tuple[float, int]:
    seq_a, seq_b, score, _, _ = alignment_tuple
    matches = sum(1 for a, b in zip(seq_a, seq_b) if a == b and a != "-" and b != "-")
    alignment_length = max(len(seq_a.replace("-", "")), len(seq_b.replace("-", "")))
    if alignment_length == 0:
        return 0.0, 0
    identity = (matches / alignment_length) * 100
    return identity, alignment_length


def _build_aligned_strings(alignment, seq_a: str, seq_b: str) -> tuple[str, str]:
    coords_a = alignment.aligned[0]
    coords_b = alignment.aligned[1]
    pieces_a: list[str] = []
    pieces_b: list[str] = []
    pos_a = 0
    pos_b = 0
    for (start_a, end_a), (start_b, end_b) in zip(coords_a, coords_b):
        if start_a > pos_a:
            pieces_a.append(seq_a[pos_a:start_a])
            pieces_b.append("-" * (start_a - pos_a))
        if start_b > pos_b:
            pieces_b.append(seq_b[pos_b:start_b])
            pieces_a.append("-" * (start_b - pos_b))
        pieces_a.append(seq_a[start_a:end_a])
        pieces_b.append(seq_b[start_b:end_b])
        pos_a = end_a
        pos_b = end_b
    if pos_a < len(seq_a):
        pieces_a.append(seq_a[pos_a:])
        pieces_b.append("-" * (len(seq_a) - pos_a))
    if pos_b < len(seq_b):
        pieces_b.append(seq_b[pos_b:])
        pieces_a.append("-" * (len(seq_b) - pos_b))
    aligned_a = "".join(pieces_a)
    aligned_b = "".join(pieces_b)
    return aligned_a, aligned_b


def align_sequences(seq_a: str, seq_b: str) -> AlignmentResult:
    """Align two sequences and derive simple alignment metrics."""

    if not seq_a or not seq_b:
        return AlignmentResult(score=0.0, identity=0.0, coverage=0.0, alignment_length=0)

    aligner = PairwiseAligner()
    aligner.mode = "global"
    aligner.match_score = 1
    aligner.mismatch_score = 0
    aligner.open_gap_score = -1
    aligner.extend_gap_score = -0.5

    alignment = aligner.align(seq_a.upper(), seq_b.upper())[0]
    aligned_a, aligned_b = _build_aligned_strings(alignment, seq_a.upper(), seq_b.upper())
    identity, alignment_length = _compute_identity((aligned_a, aligned_b, alignment.score, None, None))
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
