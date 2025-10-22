"""Utilities for loading FASTA sequences and computing simple metrics."""

from __future__ import annotations

from io import StringIO
from pathlib import Path
from typing import Iterable, TextIO

from Bio import SeqIO


def _open_fasta_source(source: str | Path | TextIO) -> Iterable:
    """Return an iterable of SeqRecord objects from a path or in-memory handle."""

    if isinstance(source, (str, Path)):
        return SeqIO.parse(str(source), "fasta")
    if hasattr(source, "read"):
        source.seek(0)
        return SeqIO.parse(source, "fasta")
    raise TypeError("Unsupported FASTA source type.")


def compute_gc_content(sequence: str) -> float:
    """Return GC% for a DNA sequence."""

    seq = sequence.upper()
    if not seq:
        return 0.0
    gc = sum(1 for base in seq if base in {"G", "C"})
    return round((gc / len(seq)) * 100, 2)


def qc_check_sequence(sequence: str, *, min_length: int = 50, max_ambiguous: int = 5) -> dict[str, object]:
    """
    Perform basic quality checks on a sequence.

    Returns a dictionary with flags that downstream modules can log or act upon.
    """

    seq = sequence.upper()
    length = len(seq)
    ambiguous = seq.count("N")
    flags: list[str] = []

    if length < min_length:
        flags.append("too_short")
    if ambiguous > max_ambiguous:
        flags.append("high_ambiguous_content")

    return {
        "length": length,
        "ambiguous": ambiguous,
        "qc_flags": flags,
    }


def load_sequences(source: str | Path | TextIO) -> list[dict[str, object]]:
    """
    Load sequences from FASTA into a list of dicts with QC metrics.

    Parameters
    ----------
    source:
        Path to a FASTA file or a text IO handle containing FASTA content.
    """

    records: list[dict[str, object]] = []
    for record in _open_fasta_source(source):
        sequence = str(record.seq).upper()
        qc = qc_check_sequence(sequence)
        records.append(
            {
                "id": record.id,
                "sequence": sequence,
                "gc_content": compute_gc_content(sequence),
                **qc,
            }
        )
    return records


def load_sequences_from_string(data: str) -> list[dict[str, str | float]]:
    """Convenience helper for FASTA data provided as a raw string."""

    return load_sequences(StringIO(data))
