# Our World 💛

A private, romantic web app — built just for the two of you. Premium glassmorphism UI, smooth animations, and 16 features including a love counter, memory gallery, love letters, a PIN-protected secret space, and daily scratch-card surprises.

Everything is stored locally on the device using `localStorage` — nothing is sent to a server, ever.

---

## Files in this project

```
ourworld/
├── index.html          → the whole app: structure + styles
├── app.js              → all app logic and interactivity
├── manifest.json        → PWA config (app name, icons, colors)
├── service-worker.js    → enables offline support
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-192.png
    └── icon-maskable-512.png
```

No build step, no dependencies, no paid services. Just open it.

---

## 1. Running it locally

Browsers block some features (like the service worker and `localStorage` in certain setups) when you open an HTML file directly with `file://`. The fix is a tiny local server — no installation needed beyond what's already on your computer.

**If you have Python installed** (most Macs and Linux machines do):

```bash
cd ourworld
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

**If you have Node.js installed**, as an alternative:

```bash
cd ourworld
npx serve
```

It'll print a local URL to open.

**On Windows**, if you have Python: open Command Prompt in the `ourworld` folder and run the same `python3 -m http.server 8000` command (or `python` if `python3` isn't recognized), then visit `http://localhost:8000`.

---

## 2. Deploying for free with GitHub Pages

This puts your app on the real internet, with a free HTTPS link you can send to her.

1. **Create a GitHub account** at github.com if you don't have one.
2. **Create a new repository** — name it something like `our-world` (Settings can stay "Public" or "Private"; Private repos also work with GitHub Pages on free accounts as of recent GitHub plans, but Public is simplest).
3. **Upload the files**: on the repository page, click "Add file" → "Upload files", then drag in `index.html`, `app.js`, `manifest.json`, `service-worker.js`, and the whole `icons` folder. Commit the changes.
4. **Turn on Pages**: go to the repository's **Settings** tab → **Pages** (in the left sidebar) → under "Build and deployment," set **Source** to "Deploy from a branch," pick the `main` branch and `/ (root)` folder → **Save**.
5. Wait about a minute, then refresh that Pages settings screen — it'll show your live link, something like:
   `https://yourusername.github.io/our-world/`

That's the link to send her. It works on any phone or computer, and it's free forever.

---

## 3. Installing it as an app

Once it's live on a real URL (GitHub Pages or any other host), it can be installed like a native app — no app store needed.

### On Android (Chrome)
1. Open the site link in Chrome.
2. Tap the **⋮** menu (top right).
3. Tap **"Add to Home screen"** or **"Install app"**.
4. Confirm — the icon appears on the home screen and opens full-screen, just like a normal app.

### On iPhone (Safari)
1. Open the site link in **Safari** (this only works in Safari, not Chrome, on iOS).
2. Tap the **Share** icon (square with an arrow pointing up) at the bottom of the screen.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top right.
5. The icon appears on the home screen and opens full-screen, with no browser bar.

Once installed, it works offline too — the service worker caches the app shell, so it'll open even with no signal (anything saved before, like photos and letters, is always available since it's stored on the device).

---

## A few notes on how it works

- **Everything is private and local.** Photos, letters, the secret PIN, anniversary date — it's all saved in the browser's `localStorage` on that one device. Nothing leaves the phone, and nothing needs an account or internet connection once it's loaded.
- **Photos are compressed automatically** before saving, to keep things fast and avoid filling up storage too quickly.
- **The secret PIN defaults to `1234`.** Change it right away from Settings → Secret PIN.
- **Back up your data**: Settings → Data → "Export backup" downloads everything as a `.json` file, in case you ever switch phones or clear browser data.
- If storage ever fills up (it's usually several MB, plenty for dozens of photos), the app will let you know — try removing a few older photos from the gallery.

Made with care — enjoy it together. 💛
