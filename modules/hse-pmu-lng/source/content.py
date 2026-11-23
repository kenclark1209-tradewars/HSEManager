# -*- coding: utf-8 -*-
"""Data module. Structured source of truth: content.json."""
import json
from pathlib import Path
_DATA = json.loads((Path(__file__).parent / "content.json").read_text(encoding="utf-8"))
PHASES = _DATA["phases"]
SOURCES = _DATA["sources"]
GATES = _DATA["gates"]
TASKS = _DATA["tasks"]
RACI = _DATA["raci"]
TEMPLATES = _DATA["templates"]
SCENARIOS = _DATA["scenarios"]
INTERVIEW = _DATA["interview"]
GLOSSARY = _DATA["glossary"]
