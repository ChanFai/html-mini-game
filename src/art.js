export const FIGHTERS = [
  { id: 'nailong', name: 'Nailong', nickname: 'The belly of the beast', role: 'HEAVY HITTER', color: '#f8ce43', background: '#f6e6a5', ink: '#8e6522', power: 5, speed: 2, special: 'Belly Bounce', tagline: 'No thoughts. Just belly.', health: 120, moveSpeed: 245 },
  { id: 'pepe', name: 'Pepe', nickname: 'Feels like a fight, man', role: 'ALL-ROUNDER', color: '#91b98a', background: '#dce8d5', ink: '#4b6a43', power: 3, speed: 4, special: 'Feels Blast', tagline: 'Feels violent, man.', health: 105, moveSpeed: 295 },
  { id: 'tung', name: 'Tung Tung', nickname: 'Your 3 a.m. alarm', role: 'WILD CARD', color: '#c89167', background: '#ebd9c9', ink: '#82563a', power: 5, speed: 2, special: 'Sahur Slam', tagline: 'You heard the knocking.', health: 115, moveSpeed: 255 },
  { id: 'capy', name: 'Capy Boss', nickname: 'Unbothered. Undefeated.', role: 'TANK', color: '#c7a780', background: '#dce6eb', ink: '#705c43', power: 4, speed: 2, special: 'Zen Shockwave', tagline: 'Pull up. Chill out.', health: 135, moveSpeed: 225 },
  { id: 'hajimi', name: 'Hajimi', nickname: 'Orange cat activities', role: 'SPEED DEMON', color: '#e79c5b', background: '#eddded', ink: '#895625', power: 2, speed: 5, special: 'Zoomies', tagline: 'One brain cell. All violence.', health: 95, moveSpeed: 345 },
];

const skins = {
  yellow: { body: '#f6cc43', shadow: '#e9ad2d', belly: '#fff0bb', light: '#ffe994' },
  blue: { body: '#69bee7', shadow: '#3a9cd2', belly: '#c7ecf7', light: '#a8e0f6' },
  red: { body: '#e9675f', shadow: '#c74442', belly: '#f9bfaf', light: '#ff9a81' },
};

function nailong(skin) {
  const c = skins[skin] || skins.yellow;
  return `<g stroke-linejoin="round" stroke-linecap="round">
    <path d="M103 231C101 246 100 262 103 273Q119 281 137 273L141 241M167 242L171 274Q190 281 207 271L200 232" fill="${c.shadow}"/>
    <path d="M107 236L106 268Q119 274 134 268L137 244M173 244L177 268Q190 275 202 268L197 237" fill="${c.body}"/>
    <path d="M98 111C69 113 51 130 58 150L74 175Q82 183 89 172C86 162 76 148 80 141L107 133M205 111C233 115 252 132 244 151L226 177Q219 183 211 172L224 145Q226 138 197 133" fill="${c.body}"/>
    <path d="M101 81C101 42 115 23 148 23C181 22 198 40 200 78C201 102 213 117 224 144C238 176 237 207 220 231C207 250 180 255 151 255C120 255 91 248 78 228C64 206 69 170 80 144C93 117 100 103 101 81Z" fill="${c.body}" stroke="${c.shadow}" stroke-width=".6"/>
    <ellipse cx="143" cy="167" rx="62" ry="76" fill="${c.light}" opacity=".23"/>
    <path d="M106 74C105 45 122 29 146 28C155 27 169 29 177 35" fill="none" stroke="${c.light}" stroke-width="4" opacity=".5"/>
    <path d="M80 170Q88 180 94 172L99 158Q97 150 91 151L86 159Q80 153 76 158Z" fill="${c.body}"/>
    <path d="M219 171Q213 181 207 172L202 157Q203 149 210 152L216 161Q220 153 224 158Z" fill="${c.body}"/>
    <path d="M83 168L89 171M85 164L92 166M212 165L218 164M210 170L216 169" fill="none" stroke="${c.shadow}" stroke-width="1" opacity=".55"/>
    <ellipse cx="122" cy="65" rx="14" ry="17" fill="${c.shadow}" opacity=".3"/>
    <ellipse cx="178" cy="64" rx="14" ry="17" fill="${c.shadow}" opacity=".3"/>
    <ellipse cx="122" cy="63" rx="12.5" ry="15.8" fill="#dfeb9b"/>
    <ellipse cx="178" cy="62" rx="12.5" ry="15.8" fill="#dfeb9b"/>
    <ellipse cx="123" cy="64" rx="8.7" ry="11.7" fill="#789a61"/>
    <ellipse cx="178" cy="63" rx="8.7" ry="11.7" fill="#789a61"/>
    <ellipse cx="124" cy="65" rx="5.9" ry="8" fill="#202c21"/>
    <ellipse cx="178" cy="64" rx="5.9" ry="8" fill="#202c21"/>
    <ellipse cx="121" cy="60" rx="2.4" ry="3" fill="#fffef3" opacity=".9"/>
    <ellipse cx="175" cy="59" rx="2.4" ry="3" fill="#fffef3" opacity=".9"/>
    <circle cx="127" cy="69" r="1" fill="#becfad"/><circle cx="181" cy="68" r="1" fill="#becfad"/>
    <path d="M136 91Q150 94 163 89" fill="none" stroke="#85703c" stroke-width="1.6"/>
    <path d="M140 95Q151 97 160 94" fill="none" stroke="${c.light}" stroke-width="1.7" opacity=".8"/>
    <path d="M133 88L135 87M165 87L167 88" fill="none" stroke="${c.shadow}" stroke-width="1.2"/>
    <ellipse cx="144" cy="188" rx="26" ry="36" fill="${c.light}" opacity=".1"/>
    <path d="M119 247Q151 255 185 247" fill="none" stroke="${c.shadow}" stroke-width="1" opacity=".3"/>
  </g>`;
}

function pepe() {
  return `<g stroke="#34452e" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M104 231L88 264Q86 274 112 274L134 245M164 239L168 269Q182 281 205 270L191 232" fill="#71995b"/>
    <path d="M96 153Q78 174 85 207L98 245Q151 264 199 241L208 186Q201 155 180 150" fill="#7799bf"/>
    <path d="M108 164L116 219M188 167L183 219M95 235Q155 245 201 231" fill="none" stroke="#506d8f"/>
    <path d="M103 81C84 67 74 82 73 108C44 127 51 153 88 165C118 179 187 174 214 152C238 133 222 109 198 104C198 72 182 61 164 83C144 67 125 68 103 81Z" fill="#83ab6b"/>
    <path d="M69 127Q87 108 111 123M153 117Q177 100 201 118" fill="none" stroke="#688d53" stroke-width="5"/>
    <path d="M81 104Q88 79 111 101L113 117L81 116Z" fill="#f7f5d9"/>
    <path d="M147 102Q169 76 186 104L188 118L148 119Z" fill="#f7f5d9"/>
    <path d="M95 104V114M170 103V113" stroke="#283329" stroke-width="7"/>
    <path d="M81 140Q133 124 200 134Q210 141 197 148Q136 165 83 151Q71 147 81 140Z" fill="#b86a53"/>
    <path d="M83 144Q141 149 201 138" fill="none" stroke="#633f32" stroke-width="2.5"/>
    <path d="M91 184Q66 175 55 195Q45 211 61 221Q81 229 97 205" fill="#83ab6b"/>
    <path d="M196 182Q220 163 235 177Q250 198 229 208Q215 213 203 201" fill="#83ab6b"/>
    <path d="M52 194Q66 204 84 202M216 179Q216 192 238 197" fill="none" stroke="#5e824e"/>
    <path d="M95 267l10-2m75 6 10-4" fill="none" stroke-width="2"/>
    <path d="M88 95Q95 89 105 96M157 94Q170 85 180 97" fill="none" stroke="#d4e5b3" stroke-width="3" opacity=".7"/>
    <ellipse cx="94" cy="105" rx="2" ry="3" fill="#fff" stroke="none"/><ellipse cx="169" cy="104" rx="2" ry="3" fill="#fff" stroke="none"/>
    <path d="M81 152Q136 169 189 153M96 157Q99 162 107 162" fill="none" stroke="#c79b6e" opacity=".5" stroke-width="1"/>
    <path d="M110 190Q139 179 181 190M116 219Q147 213 177 218" fill="none" stroke="#b0c5d9" stroke-width="1.4" opacity=".6"/>
    <path d="M127 185L126 210M169 184L173 210" stroke="#eceddc" stroke-width="2"/>
    <rect x="136" y="194" width="26" height="18" rx="5" fill="#6b89ac" stroke="none"/>
    <path d="M143 203h12m-9-4v8m6-8v8" fill="none" stroke="#dbe2d1" stroke-width="1.3"/>
  </g>`;
}

function tung() {
  return `<g stroke="#5a3929" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M115 224L103 267Q93 278 113 277L133 272L142 225M166 225L181 270Q192 280 214 272L196 259L190 218" fill="#c69267"/>
    <path d="M98 67Q103 37 150 32Q190 33 195 60L203 224Q158 246 105 225Z" fill="#c7956d"/>
    <ellipse cx="148" cy="54" rx="47" ry="20" fill="#dbaf85"/>
    <ellipse cx="148" cy="54" rx="31" ry="11" fill="none" stroke="#ae7751" stroke-width="2"/>
    <path d="M106 82L116 216M127 77L127 102M181 78L184 219M149 175L151 226M167 165L170 225M137 192L136 216" stroke="#af7a50" stroke-width="2.5"/>
    <path d="M106 129Q77 148 80 178L95 196M197 127Q228 136 228 168L230 192" fill="none" stroke="#5a3929" stroke-width="15"/>
    <path d="M106 129Q77 148 80 178L95 196M197 127Q228 136 228 168L230 192" fill="none" stroke="#c7956d" stroke-width="9"/>
    <path d="M233 210L220 112Q216 87 229 88Q241 86 242 108L246 206Z" fill="#e2b27d"/>
    <ellipse cx="230" cy="188" rx="12" ry="10" fill="#c7956d"/>
    <ellipse cx="125" cy="110" rx="16" ry="21" fill="#fffaf0"/>
    <ellipse cx="173" cy="109" rx="16" ry="21" fill="#fffaf0"/>
    <ellipse cx="130" cy="113" rx="7" ry="12" fill="#302b26" stroke="none"/>
    <ellipse cx="177" cy="112" rx="7" ry="12" fill="#302b26" stroke="none"/>
    <circle cx="132" cy="108" r="2.5" fill="#fff" stroke="none"/>
    <circle cx="179" cy="107" r="2.5" fill="#fff" stroke="none"/>
    <path d="M142 130Q137 145 148 148L155 146" fill="none" stroke-width="2"/>
    <path d="M127 159Q151 170 181 156Q164 187 139 176Z" fill="#56372b"/>
    <path d="M130 162Q157 170 176 161L171 168Q151 174 138 168Z" fill="#fff4df" stroke="none"/>
    <path d="M111 85Q122 79 138 86M161 84Q175 77 186 85" fill="none" stroke-width="4"/>
    <g fill="none" stroke="#815234" stroke-width=".8" opacity=".35"><path d="M108 82Q103 121 111 153T116 221M120 181Q114 200 121 222M193 77Q186 136 197 171L198 218M157 190Q154 212 161 229M162 79l-2 11M178 182l3 37"/><ellipse cx="123" cy="197" rx="4" ry="10"/><ellipse cx="188" cy="152" rx="3" ry="7"/><path d="M116 53Q147 39 173 53Q145 66 129 54Q142 47 158 53"/></g>
    <path d="M113 72L115 88M109 134L112 157M117 182L120 209M224 100L232 162" stroke="#f5d0a0" stroke-width="2" opacity=".6"/>
    <ellipse cx="127" cy="106" rx="3.5" ry="4" fill="#fff" stroke="none"/><ellipse cx="174" cy="105" rx="3.5" ry="4" fill="#fff" stroke="none"/>
    <path d="M145 166L145 173M154 167L154 174M163 165L163 171" stroke="#bd9975" stroke-width=".8"/>
  </g>`;
}

function capy() {
  return `<g stroke="#554332" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M91 226L82 267Q99 280 122 269L130 234M176 229L177 269Q197 280 219 268L210 224" fill="#b89770"/>
    <path d="M82 162C68 197 71 231 99 243Q155 263 206 239C234 215 215 166 199 151" fill="#c6a57c"/>
    <path d="M124 167C104 195 118 233 146 240Q187 249 197 216L183 171" fill="#d9bd93" stroke="none"/>
    <path d="M79 95Q65 66 80 57Q98 48 108 76M171 68Q170 42 190 48Q208 50 200 78" fill="#b9976e"/>
    <path d="M82 88Q83 65 119 62L174 64Q211 67 212 93L225 116Q245 152 215 170Q183 186 123 176L84 154Q68 129 82 88Z" fill="#c6a57c"/>
    <path d="M174 123Q206 105 226 126Q243 151 218 163Q199 168 179 161" fill="#d7b88e" stroke="none"/>
    <path d="M87 97L131 100L132 115Q116 133 93 118Z" fill="#262a2b"/>
    <path d="M148 101L194 100L190 119Q162 134 151 117Z" fill="#262a2b"/>
    <path d="M132 105L149 106M85 99L76 95" fill="none" stroke-width="6"/>
    <path d="M101 103L112 113M166 105L177 115" stroke="#788481" stroke-width="3"/>
    <path d="M213 139L217 139M200 154Q211 157 220 151" fill="none"/>
    <path d="M98 169Q155 198 209 173L206 186Q165 210 98 184Z" fill="#ef794e"/>
    <path d="M173 192L192 224L203 200L187 188" fill="#ef794e"/>
    <path d="M85 183Q63 179 60 205Q61 226 81 218L101 204M199 191Q226 176 236 194Q244 213 221 219L205 211" fill="#c6a57c"/>
    <path d="M88 266l9-3m89 6 9-3" stroke-width="2"/>
    <path d="M92 102L111 123M100 101L121 123M156 104L175 126M167 104L184 120" stroke="#a7c2ca" stroke-width="3" opacity=".3"/>
    <path d="M102 176Q155 203 205 179M178 199L190 215" fill="none" stroke="#ffd1a0" stroke-width="1.5" opacity=".6"/>
    <g stroke="#806543" stroke-width="1" opacity=".4"><path d="M90 83l3 4m6-9 2 4m15-9 1 3m72 9 2 3m-81 54 2 4m5-5 1 4m-20 77 4 3m-4 7 3 1m-13-33 3 3m105 31-3 2m-53 23 2 2"/></g>
    <path d="M202 146l24 2m-24 4 21 7m-19-17 20-4" stroke="#8f7957" stroke-width=".8" opacity=".4"/>
    <path d="M93 79Q127 62 160 72" fill="none" stroke="#f1dbac" stroke-width="3" opacity=".45"/>
  </g>`;
}

function hajimi() {
  return `<g stroke="#62452e" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M203 220Q254 251 257 196Q257 173 244 176Q236 180 244 203Q247 225 217 206" fill="#e7a064"/>
    <path d="M96 230L86 266Q103 280 125 268L135 238M168 237L177 269Q196 281 217 267L205 229" fill="#e7a064"/>
    <path d="M103 148Q77 172 83 214Q86 250 146 250Q205 252 219 219Q233 181 191 148" fill="#e7a064"/>
    <ellipse cx="153" cy="203" rx="38" ry="43" fill="#fff0d5" stroke="none"/>
    <path d="M85 100L81 46L124 75Q156 64 183 77L220 49L212 113Q236 150 206 165Q151 192 100 166Q68 152 85 100Z" fill="#e7a064"/>
    <path d="M91 62L97 93L117 80M190 82L209 66L204 99" fill="#e7b3a3" stroke="none"/>
    <path d="M144 75L148 95M160 74L162 94M176 78L176 93" stroke="#b77945" stroke-width="7"/>
    <path d="M89 126L105 130M86 140L103 141M207 128L218 124M208 140L221 138" stroke="#b77945" stroke-width="5"/>
    <ellipse cx="122" cy="123" rx="13" ry="17" fill="#fff7db"/>
    <ellipse cx="184" cy="124" rx="13" ry="17" fill="#fff7db"/>
    <ellipse cx="126" cy="126" rx="5" ry="11" fill="#3b4330" stroke="none"/>
    <ellipse cx="181" cy="126" rx="5" ry="11" fill="#3b4330" stroke="none"/>
    <path d="M119 148Q126 137 151 144Q174 138 189 151Q180 170 153 172Q125 171 119 148Z" fill="#fff0d5" stroke="none"/>
    <path d="M147 145L156 145L151 151Z" fill="#b47862" stroke-width="2"/>
    <path d="M151 152Q143 161 137 154M151 152Q158 160 165 155" fill="none" stroke-width="2.5"/>
    <path d="M110 146L77 142M110 155L73 159M196 147L234 140M196 156L235 161" fill="none" stroke-width="2"/>
    <path d="M99 186Q69 164 58 187Q47 208 69 216L95 209M206 183Q228 163 245 186Q254 207 227 213L207 204" fill="#e7a064"/>
    <path d="M58 193L65 195M64 184L70 188M240 190L234 192" stroke-width="2"/>
    <path d="M103 222L94 218M110 234L101 234M198 219L209 214" stroke="#b77945" stroke-width="5"/>
    <ellipse cx="123" cy="124" rx="8" ry="12" fill="#91a064" stroke="none"/><ellipse cx="182" cy="125" rx="8" ry="12" fill="#91a064" stroke="none"/>
    <ellipse cx="125" cy="124" rx="3.5" ry="10" fill="#283b2c" stroke="none"/><ellipse cx="181" cy="125" rx="3.5" ry="10" fill="#283b2c" stroke="none"/>
    <ellipse cx="121" cy="119" rx="3" ry="4" fill="#fff" stroke="none"/><ellipse cx="177" cy="120" rx="3" ry="4" fill="#fff" stroke="none"/>
    <path d="M98 74L106 81M100 79L104 85M204 77L198 85M126 178l2 8 5-6 3 7 5-5M141 224l4 8 4-4 4 6 4-6" stroke="#fff0d5" stroke-width="1.5" opacity=".65" fill="none"/>
    <g stroke="none" fill="#a57b53" opacity=".5"><circle cx="130" cy="150" r="1"/><circle cx="134" cy="147" r="1"/><circle cx="130" cy="155" r="1"/><circle cx="172" cy="149" r="1"/><circle cx="177" cy="146" r="1"/><circle cx="174" cy="154" r="1"/></g>
    <path d="M101 97Q108 83 126 86M170 100Q186 94 195 102" stroke="#ffe0a5" stroke-width="2" opacity=".5" fill="none"/>
  </g>`;
}

// Each embedded portrait owns its paint IDs, including same-character mirror matches.
let portraitSequence = 0;
const materials = {
  '#f6cc43': ['#fff39a', '#ffdb4b', '#d49a16'], '#e9ad2d': ['#fbd457', '#e9b42d', '#bb8016'],
  '#ffe994': ['#fff7b7', '#ffe994', '#efc644'], '#69bee7': ['#c5f2ff', '#7ed4ef', '#348fbe'],
  '#3a9cd2': ['#8cd8ef', '#4badd4', '#237398'], '#e9675f': ['#ffc1a0', '#f88370', '#b93e40'],
  '#c74442': ['#f89275', '#d5594d', '#983235'], '#83ab6b': ['#c7dd95', '#8daf6a', '#517b49'],
  '#71995b': ['#abc686', '#799f60', '#496c40'], '#7799bf': ['#b8cddd', '#7b9ab7', '#455f83'],
  '#b86a53': ['#e6ac85', '#c48367', '#88503f'], '#c7956d': ['#f1c596', '#c28e61', '#7b4d33'],
  '#c69267': ['#e9bc88', '#c18b61', '#7f5033'], '#dbaf85': ['#f7d8ac', '#dcaf7d', '#a07049'],
  '#e2b27d': ['#ffe2b1', '#d7a36e', '#9e663e'], '#c6a57c': ['#ead8b0', '#c5a477', '#90744e'],
  '#b8976e': ['#dcc599', '#b7986c', '#7b603f'], '#b9976e': ['#e0c69c', '#b7986c', '#7b603f'],
  '#d7b88e': ['#f0dfbc', '#d6bb92', '#b0936d'], '#d9bd93': ['#f0dfbc', '#d6bb92', '#b0936d'],
  '#262a2b': ['#829b9d', '#344649', '#182126'], '#ef794e': ['#ffb27b', '#eb7c53', '#ad4639'],
  '#e7a064': ['#ffd7a1', '#e9a268', '#b7703d'], '#fff0d5': ['#fffced', '#f9e9cd', '#d4b994'],
  '#e7b3a3': ['#ffe0cb', '#e8b09c', '#c3877b'], '#f7f5d9': ['#ffffed', '#f3edcb', '#c8c6a0'],
  '#fffaf0': ['#fffef8', '#f2ead7', '#c4b899'], '#dfeb9b': ['#f4f5bc', '#c8d78c', '#93af65'],
  '#789a61': ['#a8b987', '#759465', '#48674b'], '#91a064': ['#c5d28d', '#91aa69', '#556f45'],
};

export function fighterSVG(id, skin = 'yellow', label = '') {
  const drawings = { nailong: () => nailong(skin), pepe, tung, capy, hajimi };
  let artwork = (drawings[id] || drawings.nailong)();
  const prefix = `fighter-${++portraitSequence}`;
  const definitions = [];
  const used = new Set();
  artwork = artwork.replace(/fill="(#[a-fA-F0-9]{6})"/g, (attribute, color) => {
    const palette = materials[color];
    if (!palette) return attribute;
    const paintId = `${prefix}-${color.slice(1)}`;
    if (!used.has(color)) {
      definitions.push(`<radialGradient id="${paintId}" cx="32%" cy="23%" r="78%" fx="28%" fy="18%"><stop stop-color="${palette[0]}"/><stop offset=".52" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></radialGradient>`);
      used.add(color);
    }
    return `fill="url(#${paintId})"`;
  });
  artwork = artwork.replace(/<g stroke="(#[a-fA-F0-9]{6})" stroke-width="3\.\d"/g, '<g stroke="$1" stroke-opacity=".46" stroke-width="1.2"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 300 300" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><defs>${definitions.join('')}</defs>${artwork}</svg>`;
}

export function icon(name, size = 20) {
  const paths = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUp: '<path d="M6 18 18 6M6 6h12v12"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    sound: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 6 6m0-6-6 6"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.1M10 9h.1M14 9h.1M18 9h.1M6 12h.1M10 12h.1M14 12h.1M18 12h.1M7 15h10"/>',
    gamepad: '<path d="M7 7h10c3 0 4 3 5 10 .5 3-2 4-4 2l-3-3H9l-3 3c-2 2-4.5 1-4-2C3 10 4 7 7 7Z"/><path d="M7 9v6m-3-3h6m6-2h.1m3 3h.1"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    rotate: '<rect x="8" y="4" width="9" height="16" rx="2" transform="rotate(30 12 12)"/><path d="M4 10a8 8 0 0 1 6-7M4 5v5h5m11 4a8 8 0 0 1-6 7m6-2v-5h-5"/>',
    shuffle: '<path d="M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c1.5 0 3-2 4-4m4-4c1.4-2 2.6-4 4-4h3m-4-4 4 4-4 4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>',
    trophy: '<path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v5m-5 2h10m-8-2h6"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="4"/>',
    play: '<path d="m8 4 12 8-12 8V4Z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}
