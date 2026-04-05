"""Tests for the task processor module."""
import json
import pytest
from processor import process_task, process_uppercase, process_lowercase, process_reverse, process_word_count


class TestProcessUppercase:
    def test_basic(self):
        assert process_uppercase("hello world") == "HELLO WORLD"

    def test_mixed_case(self):
        assert process_uppercase("Hello World") == "HELLO WORLD"

    def test_already_uppercase(self):
        assert process_uppercase("HELLO") == "HELLO"

    def test_empty_string(self):
        assert process_uppercase("") == ""

    def test_numbers_unchanged(self):
        assert process_uppercase("abc 123") == "ABC 123"


class TestProcessLowercase:
    def test_basic(self):
        assert process_lowercase("HELLO WORLD") == "hello world"

    def test_mixed_case(self):
        assert process_lowercase("Hello World") == "hello world"

    def test_empty_string(self):
        assert process_lowercase("") == ""


class TestProcessReverse:
    def test_basic(self):
        assert process_reverse("hello") == "olleh"

    def test_sentence(self):
        assert process_reverse("hello world") == "dlrow olleh"

    def test_palindrome(self):
        assert process_reverse("racecar") == "racecar"

    def test_empty_string(self):
        assert process_reverse("") == ""

    def test_single_char(self):
        assert process_reverse("a") == "a"


class TestProcessWordCount:
    def test_basic(self):
        result = json.loads(process_word_count("hello world"))
        assert result["word_count"] == 2
        assert result["character_count"] == 11

    def test_empty_string(self):
        result = json.loads(process_word_count(""))
        assert result["word_count"] == 0
        assert result["character_count"] == 0

    def test_multiline(self):
        result = json.loads(process_word_count("line one\nline two"))
        assert result["line_count"] == 2
        assert result["word_count"] == 4

    def test_unique_words(self):
        result = json.loads(process_word_count("the cat sat on the mat"))
        assert result["word_count"] == 6
        assert result["unique_word_count"] == 5  # 'the' appears twice

    def test_returns_json_string(self):
        result = process_word_count("test")
        assert isinstance(result, str)
        parsed = json.loads(result)
        assert "word_count" in parsed


class TestProcessTask:
    def test_dispatch_uppercase(self):
        assert process_task("uppercase", "hello") == "HELLO"

    def test_dispatch_lowercase(self):
        assert process_task("lowercase", "HELLO") == "hello"

    def test_dispatch_reverse(self):
        assert process_task("reverse", "abc") == "cba"

    def test_dispatch_word_count(self):
        result = process_task("word_count", "one two three")
        parsed = json.loads(result)
        assert parsed["word_count"] == 3

    def test_unknown_operation_raises(self):
        with pytest.raises(ValueError, match="Unknown operation"):
            process_task("fly_to_moon", "text")
