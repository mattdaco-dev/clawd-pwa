#!/usr/bin/env python3
"""Register the clawd-pwa hook in ~/.claude/settings.json (--uninstall removes it).

Idempotent, and backs up settings.json next to it before writing.
"""
import json
import shutil
import sys
import time
from pathlib import Path

SETTINGS = Path.home() / ".claude" / "settings.json"
HOOK = str(Path(__file__).resolve().parent.parent / "hooks" / "clawd-hook.sh")
TOOL_EVENTS = ["PreToolUse", "PostToolUse", "PostToolUseFailure", "PermissionRequest"]
OTHER_EVENTS = [
    "SessionStart", "SessionEnd", "UserPromptSubmit", "Notification",
    "Stop", "StopFailure", "SubagentStart", "SubagentStop",
]


def is_ours(group):
    return any(h.get("command") == HOOK for h in group.get("hooks", []))


def main():
    uninstall = "--uninstall" in sys.argv
    settings = json.loads(SETTINGS.read_text())
    backup = SETTINGS.with_name(f"settings.json.bak-clawd-{time.strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(SETTINGS, backup)

    hooks = settings.setdefault("hooks", {})
    for event in TOOL_EVENTS + OTHER_EVENTS:
        groups = [g for g in hooks.get(event, []) if not is_ours(g)]
        if not uninstall:
            group = {"hooks": [{"type": "command", "command": HOOK, "timeout": 5}]}
            if event in TOOL_EVENTS:
                group = {"matcher": "*", **group}
            groups.append(group)
        if groups:
            hooks[event] = groups
        else:
            hooks.pop(event, None)

    SETTINGS.write_text(json.dumps(settings, indent=2, ensure_ascii=False) + "\n")
    print(f"{'removed' if uninstall else 'installed'}: {HOOK}")
    print(f"backup: {backup}")


if __name__ == "__main__":
    main()
