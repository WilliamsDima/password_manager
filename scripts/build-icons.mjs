// Draws the app icon, the Android adaptive icon layers and the splash images (task 6.5).
// Usage: npm run icons   (rewrites the PNG files in assets/ from the SVG below)
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const out = path.join(root, "assets")

const BLUE_FROM = "#3A66F0"
const BLUE_TO = "#1B3FB8"
const SPLASH_LIGHT = "#2C57E0" // = theme primary, light
const SPLASH_DARK = "#86A2FF" // = theme primary, dark

// A shield with a keyhole cut out, drawn on a 1024 x 1024 canvas. The keyhole is a circle and a slot
// that overlap: a mask cuts their union, so there is no seam where they meet.
const SHIELD = "M512 120 L832 240 V500 C832 700 700 860 512 920 C324 860 192 700 192 500 V240 Z"
const KEYHOLE_CIRCLE = "M512 380 a76 76 0 1 0 0.01 0 Z"
const KEYHOLE_SLOT = "M478 480 H546 L566 700 H458 Z"

/** The glyph scaled around the canvas center (safe zone of adaptive icons is the inner 66%). */
const glyph = (scale, fill) =>
	`<defs><mask id="keyhole" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">` +
	`<rect width="1024" height="1024" fill="#fff"/>` +
	`<path d="${KEYHOLE_CIRCLE}" fill="#000"/><path d="${KEYHOLE_SLOT}" fill="#000"/></mask></defs>` +
	`<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">` +
	`<path d="${SHIELD}" fill="${fill}" mask="url(#keyhole)"/></g>`

const svg = body =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`

const gradient = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BLUE_FROM}"/><stop offset="1" stop-color="${BLUE_TO}"/></linearGradient></defs>`
const background = `${gradient}<rect width="1024" height="1024" fill="url(#g)"/>`

const files = {
	// Full icon: gradient square, white shield.
	"icon.png": svg(`${background}${glyph(0.92, "#FFFFFF")}`),
	// Adaptive icon: layers (the launcher masks and moves them).
	"android-icon-background.png": svg(background),
	"android-icon-foreground.png": svg(glyph(0.68, "#FFFFFF")),
	// Android 13 themed icon: one-color silhouette, the system tints it.
	"android-icon-monochrome.png": svg(glyph(0.68, "#000000")),
	// Splash: the glyph alone; the background color comes from app.json.
	"splash-icon.png": svg(glyph(0.62, SPLASH_LIGHT)),
	"splash-icon-dark.png": svg(glyph(0.62, SPLASH_DARK)),
	// Favicon is not used (Android only) but the file exists in the template.
	"favicon.png": svg(`${background}${glyph(0.92, "#FFFFFF")}`),
}

fs.mkdirSync(out, { recursive: true })
for (const [name, source] of Object.entries(files)) {
	const size = name === "favicon.png" ? 96 : 1024
	const png = new Resvg(source, { fitTo: { mode: "width", value: size } }).render().asPng()
	fs.writeFileSync(path.join(out, name), png)
	process.stdout.write(`${name} (${size}px)\n`)
}
