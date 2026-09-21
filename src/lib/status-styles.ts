// System screens must work without the main layout or its fonts.
export const statusStyles = `
.rivalry-status{--status-text:var(--text,#202d25);--status-muted:var(--muted,#59665e);--status-line:var(--border,#d6dcd7);--status-accent:var(--accent,#28563d);color:var(--status-text);font-family:var(--font-inter,Arial),sans-serif;max-width:1200px;margin:0 auto;padding:64px 32px 72px;box-sizing:border-box}
.rivalry-status *{box-sizing:border-box}
.rivalry-status-header{max-width:1200px;margin:auto;padding:28px 32px;border-bottom:1px solid #d6dcd7;font:800 22px Arial,sans-serif;letter-spacing:-.7px}
.rivalry-status-header a{color:inherit;text-decoration:none;display:inline-flex;gap:12px;align-items:center}
.rivalry-status-header svg{width:30px;height:38px;color:#28563d}
.rivalry-status-layout{display:grid;grid-template-columns:1.2fr 1fr;gap:64px;align-items:center;min-height:340px}
.rivalry-status-kicker{display:block;font-size:11px;letter-spacing:2px;font-weight:700;color:var(--status-muted)}
.rivalry-status h1{font-family:var(--font-display,Arial),sans-serif;font-size:clamp(36px,5vw,64px);letter-spacing:-1.8px;line-height:1.06;margin:23px 0}
.rivalry-status p{font-size:15px;line-height:1.9;max-width:490px;margin:0;color:var(--status-muted)}
.rivalry-status-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.rivalry-status-actions a,.rivalry-status-actions button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:12px 18px;border:1px solid var(--status-accent);background:var(--status-accent);color:#fff;text-decoration:none;font:600 13px var(--font-inter,Arial),sans-serif;cursor:pointer;border-radius:2px}
.rivalry-status-actions .rivalry-status-secondary{background:transparent;color:var(--status-text);border-color:var(--status-line)}
.rivalry-status a:focus-visible,.rivalry-status button:focus-visible,.rivalry-status-header a:focus-visible{outline:3px solid #aa7820;outline-offset:4px}
.rivalry-status-pitch{aspect-ratio:1.1;position:relative;border:1px solid var(--status-line);display:grid;place-items:center;overflow:hidden}
.rivalry-status-pitch:before{content:'';position:absolute;inset:13px;border:1px solid var(--status-line)}
.rivalry-status-pitch:after{content:'';position:absolute;width:44%;aspect-ratio:1;border:1px solid var(--status-line);border-radius:50%}
.rivalry-status-pitch span{font-size:clamp(100px,15vw,190px);line-height:1;font-family:var(--font-display,Arial),sans-serif;font-weight:800;letter-spacing:-8px;color:var(--status-accent);z-index:1}
.rivalry-status-links{display:flex;flex-wrap:wrap;gap:14px 28px;margin-top:48px;border-top:1px solid var(--status-line);padding-top:22px;font-size:12px;color:var(--status-muted)}
.rivalry-status-links a{color:var(--status-text);text-underline-offset:4px}
.rivalry-status-standalone{margin:0;background:#fff;color:#202d25;min-height:100vh;color-scheme:light}
.rivalry-status-standalone .rivalry-status{--status-text:#202d25;--status-muted:#59665e;--status-line:#d6dcd7;--status-accent:#28563d}
@media(prefers-color-scheme:dark){.rivalry-status-standalone{background:#111a15;color:#edf2ee;color-scheme:dark}.rivalry-status-standalone .rivalry-status{--status-text:#edf2ee;--status-muted:#b0bdb4;--status-line:#37443b;--status-accent:#bed8c3}.rivalry-status-standalone .rivalry-status-actions a,.rivalry-status-standalone .rivalry-status-actions button{color:#17281d}.rivalry-status-standalone .rivalry-status-actions .rivalry-status-secondary{color:#edf2ee}.rivalry-status-standalone .rivalry-status-header{border-color:#37443b}.rivalry-status-standalone .rivalry-status-header svg{color:#bed8c3}}
[data-theme=dark] .rivalry-status-actions a,[data-theme=dark] .rivalry-status-actions button{color:#17281d}
[data-theme=dark] .rivalry-status-actions .rivalry-status-secondary{color:var(--status-text)}
@media(max-width:650px){.rivalry-status{padding:36px 20px 48px}.rivalry-status-header{padding:22px 20px}.rivalry-status-layout{grid-template-columns:1fr;gap:32px}.rivalry-status-pitch{aspect-ratio:2.2;grid-row:1}.rivalry-status-pitch span{font-size:110px;letter-spacing:-5px}.rivalry-status h1{letter-spacing:-1px}.rivalry-status p{font-size:14px}.rivalry-status-links{margin-top:32px}}
`;
