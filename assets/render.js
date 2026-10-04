/* Link World page renderer. A page is a spec (JSON) carried in the link after "#":
   "#z.<base64url of deflate-raw JSON>" (what the ChatGPT plugin makes) or "#<base64url JSON>". window.LW_SPEC also works.
   Every value is checked here: colours must be hex, fonts come from our list, links must be http(s) or mailto, and all
   text goes in as text, never as HTML. The spec format: chatgpt-plugin/link-world/skills/design-landing-page/references/spec.md */
(() => {
  const BASE = window.LW_BASE || '../';
  const EXAMPLE = (q => /^[a-z0-9-]{1,40}$/.test(q || '') ? q : '')(new URLSearchParams(location.search).get('ex'));

  /* ---------- fonts we load (Google Fonts): [css2 family, fallback, the one weight it has (if only one)] ---------- */
  const FONTS = {
    'Fraunces': ['Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900', 'Georgia,serif'],
    'Playfair Display': ['Playfair+Display:ital,wght@0,400..900;1,400..900', 'Georgia,serif'],
    'DM Serif Display': ['DM+Serif+Display:ital@0;1', 'Georgia,serif', 400],
    'Instrument Serif': ['Instrument+Serif:ital@0;1', 'Georgia,serif', 400],
    'Cormorant Garamond': ['Cormorant+Garamond:ital,wght@0,400..700;1,400..700', 'Georgia,serif'],
    'Gloock': ['Gloock', 'Georgia,serif', 400],
    'Abril Fatface': ['Abril+Fatface', 'Georgia,serif', 400],
    'Source Serif 4': ['Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900', 'Georgia,serif'],
    'Literata': ['Literata:ital,opsz,wght@0,7..72,300..900;1,7..72,300..900', 'Georgia,serif'],
    'Bricolage Grotesque': ['Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800', 'system-ui,sans-serif'],
    'Syne': ['Syne:wght@400..800', 'system-ui,sans-serif'],
    'Unbounded': ['Unbounded:wght@300..900', 'system-ui,sans-serif'],
    'Archivo Black': ['Archivo+Black', 'Impact,system-ui,sans-serif', 400],
    'Anton': ['Anton', 'Impact,sans-serif', 400],
    'Bebas Neue': ['Bebas+Neue', 'Impact,sans-serif', 400],
    'Big Shoulders Display': ['Big+Shoulders+Display:wght@300..900', 'Impact,sans-serif'],
    'Chivo': ['Chivo:ital,wght@0,300..900;1,300..900', 'system-ui,sans-serif'],
    'Pacifico': ['Pacifico', 'cursive', 400],
    'Caveat': ['Caveat:wght@400..700', 'cursive'],
    'Space Mono': ['Space+Mono:ital,wght@0,400;0,700;1,400;1,700', 'ui-monospace,monospace'],
    'IBM Plex Mono': ['IBM+Plex+Mono:ital,wght@0,400;0,600;1,400', 'ui-monospace,monospace'],
    'Inter': ['Inter:ital,opsz,wght@0,14..32,300..900;1,14..32,300..900', 'system-ui,sans-serif'],
    'Instrument Sans': ['Instrument+Sans:ital,wdth,wght@0,75..100,400..700;1,75..100,400..700', 'system-ui,sans-serif'],
    'DM Sans': ['DM+Sans:ital,opsz,wght@0,9..40,300..900;1,9..40,300..900', 'system-ui,sans-serif'],
    'Manrope': ['Manrope:wght@300..800', 'system-ui,sans-serif'],
    'Work Sans': ['Work+Sans:ital,wght@0,300..900;1,300..900', 'system-ui,sans-serif'],
    'Figtree': ['Figtree:ital,wght@0,300..900;1,300..900', 'system-ui,sans-serif'],
    'Karla': ['Karla:ital,wght@0,300..800;1,300..800', 'system-ui,sans-serif'],
    'Nunito': ['Nunito:ital,wght@0,300..900;1,300..900', 'system-ui,sans-serif'],
  };
  /* faces made for headlines only; as body text they fall back to Instrument Sans */
  const DISPLAY_ONLY = ['DM Serif Display', 'Instrument Serif', 'Gloock', 'Abril Fatface', 'Archivo Black', 'Anton', 'Bebas Neue', 'Big Shoulders Display', 'Pacifico', 'Caveat', 'Unbounded', 'Syne', 'Playfair Display'];
  window.LW_FONTS = Object.keys(FONTS);
  const LAYOUTS = ['split', 'centered', 'editorial', 'bento', 'poster', 'stack'];
  const WORLDS = ['stage', 'studio', 'vanity', 'room', 'beach', 'city', 'jungle', 'lounge', 'arrivals', 'harbour'];
  const SECTIONS = ['proof', 'links', 'offer', 'about', 'list', 'gallery', 'quote', 'faq', 'follow', 'ticker'];
  const ART_STYLES = ['tiles', 'blobs', 'arches', 'waves'];

  /* ---------- small helpers ---------- */
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null && text !== '') e.textContent = text; return e; };
  const str = (v, n) => typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '';
  const paras = (v, n) => (typeof v === 'string' ? v : '').split(/\n+/).map(p => str(p, n)).filter(Boolean).slice(0, 4);
  const hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v.trim()) ? v.trim().toUpperCase() : null;
  const pick = (v, list, d) => list.includes(v) ? v : d;
  const safeUrl = v => { const u = typeof v === 'string' ? v.trim() : ''; return /^(https?:\/\/[^\s"'<>`]+|mailto:[^\s"'<>`]+)$/i.test(u) ? u : null; };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const lum = h => { const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const contrast = (a, b) => { const x = lum(a) + .05, y = lum(b) + .05; return x > y ? x / y : y / x; };
  const mix = (a, b, t) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
  /* nudge a colour toward black or white until it reads on bg */
  const readable = (c, bg, min) => { let x = c; const to = lum(bg) > .3 ? '#000000' : '#FFFFFF'; for (let i = 0; i < 14 && contrast(x, bg) < min; i++) x = mix(x, to, .15); return x; };
  function seeded(text) { let h = 2166136261; for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }

  /* ---------- icons (brand marks fill; generic ones are strokes) ---------- */
  const HOSTS = [[/instagram\.com/, 'instagram'], [/tiktok\.com/, 'tiktok'], [/youtube\.com|youtu\.be/, 'youtube'], [/spotify\.com/, 'spotify'], [/music\.apple\.com/, 'applemusic'], [/soundcloud\.com/, 'soundcloud'], [/(^|\.)x\.com$|twitter\.com/, 'x'], [/threads\.(net|com)/, 'threads'], [/facebook\.com|fb\.com/, 'facebook'], [/snapchat\.com/, 'snapchat'], [/wa\.me|whatsapp\.com/, 'whatsapp'], [/twitch\.tv/, 'twitch'], [/discord\.(gg|com)/, 'discord'], [/pinterest\./, 'pinterest'], [/patreon\.com/, 'patreon'], [/ko-fi\.com/, 'kofi'], [/etsy\.com/, 'etsy'], [/bandcamp\.com/, 'bandcamp'], [/t\.me$|telegram\./, 'telegram'], [/linkedin\.com/, 'briefcase'], [/calendly\.com|cal\.com|topmate\.io|tidycal\.com/, 'calendar'], [/substack\.com|medium\.com|beehiiv\.com/, 'book'], [/shopify|gumroad\.com|lemonsqueezy|stan\.store/, 'shop']];
  const ICON_NAMES = () => Object.keys(window.LW_BRANDS || {}).concat(Object.keys(window.LW_ICONS || {}));
  function iconKey(key, url) {
    if (key && ICON_NAMES().includes(key)) return key;
    const u = (url || '').toLowerCase(); if (u.startsWith('mailto:')) return 'mail';
    let host = ''; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (_) { }
    const hit = HOSTS.find(([re]) => re.test(host)); return hit ? hit[1] : 'web';
  }
  function icon(key) {
    const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    const brand = (window.LW_BRANDS || {})[key], icons = window.LW_ICONS || {};
    if (brand) { p.setAttribute('d', brand.d); p.setAttribute('fill', 'currentColor'); }
    else {
      p.setAttribute('d', icons[key] || icons.link || '');
      const attrs = { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
      for (const k in attrs) p.setAttribute(k, attrs[k]);
    }
    s.appendChild(p); return s;
  }
  const brandName = key => ((window.LW_BRANDS || {})[key] || {}).name || key;

  /* ---------- the spec: read it, then check every value ---------- */
  async function readSpec() {
    if (window.LW_SPEC) return window.LW_SPEC;
    let h = location.hash.slice(1);
    const ex = EXAMPLE; if (!h && ex) { const r = await fetch(BASE + 'examples/' + ex + '.json'); return r.ok ? r.json() : null; }
    if (!h) return null;
    const z = h.startsWith('z.'); if (z) h = h.slice(2);
    const bytes = Uint8Array.from(atob(h.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    let data = bytes;
    if (z) data = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    if (data.length > 60000) throw new Error('too big');
    return JSON.parse(new TextDecoder().decode(data));
  }
  function check(raw) {
    const S = raw && typeof raw === 'object' ? raw : {}, T = S.theme && typeof S.theme === 'object' ? S.theme : {};
    const link = (o, n) => { if (!o || typeof o !== 'object') return null; const url = safeUrl(o.url), label = str(o.label, n || 40); return url && label ? { label, url } : null; };
    const bg = hex(T.bg) || '#111216';
    let text = hex(T.text) || (lum(bg) > .3 ? '#141414' : '#F5F3EE'); if (contrast(text, bg) < 7) text = readable(text, bg, 7);
    const accent = hex(T.accent) || '#FFB547';
    let accentText = hex(T.accentText); if (!accentText || contrast(accentText, accent) < 4.5) accentText = contrast('#111111', accent) >= contrast('#FFFFFF', accent) ? '#111111' : '#FFFFFF';
    let muted = hex(T.muted); if (!muted || contrast(muted, bg) < 4.5) muted = readable(muted || mix(text, bg, .35), bg, 4.5);
    const display = FONTS[T.display] ? T.display : 'Bricolage Grotesque';
    const body = FONTS[T.body] && !DISPLAY_ONLY.includes(T.body) ? T.body : 'Instrument Sans';
    const theme = {
      bg, text, accent, accentText, muted, bg2: hex(T.bg2) || mix(bg, accent, .3), surface: hex(T.surface) || mix(bg, text, lum(bg) > .3 ? .05 : .08),
      accentInk: readable(accent, bg, 3.2),
      bgStyle: pick(T.bgStyle, ['solid', 'gradient', 'mesh', 'grain', 'grid', 'dots', 'glow'], 'solid'),
      display, body,
      displayWeight: FONTS[display][2] || Math.max(300, Math.min(900, Math.round((+T.displayWeight || 700) / 100) * 100)),
      displayCase: T.displayCase === 'upper' ? 'uppercase' : 'none', tracking: pick(T.tracking, ['tight', 'normal', 'wide'], 'tight'), italic: !!T.italic,
      radius: pick(T.radius, ['none', 'soft', 'round', 'pill'], 'round'), buttons: pick(T.buttons, ['solid', 'outline', 'glass', 'underline'], 'outline'), cards: pick(T.cards, ['flat', 'outline', 'shadow', 'glass'], 'flat'),
    };
    const H = S.hero && typeof S.hero === 'object' ? S.hero : {}, A = H.art && typeof H.art === 'object' ? H.art : {};
    const name = str(S.name, 40) || str(S.handle, 30) || 'Your name';
    const sections = (Array.isArray(S.sections) ? S.sections : []).filter(s => s && SECTIONS.includes(s.type)).slice(0, 12).map(s => {
      const items = n => Array.isArray(s.items) ? s.items.slice(0, n).filter(i => i && typeof i === 'object') : [];
      switch (s.type) {
        case 'proof': return { type: 'proof', items: items(4).map(i => ({ n: str(i.n, 12), l: str(i.l, 30) })).filter(i => i.n) };
        case 'links': return { type: 'links', title: str(s.title, 60), items: items(10).map(i => { const l = link(i, 50); return l && { ...l, note: str(i.note, 60), icon: iconKey(i.icon, l.url) }; }).filter(Boolean) };
        case 'offer': return { type: 'offer', title: str(s.title, 70), text: str(s.text, 240), price: str(s.price, 24), badge: str(s.badge, 20), cta: link(s.cta) };
        case 'about': return { type: 'about', title: str(s.title, 60), paras: paras(s.text, 360) };
        case 'list': return { type: 'list', title: str(s.title, 60), items: items(8).map(i => ({ title: str(i.title, 60), text: str(i.text, 160), icon: iconKey(i.icon, '') })).filter(i => i.title) };
        case 'gallery': return { type: 'gallery', title: str(s.title, 60), items: items(8).map(i => ({ caption: str(i.caption, 40), color: hex(i.color), emoji: str(i.emoji, 8) })) };
        case 'quote': return { type: 'quote', text: str(s.text, 260), by: str(s.by, 60) };
        case 'faq': return { type: 'faq', title: str(s.title, 60), items: items(6).map(i => ({ q: str(i.q, 100), a: str(i.a, 320) })).filter(i => i.q && i.a) };
        case 'follow': return { type: 'follow', title: str(s.title, 60) };
        case 'ticker': return { type: 'ticker', items: (Array.isArray(s.items) ? s.items : []).map(i => str(i, 40)).filter(Boolean).slice(0, 6) };
      }
    }).filter(s => s && (s.type === 'follow' || s.text || s.title || (s.paras && s.paras.length) || (s.items && s.items.length)));
    const art = { type: pick(A.type, ['world', 'shapes', 'monogram', 'emoji', 'photo', 'none'], 'shapes'), style: pick(A.style, ART_STYLES, ART_STYLES[Math.floor(seeded(name)() * ART_STYLES.length)]), world: pick(A.world, WORLDS, 'studio'), emoji: str(A.emoji, 8) || '✨', url: /^https:\/\//i.test(A.url || '') ? safeUrl(A.url) : null };
    if (art.type === 'photo' && !art.url) art.type = 'shapes';
    return {
      name, handle: str(S.handle, 30).replace(/^@/, ''), layout: pick(S.layout, LAYOUTS, 'split'), theme,
      hero: { eyebrow: str(H.eyebrow, 60), headline: str(H.headline, 90) || name, sub: str(H.sub, 240), art },
      cta: link(S.cta), cta2: link(S.cta2),
      sections, socials: (Array.isArray(S.socials) ? S.socials : []).map(s => { const url = safeUrl(s && s.url); return url && { url, icon: iconKey(s.type, url) }; }).filter(Boolean).slice(0, 8),
      footer: str(S.footer, 120), page: str(S.page, 40) || 'preview',
    };
  }

  /* ---------- theme ---------- */
  function applyTheme(T) {
    const set = (k, v) => document.documentElement.style.setProperty(k, v);
    set('--bg', T.bg); set('--bg2', T.bg2); set('--surface', T.surface); set('--text', T.text); set('--muted', T.muted); set('--accent', T.accent); set('--accent-text', T.accentText); set('--accent-ink', T.accentInk);
    set('--display', `"${T.display}",${FONTS[T.display][1]}`); set('--body', `"${T.body}",${FONTS[T.body][1]}`);
    set('--dw', T.displayWeight); set('--dcase', T.displayCase); set('--dstyle', T.italic ? 'italic' : 'normal');
    set('--dtrack', { tight: '-.025em', normal: '0em', wide: '.05em' }[T.tracking]);
    set('--r', { none: '0px', soft: '10px', round: '22px', pill: '28px' }[T.radius]); set('--rb', { none: '0px', soft: '10px', round: '16px', pill: '999px' }[T.radius]);
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = T.bg;
    const add = href => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); };
    const fams = [...new Set([T.display, T.body])].map(f => 'family=' + FONTS[f][0]).join('&');
    add(`https://fonts.googleapis.com/css2?${fams}&display=swap`);
  }

  /* ---------- the parts ---------- */
  const out = (a, track) => { a.target = '_blank'; a.rel = 'noopener'; a.dataset.track = track; return a; };
  function btn(l, cls, track) { const a = out(el('a', 'btn ' + cls), track); a.href = l.url; a.append(l.label); if (cls === 'primary') a.appendChild(icon('arrow')); return a; }
  function ctas(S) { const d = el('div', 'ctas'); if (S.cta) d.appendChild(btn(S.cta, 'primary', 'cta')); if (S.cta2) d.appendChild(btn(S.cta2, 'second', 'cta2')); return d.children.length ? d : null; }
  function proofList(items) { const ul = el('ul', 'proof'); items.forEach(i => { const li = el('li'); li.append(el('b', null, i.n), i.l); ul.appendChild(li); }); return ul; }
  function art(S) {
    const A = S.hero.art, T = S.theme;
    if (A.type === 'none') return null;
    const f = el('figure', 'art art-' + A.type); f.setAttribute('aria-hidden', 'true');
    if (A.type === 'world' || A.type === 'photo') { const img = el('img'); img.src = A.type === 'world' ? BASE + 'worlds/' + A.world + '.jpg' : A.url; img.alt = ''; img.referrerPolicy = 'no-referrer'; img.onerror = () => { img.remove(); f.prepend(artSvg(S)); }; f.appendChild(img); return f; }
    if (A.type === 'shapes') { f.appendChild(artSvg(S)); return f; }
    if (A.type === 'monogram') { f.style.background = `radial-gradient(120% 90% at 30% 20%, ${mix(T.accent, '#FFFFFF', .22)}, ${T.accent} 55%, ${mix(T.accent, T.bg2, .35)})`; f.appendChild(el('div', 'mono', S.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => [...w][0]).join('') || '✦')); }
    if (A.type === 'emoji') { f.style.background = `radial-gradient(110% 90% at 30% 20%, ${mix(T.bg2, '#FFFFFF', .4)}, ${T.bg2} 60%, ${mix(T.bg2, T.accent, .25)})`; f.appendChild(el('div', 'emo', A.emoji)); }
    return f;
  }

  /* ---------- generated art: four styles, drawn at the box's real size from the page's own colours.
     The same name always draws the same picture. ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  let artIds = 0;
  function artSvg(S) {
    const s = document.createElementNS(NS, 'svg'); s.classList.add('shapes');
    new ResizeObserver(() => drawArt(s, S)).observe(s);
    return s;
  }
  function artPalette(T) {
    const out = [], near = (a, b) => rgb(a).reduce((t, v, i) => t + Math.abs(v - rgb(b)[i]), 0) < 70;
    [T.accent, T.bg2, T.text, mix(T.accent, T.bg2, .5), mix(T.accent, '#FFFFFF', .55), mix(T.bg, T.text, .07)].forEach(c => { if (!out.some(o => near(o, c))) out.push(c); });
    if (out.length < 4) out.push(mix(T.accent, '#000000', .3), mix(T.bg2, '#FFFFFF', .5));
    return out;
  }
  function drawArt(svg, S) {
    const r = svg.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    if (w < 2 || h < 2 || (svg._w === w && svg._h === h)) return;
    svg._w = w; svg._h = h;
    while (svg.firstChild) svg.firstChild.remove();
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const T = S.theme, style = S.hero.art.style, rnd = seeded(S.name + '|' + style), id = 'lw' + (++artIds);
    const g = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; };
    ART[style](g, w, h, rnd, artPalette(T), T, g('defs', {}), id);
  }
  const pickFrom = (rnd, list, not) => { let c, n = 0; do { c = list[Math.floor(rnd() * list.length)]; } while (not.includes(c) && ++n < 10); return c; };
  const sparkle = (x, y, z) => { const q = z * .12; return `M${x} ${y - z}C${x + q} ${y - q} ${x + q} ${y - q} ${x + z} ${y}C${x + q} ${y + q} ${x + q} ${y + q} ${x} ${y + z}C${x - q} ${y + q} ${x - q} ${y + q} ${x - z} ${y}C${x - q} ${y - q} ${x - q} ${y - q} ${x} ${y - z}Z`; };
  const ART = {
    /* a quilt of square tiles, each with one bold shape (quarter disc, half disc, circle, triangle, ring, leaf) */
    tiles(g, w, h, rnd, pal) {
      const cols = Math.max(2, Math.min(9, Math.round(w / 125))), c = w / cols, rows = Math.ceil(h / c), oy = 0;
      const MOTIFS = ['M0 0H1A1 1 0 0 1 0 1Z', 'M0 1A.5 .5 0 0 1 1 1Z', 'circle', 'M0 0H1V1Z', 'ring', 'M0 1A1 1 0 0 1 1 0A1 1 0 0 1 0 1Z', 'M0 0H1A1 1 0 0 1 0 1Z', ''];
      const fills = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const bgc = pickFrom(rnd, pal, [x ? fills[fills.length - 1] : '', y ? fills[fills.length - cols] : '']);
        fills.push(bgc);
        const fg = pickFrom(rnd, pal, [bgc]), m = MOTIFS[Math.floor(rnd() * MOTIFS.length)], t = `translate(${(x * c).toFixed(2)} ${(oy + y * c).toFixed(2)}) scale(${c.toFixed(3)}) rotate(${Math.floor(rnd() * 4) * 90} .5 .5)`;
        g('rect', { x: (x * c).toFixed(2), y: (oy + y * c).toFixed(2), width: (c + 1).toFixed(2), height: (c + 1).toFixed(2), fill: bgc });
        if (m === 'circle') g('circle', { cx: .5, cy: .5, r: .34, fill: fg, transform: t });
        else if (m === 'ring') g('circle', { cx: .5, cy: .5, r: .3, fill: 'none', stroke: fg, 'stroke-width': .15, transform: t });
        else if (m) g('path', { d: m, fill: fg, transform: t });
      }
    },
    /* soft blurred colour, with a thin ring and a few sparkles on top */
    blobs(g, w, h, rnd, pal, T, defs, id) {
      const big = Math.max(w, h), f = g('filter', { id: id + 'b', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
      g('feGaussianBlur', { stdDeviation: (big * .085).toFixed(1) }, f);
      g('rect', { x: 0, y: 0, width: w, height: h, fill: mix(T.bg2, T.bg, .2) });
      const grp = g('g', { filter: `url(#${id}b)` }), cols = [T.accent, mix(T.accent, '#FFFFFF', .5), T.bg2, mix(T.accent, T.text, .3), mix(T.bg2, '#FFFFFF', .55)];
      for (let i = 0; i < 6; i++) g('circle', { cx: (rnd() * w).toFixed(1), cy: (rnd() * h).toFixed(1), r: (big * (.16 + rnd() * .2)).toFixed(1), fill: cols[i % cols.length] }, grp);
      const ink = 'rgba(255,255,255,.85)', m = Math.min(w, h);
      g('circle', { cx: (w * (.3 + rnd() * .4)).toFixed(1), cy: (h * (.3 + rnd() * .4)).toFixed(1), r: (m * .28).toFixed(1), fill: 'none', stroke: ink, 'stroke-width': Math.max(1.2, m * .006).toFixed(2) });
      for (let i = 0; i < 3; i++) g('path', { d: sparkle(w * (.12 + rnd() * .76), h * (.12 + rnd() * .76), m * (.03 + rnd() * .04)), fill: ink });
    },
    /* rainbow arches standing on the bottom edge, and a sun */
    arches(g, w, h, rnd, pal, T) {
      const back = pal.includes(T.bg2) ? T.bg2 : pal[1], cols = pal.filter(c => c !== back), groups = w > h * 1.35 ? 2 : 1;
      g('rect', { x: 0, y: 0, width: w, height: h, fill: back });
      const m = Math.min(w, h);
      g('circle', { cx: (w * (rnd() > .5 ? .8 : .2)).toFixed(1), cy: (h * .2).toFixed(1), r: (m * .1).toFixed(1), fill: cols[0] });
      for (let k = 0; k < groups; k++) {
        const R = Math.min(w / groups * .44, h * .8), cx = groups === 1 ? w / 2 : w * (k ? .7 : .3), n = 5, b = R / (n + .7), base = h + 1, off = Math.floor(rnd() * cols.length);
        for (let i = 0; i < n; i++) { const r = R - b * (i + .5); g('path', { d: `M${(cx - r).toFixed(1)} ${base}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + r).toFixed(1)} ${base}`, fill: 'none', stroke: cols[(i + off) % cols.length], 'stroke-width': (b + .6).toFixed(1) }); }
      }
    },
    /* layered waves under a low sun */
    waves(g, w, h, rnd, pal, T) {
      const back = mix(T.bg2, '#FFFFFF', .3), cols = [T.bg2, mix(T.accent, T.bg2, .5), T.accent, mix(T.accent, T.text, .4), T.text], A = h * .035, L = w / (1 + rnd() * 1.4), m = Math.min(w, h);
      g('rect', { x: 0, y: 0, width: w, height: h, fill: back });
      g('circle', { cx: (w * (.3 + rnd() * .4)).toFixed(1), cy: (h * .34).toFixed(1), r: (m * .2).toFixed(1), fill: mix(T.accent, '#FFFFFF', .35) });
      cols.forEach((c, i) => {
        const y0 = h * (.42 + i * .12), ph = rnd() * 6.283;
        let d = `M0 ${h + 2}L0 ${y0.toFixed(1)}`;
        for (let x = 0; x <= w + 10; x += 10) d += `L${x} ${(y0 + Math.sin(x / L * 6.283 + ph) * A).toFixed(1)}`;
        g('path', { d: d + `L${w + 10} ${h + 2}Z`, fill: c });
      });
    },
  };
  function heroText(S, opts = {}) {
    const f = document.createDocumentFragment();
    if (S.hero.eyebrow) f.appendChild(el('p', 'eyebrow', S.hero.eyebrow));
    f.appendChild(el('h1', 'display', opts.title || S.hero.headline));
    if (opts.tag) f.appendChild(el('p', 'tag', opts.tag));
    if (S.hero.sub) f.appendChild(el('p', 'sub', S.hero.sub));
    const c = ctas(S); if (c) f.appendChild(c);
    const proof = !opts.noProof && S.sections.find(s => s.type === 'proof'); if (proof) f.appendChild(proofList(proof.items));
    return f;
  }
  function socials(S) {
    if (!S.socials.length) return null;
    const ul = el('ul', 'socials');
    S.socials.forEach(s => { const li = el('li'), a = out(el('a'), 'social-' + s.icon); a.href = s.url; a.setAttribute('aria-label', brandName(s.icon)); a.appendChild(icon(s.icon)); li.appendChild(a); ul.appendChild(li); });
    return ul;
  }
  function linkRow(l, i) { const a = out(el('a', 'link card'), 'link-' + (i + 1)); a.href = l.url; const ic = el('span', 'ic'); ic.appendChild(icon(l.icon)); const t = el('span', 'lt'); t.append(el('b', null, l.label)); if (l.note) t.appendChild(el('small', null, l.note)); const go = el('span', 'go'); go.appendChild(icon('arrow')); a.append(ic, t, go); return a; }
  function swatch(t, g, i, S) {
    const sw = el('span', 'sw'); sw.style.setProperty('--tc', g.color || [S.theme.accent, S.theme.bg2, mix(S.theme.accent, S.theme.bg, .5), mix(S.theme.bg2, S.theme.text, .2)][i % 4]);
    if (g.emoji) sw.appendChild(el('i', null, g.emoji));
    t.appendChild(sw); if (g.caption) t.appendChild(el('span', 'cap', g.caption)); return t;
  }
  function ticker(s) { const d = el('div', 'ticker'), run = el('div', 'run'); d.setAttribute('aria-label', s.items.join(', ')); for (let r = 0; r < 2; r++) { const g = el('span', 'grp'); g.setAttribute('aria-hidden', 'true'); for (let k = 0; k < 3; k++) s.items.forEach(t => { g.append(el('span', null, t), el('i', null, '✦')); }); run.appendChild(g); } d.appendChild(run); return d; }
  /* one section's content (the layouts wrap it) */
  function body(s, S) {
    const d = el('div', 'body');
    if (s.type === 'proof') d.appendChild(proofList(s.items));
    if (s.type === 'links') { const ul = el('ul', 'links n-' + s.items.length); s.items.forEach((l, i) => { const li = el('li'); li.appendChild(linkRow(l, i)); ul.appendChild(li); }); d.appendChild(ul); }
    if (s.type === 'offer') { const c = el('div', 'offer card'); if (s.badge) c.appendChild(el('span', 'badge', s.badge)); c.appendChild(el('h3', null, s.title)); if (s.text) c.appendChild(el('p', null, s.text)); const row = el('div', 'row'); if (s.price) row.appendChild(el('div', 'price', s.price)); const l = s.cta || S.cta; if (l) row.appendChild(btn(l, 'primary', 'offer')); if (row.children.length) c.appendChild(row); d.appendChild(c); }
    if (s.type === 'about') { const a = el('div', 'about'); s.paras.forEach(p => a.appendChild(el('p', null, p))); d.appendChild(a); }
    if (s.type === 'list') { const ul = el('ul', 'list n-' + s.items.length); s.items.forEach(i => { const li = el('li', 'item card'), ic = el('span', 'ic'); ic.appendChild(icon(i.icon === 'web' ? 'star' : i.icon)); li.append(ic, el('b', null, i.title)); if (i.text) li.appendChild(el('span', null, i.text)); ul.appendChild(li); }); d.appendChild(ul); }
    if (s.type === 'gallery') { const ul = el('ul', 'gallery n-' + s.items.length); s.items.forEach((g, i) => ul.appendChild(swatch(el('li', 'tile'), g, i, S))); d.appendChild(ul); }
    if (s.type === 'quote') { const q = el('blockquote', 'quote'); q.appendChild(el('p', null, '“' + s.text.replace(/^["“]|["”]$/g, '') + '”')); if (s.by) q.appendChild(el('cite', null, '— ' + s.by)); d.appendChild(q); }
    if (s.type === 'faq') { const f = el('div', 'faq'); s.items.forEach(i => { const det = el('details', 'card'); det.append(el('summary', null, i.q), el('p', null, i.a)); f.appendChild(det); }); d.appendChild(f); }
    if (s.type === 'follow') { const so = socials(S); if (so) d.appendChild(so); }
    return d;
  }
  const TITLES = { faq: 'Questions', follow: 'Follow along' };
  const LABELS = { proof: 'In numbers', links: 'Links', offer: 'Start here', about: 'About', list: 'What I offer', gallery: 'Work', quote: 'Kind words', faq: 'Questions', follow: 'Follow' };
  const titleOf = s => s.title || TITLES[s.type] || '';
  function sectionsFlow(S, opts = {}) {
    const frag = document.createDocumentFragment();
    S.sections.forEach(s => {
      if (opts.skip && opts.skip.includes(s.type)) return;
      if (s.type === 'follow' && !S.socials.length) return;
      if (s.type === 'ticker') { frag.appendChild(ticker(s)); return; }
      const two = opts.two && ['about', 'list', 'faq', 'links'].includes(s.type);
      const w = el('div', opts.wrap || 'wrap'), sec = el('section', 'sec sec-' + s.type + (two ? ' two' : '')), head = el('div', 'head');
      if (opts.labels) head.appendChild(el('span', 'lab', LABELS[s.type]));
      const t = opts.labels ? s.title : titleOf(s); if (t && s.type !== 'offer') head.appendChild(el('h2', 'sh', t));
      if (head.children.length) sec.appendChild(head);
      sec.appendChild(body(s, S)); w.appendChild(sec); frag.appendChild(w);
    });
    return frag;
  }

  /* ---------- layouts ---------- */
  const LAY = {
    split(root, S) { const w = el('div', 'wrap'), h = el('header', 'hero'), t = el('div', 'words'); t.appendChild(heroText(S)); h.appendChild(t); const a = art(S); if (a) h.appendChild(a); else h.classList.add('no-art'); w.appendChild(h); root.append(w, sectionsFlow(S, { skip: ['proof'] })); },
    centered(root, S) { const w = el('div', 'wrap'), h = el('header', 'hero'); const a = art(S); if (a) h.appendChild(a); h.appendChild(heroText(S)); const so = socials(S); if (so) h.appendChild(so); w.appendChild(h); root.append(w, sectionsFlow(S, { skip: ['proof', 'follow'] })); },
    editorial(root, S) { const w = el('div', 'wrap'), h = el('header', 'hero'); h.appendChild(heroText(S, { noProof: true })); const a = art(S); if (a) h.appendChild(a); w.appendChild(h); root.append(w, sectionsFlow(S, { labels: true, two: true })); },
    poster(root, S) { const h = el('header', 'hero'), w = el('div', 'wrap'); const a = art(S); if (a) h.appendChild(a); w.appendChild(heroText(S)); h.appendChild(w); root.append(h, sectionsFlow(S, { wrap: 'wrap narrow', skip: ['proof'] })); },
    stack(root, S) {
      const c = el('main', 'col'), h = el('header', 'hero'); const a = art(S); if (a) h.appendChild(a);
      h.appendChild(heroText(S, { title: S.name, tag: S.hero.headline !== S.name ? S.hero.headline : '' }));
      const so = socials(S); if (so) h.appendChild(so); c.appendChild(h);
      S.sections.forEach(s => {
        if (s.type === 'proof' || s.type === 'follow') return;
        if (s.type === 'ticker') { c.appendChild(ticker(s)); return; }
        const sec = el('section', 'sec sec-' + s.type), t = titleOf(s);
        if (t && s.type !== 'offer' && !(s.type === 'links' && !s.title)) sec.appendChild(el('h2', 'sh', t));
        sec.appendChild(body(s, S)); c.appendChild(sec);
      });
      root.appendChild(c);
    },
    bento(root, S) {
      const w = el('div', 'wrap'), g = el('div', 'grid');
      const tile = (cls, ...kids) => { const t = el('div', 't card ' + cls); kids.filter(Boolean).forEach(k => t.appendChild(k)); g.appendChild(t); return t; };
      tile('t-hero w2 h2', heroText(S, { noProof: true }));
      const a = art(S); if (a) tile('t-art w2 h2', a);
      S.sections.forEach(s => {
        if (s.type === 'links') s.items.forEach((l, i) => { const t = out(el('a', 't card t-link' + (i === 0 ? ' t-accent' : '')), 'link-' + (i + 1)); t.href = l.url; const ic = el('span', 'ic'); ic.appendChild(icon(l.icon)); const tx = el('span'); tx.append(el('b', null, l.label)); if (l.note) tx.appendChild(el('small', null, l.note)); const go = el('span', 'go'); go.appendChild(icon('arrow')); t.append(ic, tx, go); g.appendChild(t); });
        else if (s.type === 'gallery') s.items.forEach((it, i) => g.appendChild(swatch(el('div', 't tile'), it, i, S)));
        else if (s.type === 'proof') s.items.forEach(i => { const t = tile('t-stat'); t.append(el('b', null, i.n), el('span', null, i.l)); });
        else if (s.type === 'offer') { const t = tile('w2 t-accent t-offer', body(s, S)); t.querySelector('.offer').classList.remove('card'); }
        else if (s.type === 'ticker') { const t = el('div', 't full t-ticker'); t.appendChild(ticker(s)); g.appendChild(t); }
        else if (s.type === 'follow') { if (S.socials.length) tile('full t-follow', el('h2', 'sh', titleOf(s)), socials(S)); }
        else if (s.type === 'quote') tile('w2 t-quote', body(s, S));
        else { const t = titleOf(s); tile(['list', 'faq'].includes(s.type) ? 'full' : 'w2', t ? el('h2', 'sh', t) : null, body(s, S)); }
      });
      w.appendChild(g); root.appendChild(w);
    },
  };

  function footer(S) { const f = el('footer', 'foot'); if (S.footer) f.appendChild(el('p', null, S.footer)); const a = el('a', 'made', '✦ Made with Link World · Get your own page'); a.href = BASE; a.dataset.track = 'lw-badge'; f.appendChild(a); return f; }
  function previewBar() {
    if (window.LW_NO_BAR || /[?&]embed\b/.test(location.search)) return;
    const b = el('div', 'pbar'), t = el('div', 'pt'), a = el('a');
    if (EXAMPLE) { t.append(el('b', null, 'An example Link World page'), el('small', null, 'Yours is designed from your own Instagram')); a.textContent = 'Make yours'; a.href = BASE + '#start'; a.dataset.track = 'make'; }
    else { t.append(el('b', null, 'This is your page preview'), el('small', null, 'Own it to put it live at your own link')); a.textContent = 'Own this page'; a.href = BASE + 'own/' + location.hash; a.dataset.track = 'own'; }
    const x = el('button', null, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Hide this bar'); x.addEventListener('click', () => b.remove());
    b.append(t, a, x); document.body.appendChild(b);
  }

  async function main() {
    let S = null;
    try { const raw = await readSpec(); if (raw) S = check(raw); } catch (e) { S = null; }
    if (!S) { document.body.className = 'empty'; const o = el('p', 'oops'); o.append('This link has no page in it, or it was cut short. '); const a = el('a', null, 'Make your page on Link World'); a.href = BASE; o.appendChild(a); document.body.appendChild(o); return; }
    window.LW_PAGE = S;
    applyTheme(S.theme);
    document.title = S.name + (S.handle ? ' (@' + S.handle + ')' : '') + ' · Link World';
    document.body.className = ['L-' + S.layout, 'bg-' + S.theme.bgStyle, 'b-' + S.theme.buttons, 'c-' + S.theme.cards, 'r-' + S.theme.radius].join(' ');
    const root = el('div', 'page'); root.appendChild(el('div', 'bgfx'));
    LAY[S.layout](root, S); root.appendChild(footer(S)); document.body.appendChild(root);
    if (S.hero.art.type === 'emoji' || S.sections.some(s => s.type === 'gallery' && s.items.some(i => i.emoji))) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap'; document.head.appendChild(l); }
    previewBar();
    /* stats: every link carries data-track. Only owned pages count (previews would muddle the numbers), and only when
       a stats service is set in assets/config.js (stats/worker.js) */
    const src = new URLSearchParams(location.search).get('utm_source');
    const track = (type, id) => { if (window.LW_OWNED && window.LW_STATS_URL && navigator.sendBeacon) navigator.sendBeacon(window.LW_STATS_URL, JSON.stringify({ page: S.page, type, id: id || null, from: document.referrer || null, src, width: innerWidth })); };
    track('view'); document.addEventListener('click', ev => { const a = ev.target.closest('[data-track]'); if (a) track('click', a.dataset.track); });
    document.documentElement.classList.add('ready');
  }
  window.LW_check = check;
  main();
})();
