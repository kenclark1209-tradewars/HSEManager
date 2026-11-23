# -*- coding: utf-8 -*-
"""Rebuild the standalone offline HTML from source/template.html and source/content.json."""
import json
from pathlib import Path

here = Path(__file__).resolve().parent
data = json.loads((here / "content.json").read_text(encoding="utf-8"))
template = (here / "template.html").read_text(encoding="utf-8")
if template.count("__DATA__") != 1:
    raise RuntimeError("Template must contain exactly one __DATA__ placeholder")
raw = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
out = here.parent / "index.html"
out.write_text(template.replace("__DATA__", raw), encoding="utf-8")
print("Generated", out, "with", len(data["tasks"]), "procedures and", len(data["sources"]), "sources")
