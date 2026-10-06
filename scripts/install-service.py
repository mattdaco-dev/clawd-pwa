#!/usr/bin/env python3
"""Run server.js as a launchd agent: starts at login, restarts if it dies.

--uninstall stops it and removes the plist. The node path is resolved now and
written as an absolute path (launchd does not see nvm), so rerun this script
after switching Node versions.
"""
import os
import plistlib
import shutil
import subprocess
import sys
from pathlib import Path

LABEL = "local.clawd-pwa"
ROOT = Path(__file__).resolve().parent.parent
PLIST = Path.home() / "Library" / "LaunchAgents" / f"{LABEL}.plist"
DOMAIN = f"gui/{os.getuid()}"


def launchctl(*args):
    return subprocess.run(["launchctl", *args], capture_output=True, text=True)


def main():
    launchctl("bootout", f"{DOMAIN}/{LABEL}")  # ignore "not loaded"
    if "--uninstall" in sys.argv:
        PLIST.unlink(missing_ok=True)
        print(f"removed: {PLIST}")
        return

    node = shutil.which("node")
    if not node:
        sys.exit("node not found in PATH")
    log = ROOT / "logs" / "server.log"
    log.parent.mkdir(exist_ok=True)

    PLIST.parent.mkdir(parents=True, exist_ok=True)
    with PLIST.open("wb") as f:
        plistlib.dump({
            "Label": LABEL,
            "ProgramArguments": [str(Path(node).resolve()), str(ROOT / "server.js")],
            "WorkingDirectory": str(ROOT),
            "RunAtLoad": True,
            "KeepAlive": True,
            "StandardOutPath": str(log),
            "StandardErrorPath": str(log),
        }, f)

    result = launchctl("bootstrap", DOMAIN, str(PLIST))
    if result.returncode:
        sys.exit(f"launchctl bootstrap failed: {result.stderr.strip()}")
    print(f"installed: {PLIST}")
    print(f"node: {node}")


if __name__ == "__main__":
    main()
