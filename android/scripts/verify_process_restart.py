#!/usr/bin/env python3
"""Android 16 emulator: verify local Memos data across force-stop and relaunch.

Development-only acceptance. A force-stop is not arbitrary crash-atomicity,
physical-device, backup/restore, synchronization or Stable qualification.
Only the disposable CI Development application's sandbox is cleared.
"""
from __future__ import annotations

import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

PACKAGE = "com.goreecloud.memos.development"
ACTIVITY = f"{PACKAGE}/com.goreecloud.memos.MainActivity"
APK_DIR = Path("android/app/build/outputs/apk/debug")
TITLE = "ForceStopTestTitle"
BODY = "ForceStopTestBody"
UI_DUMP = "/sdcard/goreecloud-memos-acceptance-window.xml"


def adb(*args: str, check: bool = True) -> str:
    completed = subprocess.run(
        ["adb", *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=60,
        check=False,
    )
    if check and completed.returncode:
        # Never print raw UI or arbitrary device logs.
        raise RuntimeError(f"adb {args[0]} exited {completed.returncode}")
    return completed.stdout.strip()


def ui_nodes() -> list[ET.Element]:
    adb("shell", "uiautomator", "dump", UI_DUMP)
    data = adb("exec-out", "cat", UI_DUMP)
    return list(ET.fromstring(data).iter("node"))


def find_by_description(nodes: list[ET.Element], description: str) -> ET.Element | None:
    return next((n for n in nodes if n.get("content-desc") == description), None)


def find_text(nodes: list[ET.Element], value: str) -> bool:
    return any(n.get("text") == value for n in nodes)


def wait_for(
    description: str, timeout_seconds: float = 35.0, *, scroll: bool = False
) -> ET.Element:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        node = find_by_description(ui_nodes(), description)
        if node is not None:
            return node
        if scroll:
            # Only scroll the app's workspace; do not press Back on a fresh launch.
            scroll_toward_saved()
        time.sleep(1)
    raise AssertionError(f"Expected control not visible: {description}")


def center(node: ET.Element) -> tuple[int, int]:
    bounds = node.get("bounds") or ""
    match = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
    if match is None:
        raise AssertionError("UI control has no usable display bounds")
    x1, y1, x2, y2 = (int(x) for x in match.groups())
    if x1 >= x2 or y1 >= y2:
        raise AssertionError("UI control bounds are empty")
    return ((x1 + x2) // 2, (y1 + y2) // 2)


def tap(node: ET.Element) -> None:
    x, y = center(node)
    adb("shell", "input", "tap", str(x), str(y))


def check_editors(title: str, body: str) -> bool:
    nodes = ui_nodes()
    title_node = find_by_description(nodes, "Memo title")
    body_node = find_by_description(nodes, "Memo body")
    return (
        title_node is not None
        and body_node is not None
        and title_node.get("text") == title
        and body_node.get("text") == body
        and find_by_description(nodes, "Local only. Synchronization is not configured.") is not None
    )


def wait_for_editors(title: str, body: str) -> None:
    deadline = time.monotonic() + 35
    while time.monotonic() < deadline:
        if check_editors(title, body):
            return
        time.sleep(1)
    raise AssertionError("The local draft or local-only status did not survive restart")


def wait_for_draft_cleared() -> None:
    # UIAutomator may report EditText hints instead of empty text.
    deadline = time.monotonic() + 35
    while time.monotonic() < deadline:
        nodes = ui_nodes()
        title_node = find_by_description(nodes, "Memo title")
        body_node = find_by_description(nodes, "Memo body")
        if (
            title_node is not None
            and body_node is not None
            and title_node.get("text") != TITLE
            and body_node.get("text") != BODY
        ):
            return
        time.sleep(1)
    raise AssertionError("The composer did not clear after saving")


def process_id() -> str:
    pid = adb("shell", "pidof", PACKAGE, check=False).strip()
    if not pid:
        raise AssertionError("Development application process did not start")
    return pid


def force_stop(old_pid: str) -> None:
    adb("shell", "am", "force-stop", PACKAGE)
    for _ in range(20):
        if not adb("shell", "pidof", PACKAGE, check=False).strip():
            return
        time.sleep(0.25)
    raise AssertionError(f"Application process remained live after force-stop ({bool(old_pid)})")


def launch() -> str:
    adb("shell", "am", "start", "-W", "-n", ACTIVITY)
    wait_for("Memo title")
    return process_id()


def scroll_toward_saved() -> None:
    output = adb("shell", "wm", "size")
    match = re.search(r"(\d+)x(\d+)", output)
    if match is None:
        raise AssertionError("Cannot determine emulator display size")
    width, height = map(int, match.groups())
    x = width // 2
    adb("shell", "input", "swipe", str(x), str(height * 4 // 5), str(x), str(height // 4), "350")


def wait_for_saved_card() -> None:
    deadline = time.monotonic() + 40
    while time.monotonic() < deadline:
        nodes = ui_nodes()
        if find_text(nodes, TITLE) and find_text(nodes, BODY):
            return
        scroll_toward_saved()
        time.sleep(1)
    raise AssertionError("The locally saved memo was not visible after process restart")


def main() -> None:
    matches = sorted(APK_DIR.glob("*.apk"))
    if len(matches) != 1:
        raise AssertionError("Expected exactly one Development APK to install")
    adb("install", "-r", str(matches[0]))
    adb("shell", "pm", "clear", PACKAGE)
    adb("shell", "wm", "dismiss-keyguard", check=False)

    original_pid = launch()
    tap(wait_for("Memo title"))
    adb("shell", "input", "text", TITLE)
    tap(wait_for("Memo body"))
    adb("shell", "input", "text", BODY)
    adb("shell", "input", "keyevent", "KEYCODE_BACK")
    wait_for_editors(TITLE, BODY)

    force_stop(original_pid)
    restored_pid = launch()
    if restored_pid == original_pid:
        raise AssertionError("A fresh application process was not observed")
    wait_for_editors(TITLE, BODY)
    print("PASS: local draft and local-only status survived force-stop/relaunch")

    # The IME may already be closed after a fresh launch; an unconditional Back
    # can leave the app instead of revealing the Save control.
    tap(wait_for("Save memo locally", scroll=True))
    wait_for_draft_cleared()
    wait_for_saved_card()
    force_stop(restored_pid)
    second_pid = launch()
    if second_pid == restored_pid:
        raise AssertionError("A fresh process was not observed for the saved-memo restart")
    wait_for_draft_cleared()
    wait_for_saved_card()
    print("PASS: locally saved memo survived a second force-stop/relaunch")
    print("EVIDENCE: disposable emulator only; not crash, backup or physical-device acceptance")


if __name__ == "__main__":
    main()
