"""
Task Processor — Pure functions for each supported operation.

Each function takes a string input and returns a string result.
Keeping these pure makes them trivially testable and easy to extend.

Supported operations:
  - uppercase    : Convert text to UPPERCASE
  - lowercase    : Convert text to lowercase
  - reverse      : Reverse the entire string
  - word_count   : Count words, characters, and lines (returns summary JSON)
"""

import json


def process_task(operation: str, input_text: str) -> str:
    """
    Dispatch to the correct processor based on operation name.
    Raises ValueError for unknown operations.
    """
    processors = {
        "uppercase": process_uppercase,
        "lowercase": process_lowercase,
        "reverse": process_reverse,
        "word_count": process_word_count,
    }

    processor = processors.get(operation)
    if not processor:
        raise ValueError(
            f"Unknown operation: '{operation}'. "
            f"Supported: {', '.join(processors.keys())}"
        )

    return processor(input_text)


def process_uppercase(text: str) -> str:
    """Convert all characters to uppercase."""
    return text.upper()


def process_lowercase(text: str) -> str:
    """Convert all characters to lowercase."""
    return text.lower()


def process_reverse(text: str) -> str:
    """Reverse the entire input string (character by character)."""
    return text[::-1]


def process_word_count(text: str) -> str:
    """
    Return a JSON summary with word count, character count,
    character count excluding spaces, line count, and unique words.
    """
    words = text.split()
    lines = text.splitlines()
    unique_words = set(w.lower().strip(".,!?;:'\"") for w in words)

    summary = {
        "word_count": len(words),
        "character_count": len(text),
        "character_count_no_spaces": len(text.replace(" ", "")),
        "line_count": len(lines) if lines else 0,
        "unique_word_count": len(unique_words),
        "average_word_length": (
            round(sum(len(w) for w in words) / len(words), 2) if words else 0
        ),
    }

    return json.dumps(summary, indent=2)
