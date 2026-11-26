#!/usr/bin/env bash
# Screenshots of the screen that is open on the emulator in four conditions (CLAUDE.md "Layout rule").
# Needs the debug build served by `EXPO_PUBLIC_ALLOW_SCREENSHOTS=1 npx expo start --clear`,
# otherwise FLAG_SECURE makes every shot black. Usage: scripts/layout-shots.sh <output-dir>
set -euo pipefail
out="${1:?output directory}"
mkdir -p "$out"

shot() { sleep 4; adb exec-out screencap -p > "$out/$1.png"; echo "$out/$1.png"; }
restore() {
	adb shell wm size reset
	adb shell wm density reset
	adb shell settings put system font_scale 1.0
	adb shell cmd uimode night no
}
trap restore EXIT

shot default
adb shell cmd uimode night yes
adb shell settings put system font_scale 1.6
shot dark-font-1.6
adb shell cmd uimode night no
adb shell settings put system font_scale 1.0
adb shell wm size 720x1280
adb shell wm density 320
shot small-720x1280
adb shell wm size 1600x2560
adb shell wm density 320
shot wide-1600x2560
