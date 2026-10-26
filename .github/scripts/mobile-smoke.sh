#!/usr/bin/env bash
set -euo pipefail

report_dir=reports/mobile
mkdir -p "$report_dir"

capture_final_evidence() {
  local result=$?
  trap - EXIT
  set +e

  timeout 15s adb exec-out screencap -p > "$report_dir/home.png"
  timeout 15s adb shell dumpsys activity activities > "$report_dir/activities.txt"
  timeout 15s adb shell dumpsys window windows > "$report_dir/windows.txt"
  timeout 15s adb logcat -d -t 300 -v time > "$report_dir/logcat-tail.txt"
  if [[ -s "$report_dir/home-window.xml" ]]; then
    cp "$report_dir/home-window.xml" "$report_dir/final-window.xml"
  elif timeout 15s adb shell uiautomator dump /sdcard/window-final.xml >/dev/null 2>&1; then
    timeout 10s adb pull /sdcard/window-final.xml "$report_dir/final-window.xml" >/dev/null
  fi

  if (( result == 0 )); then
    for evidence in home.png activities.txt windows.txt logcat-tail.txt final-window.xml; do
      if [[ ! -s "$report_dir/$evidence" ]]; then
        echo "::error::Missing final mobile evidence: $evidence"
        result=1
      fi
    done
  fi
  exit "$result"
}
trap capture_final_evidence EXIT

classify_window() {
  python3 - "$1" <<'PY'
import sys
import xml.etree.ElementTree as ET

nodes = list(ET.parse(sys.argv[1]).getroot().iter("node"))
if any(
    node.get("resource-id") == "android:id/alertTitle"
    and node.get("text") == "Pixel Launcher isn't responding"
    for node in nodes
):
    print("anr")
elif any(
    node.get("content-desc") == "Home-screen"
    or "Demo app for the appium-boilerplate" in node.get("text", "")
    for node in nodes
):
    print("home")
else:
    print("other")
PY
}

tap_anr_close_once() {
  cp "$report_dir/home-window.xml" "$report_dir/launcher-anr.xml"
  timeout 15s adb exec-out screencap -p > "$report_dir/launcher-anr.png"
  timeout 15s adb shell dumpsys activity activities > "$report_dir/launcher-anr-activities.txt"
  timeout 15s adb logcat -d -t 300 -v time > "$report_dir/launcher-anr-logcat.txt"

  local target resource_id x y
  target=$(python3 - "$report_dir/launcher-anr.xml" <<'PY'
import re
import sys
import xml.etree.ElementTree as ET

targets = []
for node in ET.parse(sys.argv[1]).getroot().iter("node"):
    if node.get("resource-id") != "android:id/aerr_close":
        continue
    resource_id = node.get("resource-id", "")
    bounds = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.get("bounds", ""))
    if not resource_id or bounds is None:
        continue
    left, top, right, bottom = map(int, bounds.groups())
    if right > left and bottom > top:
        targets.append((resource_id, (left + right) // 2, (top + bottom) // 2))

if len(targets) != 1:
    raise SystemExit(f"Expected one Close app button with resource-id and bounds; found {len(targets)}")
print(*targets[0])
PY
  )
  read -r resource_id x y <<< "$target"
  printf 'resource-id=%s bounds-center=%s,%s\n' "$resource_id" "$x" "$y" > "$report_dir/launcher-anr-close-target.txt"
  echo "Pixel Launcher ANR detected; selecting Close app ($resource_id) once."
  adb shell input tap "$x" "$y"
}

adb devices -l | tee "$report_dir/adb-devices.txt"
adb shell getprop ro.build.version.sdk | tee "$report_dir/android-api-level.txt"
adb install -r "$APK_PATH"
adb shell pm path com.wdiodemoapp | tee "$report_dir/package-path.txt"
grep -q '^package:' "$report_dir/package-path.txt"
adb shell am start -W -n com.wdiodemoapp/.MainActivity | tee "$report_dir/activity-start.txt"

anr_handled=0
last_state=unknown
deadline=$((SECONDS + 60))
while (( SECONDS < deadline )); do
  if timeout 15s adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 &&
     timeout 10s adb pull /sdcard/window.xml "$report_dir/home-window.xml" >/dev/null 2>&1; then
    if state=$(classify_window "$report_dir/home-window.xml"); then
      last_state=$state
      if [[ "$state" == home ]]; then
        echo 'Home UI found in the Android hierarchy.'
        exit 0
      fi
      if [[ "$state" == anr && "$anr_handled" -eq 0 ]]; then
        anr_handled=1
        tap_anr_close_once
        deadline=$((SECONDS + 60))
      fi
    fi
  fi
  sleep 2
done

echo "::error::Home UI did not appear within the bounded polling period (last state: $last_state; ANR handled: $anr_handled)."
exit 1
