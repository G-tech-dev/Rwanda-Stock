# Roulette Even/Odd Tracker — Microsoft Edge extension

The previous Wallet AI assistant is being replaced with a local-first roulette result tracker. This project contains a Microsoft Edge Manifest V3 extension in `extension/` and a simple project landing page for Vercel.

## Features
- Record European roulette outcomes (0–36) or American outcomes (0, 00, 1–36).
- Show historical counts and frequencies for even, odd, and zero.
- Show the latest recorded streak as a description, not a betting signal.
- Store results in Microsoft Edge extension storage on the user's device.
- No AI model, OpenRouter connection, access code, remote analysis API, or account required.

## Install in Microsoft Edge
1. Download this repository as a ZIP and extract it.
2. Visit `edge://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the `extension` folder.
5. Pin **Roulette Even/Odd Tracker** to the toolbar if desired.

## Deploy the landing page to Vercel
Import `https://github.com/G-tech-dev/Rwanda-Stock` as a Vercel project. The root is a static HTML site; use no build command and set the output directory to the repository root if Vercel asks for it. The extension itself is installed locally from the `extension` folder; hosting a web page on Vercel does not install an extension into Edge.

## Important probability note
This tool describes recorded outcomes; it cannot reliably predict a future spin. Spins are independent. On a European wheel, each even/odd category has 18 of 37 pockets (48.65%) and zero is neither. On an American wheel, each has 18 of 38 pockets (47.37%), with 0 and 00 neither. Actual betting rules and payouts depend on the table. Don't treat streaks or historical percentages as a guaranteed advantage.

## Privacy
The extension stores its history locally using `chrome.storage.local`; it does not transmit roulette results to a server. It requests only the `storage` permission.
