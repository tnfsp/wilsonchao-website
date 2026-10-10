#!/usr/bin/env python3
"""sync-now-dynamic.py must run on /usr/bin/python3 (3.9) — launchd's stream-sync uses it.

2026-09-15 → 10-10: `str | None` annotations crashed it on 3.9 and stranded posts 441–444.
Run: /usr/bin/python3 apps/main/scripts/tests/test_sync_now_dynamic.py
"""
from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "sync-now-dynamic.py"
PY39 = "/usr/bin/python3"


class SyncNowDynamicTests(unittest.TestCase):
    def test_runs_on_system_python_with_explicit_paths(self):
        if not Path(PY39).exists():
            self.skipTest("no /usr/bin/python3")
        with tempfile.TemporaryDirectory() as d:
            stream = Path(d) / "stream.json"
            now = Path(d) / "now.json"
            today = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
            stream.write_text(json.dumps([
                {"id": "444", "text": "🎵 Chill音樂 Freak #music https://www.youtube.com/watch?v=eraOV3BzNX8",
                 "pubDate": today, "tags": ["music"], "link": "https://t.me/doctormomo/444"},
                {"id": "441", "title": "", "text": "", "pubDate": today, "tags": [],
                 "images": ["/stream-media/441-1.jpg"]},
            ], ensure_ascii=False))
            now.write_text(json.dumps({"sections": [{"keep": True}]}))
            r = subprocess.run([PY39, str(SCRIPT), "--stream", str(stream), "--now", str(now)],
                               capture_output=True, text=True,
                               env={"PATH": "/usr/bin:/bin", "PYTHONDONTWRITEBYTECODE": "1"})
            self.assertEqual(r.returncode, 0, r.stderr)
            out = json.loads(now.read_text())
            self.assertEqual(out["sections"], [{"keep": True}])
            self.assertEqual([i["streamId"] for i in out["dynamic"]["music"]], ["444"])
            self.assertEqual(out["dynamic"]["music"][0]["youtubeId"], "eraOV3BzNX8")


if __name__ == "__main__":
    unittest.main(verbosity=2)
