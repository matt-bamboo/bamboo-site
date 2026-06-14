const storyScenes = [
  {
    page: 1,
    title: "The Two Sisters",
    text: "Elizabeth and Scarlet were princess sisters. They loved each other, but sometimes they argued like two tiny storms.",
    key: "two-sisters",
    realm: "castle",
    accent: "#2e9cc6",
    glow: "#ffcf6f",
    spots: [[16, 22], [52, 66], [82, 32]]
  },
  {
    page: 2,
    title: "The Great Race",
    text: "One sunny day, they put on roller skates and raced through the shiny Great Hall.",
    key: "great-race",
    realm: "castle",
    accent: "#18b7e5",
    glow: "#ffef84",
    spots: [[22, 58], [48, 38], [74, 60]]
  },
  {
    page: 3,
    title: "Crash!",
    text: "Scarlet slipped. Elizabeth wobbled. CRASH! The shimmer-blue vase broke into sparkly pieces like blue ice.",
    key: "crash",
    realm: "castle",
    accent: "#32c7ff",
    glow: "#9fe9ff",
    spots: [[36, 68], [52, 54], [70, 66]]
  },
  {
    page: 4,
    title: "Too Worried for Pancakes",
    text: "They were so worried, they did not even eat their heart-shaped pancakes.",
    key: "pancakes",
    realm: "bedroom",
    accent: "#f16d72",
    glow: "#ffe1a4",
    spots: [[24, 44], [54, 64], [78, 48]]
  },
  {
    page: 5,
    title: "Max Knows",
    text: "Max the Butler saw their faces. He knew something had happened.",
    key: "max-knows",
    realm: "bedroom",
    accent: "#8e6bd8",
    glow: "#f9d45d",
    spots: [[19, 25], [54, 60], [83, 32]]
  },
  {
    page: 6,
    title: "The Deal",
    text: "Max promised to keep the secret for now. But the girls had to behave perfectly at the Queen's speech.",
    key: "deal",
    realm: "bedroom",
    accent: "#d6a040",
    glow: "#ffdf7f",
    spots: [[30, 55], [58, 38], [78, 66]]
  },
  {
    page: 7,
    title: "The Speech",
    text: "The Queen gave a long speech. The girls sat very still, even though their dresses were itchy.",
    key: "speech",
    realm: "grounds",
    accent: "#d45d79",
    glow: "#ffc461",
    spots: [[22, 36], [50, 68], [82, 28]]
  },
  {
    page: 8,
    title: "The Ice Cream Truck",
    text: "After the speech, Dad gave them a fifty-dollar bill for treats. Scarlet got bubble-gum eyes. Elizabeth got the flag one.",
    key: "ice-cream-truck",
    realm: "grounds",
    accent: "#30a7dd",
    glow: "#fff182",
    spots: [[20, 64], [52, 42], [78, 58]]
  },
  {
    page: 9,
    title: "Operation Ice Cream",
    text: "That night, the girls used their secret fair coins for one more treat. It was a sneaky heist!",
    key: "heist",
    realm: "night-castle",
    accent: "#806ee8",
    glow: "#d8c3ff",
    spots: [[20, 34], [50, 66], [80, 28]]
  },
  {
    page: 10,
    title: "Caught!",
    text: "The next morning, Max saw chocolate on their faces. The girls had to clean his butler room for a week.",
    key: "caught",
    realm: "bedroom",
    accent: "#9a5f3e",
    glow: "#ffc06d",
    spots: [[24, 56], [52, 34], [78, 70]]
  },
  {
    page: 11,
    title: "Max Gets Caught Too",
    text: "At Sky Zone, Max tried to spy on them. But his rainbow tie gave him away.",
    key: "sky-zone",
    realm: "skyzone",
    accent: "#ff6a9c",
    glow: "#7ce6ff",
    spots: [[16, 48], [50, 72], [82, 42]]
  },
  {
    page: 12,
    title: "The Soda Punishment",
    text: "The girls made Max buy medium sodas and clean their room. Fair is fair!",
    key: "sodas",
    realm: "car",
    accent: "#ff8a31",
    glow: "#b8f1ff",
    spots: [[22, 60], [52, 34], [78, 58]]
  },
  {
    page: 13,
    title: "The Math Test",
    text: "At school, Ms. Ironfist gave a hard math test. Scarlet had to move to a different class.",
    key: "math-test",
    realm: "school",
    accent: "#5168b8",
    glow: "#ffd15c",
    spots: [[24, 42], [55, 72], [80, 35]]
  },
  {
    page: 14,
    title: "Together Again",
    text: "Elizabeth helped Scarlet study every day. Soon Scarlet passed and came back to class.",
    key: "together-again",
    realm: "school",
    accent: "#4bbd96",
    glow: "#fff07a",
    spots: [[22, 62], [49, 38], [75, 66]]
  },
  {
    page: 15,
    title: "Mrs. Rosie",
    text: "When Ms. Ironfist got sick, Mrs. Rosie came in a sunflower dress and made school feel bright.",
    key: "mrs-rosie",
    realm: "school",
    accent: "#f5b834",
    glow: "#fff186",
    spots: [[18, 36], [52, 56], [82, 30]]
  },
  {
    page: 16,
    title: "The Ladybug Room",
    text: "The girls got a new room with glowing stars, painted ladybugs, and a secret water slide.",
    key: "ladybug-room",
    realm: "ladybug",
    accent: "#e84e5d",
    glow: "#8ee9ff",
    spots: [[18, 26], [50, 44], [78, 68]]
  },
  {
    page: 17,
    title: "The Whispering Voice",
    text: "A walkie-talkie crackled: Find the star behind the bunk.",
    key: "whispering-voice",
    realm: "ladybug-night",
    accent: "#7d65e8",
    glow: "#f8e77a",
    spots: [[24, 34], [54, 64], [80, 40]]
  },
  {
    page: 18,
    title: "The Field Trip Note",
    text: "In the Whispering Woods, the girls found a note: Meet me at the Crystal Cave.",
    key: "field-trip-note",
    realm: "woods",
    accent: "#6fb96c",
    glow: "#c5a2ff",
    spots: [[20, 54], [48, 38], [82, 62]]
  },
  {
    page: 19,
    title: "The Crystal Cave",
    text: "At a family picnic, they slipped away and found a cave full of purple crystals.",
    key: "crystal-cave",
    realm: "cave",
    accent: "#8e54e9",
    glow: "#d8b5ff",
    spots: [[18, 40], [50, 66], [82, 38]]
  },
  {
    page: 20,
    title: "The Mechanical Owl",
    text: "A brass owl tapped a box. Inside was a blue piece of the broken vase.",
    key: "mechanical-owl",
    realm: "cave",
    accent: "#c58d34",
    glow: "#9fe8ff",
    spots: [[30, 46], [54, 62], [78, 36]]
  },
  {
    page: 21,
    title: "Max the Castle Keeper",
    text: "The clue led to the Clocktower. Max was not just a butler. He was the Castle Keeper!",
    key: "castle-keeper",
    realm: "clocktower",
    accent: "#cf9d36",
    glow: "#ffeb8b",
    spots: [[22, 32], [52, 54], [82, 38]]
  },
  {
    page: 22,
    title: "Golden Glue",
    text: "Max gave them golden glue. The girls fixed the vase until it looked even more beautiful.",
    key: "golden-glue",
    realm: "clocktower",
    accent: "#2e9cc6",
    glow: "#ffd54a",
    spots: [[26, 58], [52, 38], [78, 62]]
  },
  {
    page: 23,
    title: "Telling the Truth",
    text: "They showed Mom the before-and-after pictures. Mom hugged them and forgave them.",
    key: "truth",
    realm: "library",
    accent: "#d26d61",
    glow: "#ffe19a",
    spots: [[22, 42], [52, 64], [78, 44]]
  },
  {
    page: 24,
    title: "The Egg",
    text: "In the cave behind the waterfall, the girls found a glowing emerald-and-gold egg.",
    key: "egg",
    realm: "waterfall-cave",
    accent: "#22a77b",
    glow: "#e9c95e",
    spots: [[18, 36], [50, 62], [84, 40]]
  },
  {
    page: 25,
    title: "Cinder Hatches",
    text: "The egg cracked open. Out came Cinder, a baby dragon with violet eyes.",
    key: "cinder-hatches",
    realm: "waterfall-cave",
    accent: "#14a77c",
    glow: "#a978ff",
    spots: [[24, 36], [52, 62], [78, 42]]
  },
  {
    page: 26,
    title: "Marshmallow Feast",
    text: "Cinder loved warm milk and boiled marshmallows. He heated them with tiny golden fire.",
    key: "marshmallows",
    realm: "waterfall-cave",
    accent: "#e3a242",
    glow: "#ffe67c",
    spots: [[22, 62], [50, 42], [78, 58]]
  },
  {
    page: 27,
    title: "Echo-Vision",
    text: "Cinder could hum and show pictures on the cave wall. Then he showed someone following them.",
    key: "echo-vision",
    realm: "waterfall-cave",
    accent: "#6c73ff",
    glow: "#88f0ff",
    spots: [[20, 42], [52, 64], [82, 32]]
  },
  {
    page: 28,
    title: "The Secret Wall",
    text: "Cinder helped build a hidden rock wall to keep the cave safe.",
    key: "secret-wall",
    realm: "waterfall-cave",
    accent: "#7a9b8f",
    glow: "#c6f4ff",
    spots: [[24, 62], [50, 44], [78, 64]]
  },
  {
    page: 29,
    title: "First Flight",
    text: "With Max's Vibe-Link bracelets, Cinder took his first secret flight through the waterfall mist.",
    key: "first-flight",
    realm: "waterfall-cave",
    accent: "#22a77b",
    glow: "#ffe182",
    spots: [[20, 36], [52, 58], [84, 42]]
  },
  {
    page: 30,
    title: "The Next Adventure",
    text: "In Hawaii, the girls met Leilani. The ocean caves whispered, and Cinder's story grew even bigger.",
    key: "next-adventure",
    realm: "beach",
    accent: "#ff8a64",
    glow: "#76e5ff",
    spots: [[20, 44], [52, 62], [82, 38]]
  }
];

const realmPalettes = {
  castle: ["#74d5ff", "#ffe8a8", "#f7f0dc", "#5c77bd"],
  bedroom: ["#ffd5be", "#fff2d7", "#f4d6e8", "#8e6bd8"],
  "night-castle": ["#1e2552", "#4c3b86", "#211b43", "#d8c3ff"],
  grounds: ["#91e2ff", "#ffe3a8", "#a8db78", "#d45d79"],
  skyzone: ["#83e9ff", "#ffe8fa", "#4c5bd6", "#ff6a9c"],
  car: ["#a8eaff", "#ffe4b4", "#455a7e", "#ff8a31"],
  school: ["#a3d9ff", "#fff1bd", "#b8dcc0", "#496ab3"],
  ladybug: ["#a9ecff", "#fff6d5", "#f9c2c7", "#e84e5d"],
  "ladybug-night": ["#171b4d", "#47317a", "#241943", "#f8e77a"],
  woods: ["#99d6ff", "#e7f3b0", "#5f9f62", "#8e54e9"],
  cave: ["#302050", "#5b3d8c", "#21182e", "#b18cff"],
  clocktower: ["#facd78", "#fff0bc", "#8f6735", "#cf9d36"],
  library: ["#f2c78f", "#ffe7c4", "#7d4d36", "#d26d61"],
  "waterfall-cave": ["#2b4e71", "#6bd0ed", "#143346", "#38c99c"],
  beach: ["#66cfff", "#ffd08b", "#75d5c4", "#ff8a64"]
};

let activePage = 1;
let speechUtterance = null;

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function padPage(page) {
  return String(page).padStart(2, "0");
}

function palette(scene) {
  return realmPalettes[scene.realm] || realmPalettes.castle;
}

function renderStory() {
  const scenesRoot = document.querySelector("#story-scenes");
  const progressRoot = document.querySelector("#story-progress");
  if (!scenesRoot || !progressRoot) return;

  scenesRoot.innerHTML = storyScenes.map(renderScene).join("");
  progressRoot.innerHTML = storyScenes.map(scene => `
    <a href="#page-${padPage(scene.page)}" aria-label="Go to page ${scene.page}" data-progress-page="${scene.page}">
      <span>${scene.page}</span>
    </a>
  `).join("");

  bindStoryEvents();
  updateActivePage(1);
}

function renderScene(scene) {
  const nextScene = storyScenes[scene.page] || storyScenes[0];
  return `
    <section
      id="page-${padPage(scene.page)}"
      class="story-scene scene-${esc(scene.realm)} moment-${esc(scene.key)}"
      data-page="${scene.page}"
      style="--scene-accent: ${scene.accent}; --scene-glow: ${scene.glow};"
      aria-labelledby="scene-heading-${scene.page}"
    >
      <div class="scene-art" aria-hidden="true">
        ${renderSceneArt(scene)}
        ${scene.spots.map(([left, top], index) => `
          <button
            class="story-hotspot"
            type="button"
            data-hotspot
            aria-label="Awaken page ${scene.page} magic ${index + 1}"
            style="--spot-left: ${left}%; --spot-top: ${top}%;"
          ><span></span></button>
        `).join("")}
      </div>
      <article class="story-card">
        <p class="story-kicker">Page ${padPage(scene.page)}</p>
        <h2 id="scene-heading-${scene.page}">${esc(scene.title)}</h2>
        <p>${esc(scene.text)}</p>
        <div class="scene-actions">
          <button type="button" class="scene-read" data-speak="${scene.page}">Read</button>
          <a href="#page-${padPage(nextScene.page)}">${scene.page === storyScenes.length ? "Again" : "Next"}</a>
        </div>
      </article>
    </section>
  `;
}

function renderSceneArt(scene) {
  const [sky, light, ground, deep] = palette(scene);
  const id = `scene-${scene.page}`;
  return `
    <svg class="scene-svg" viewBox="0 0 1200 780" role="img" aria-labelledby="${id}-title ${id}-desc">
      <title id="${id}-title">${esc(scene.title)}</title>
      <desc id="${id}-desc">${esc(scene.text)}</desc>
      <defs>
        <linearGradient id="${id}-sky" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${sky}"/>
          <stop offset="54%" stop-color="${light}"/>
          <stop offset="100%" stop-color="${ground}"/>
        </linearGradient>
        <linearGradient id="${id}-floor" x1="0" x2="1">
          <stop offset="0%" stop-color="${ground}"/>
          <stop offset="55%" stop-color="#fff8df"/>
          <stop offset="100%" stop-color="${scene.accent}"/>
        </linearGradient>
        <radialGradient id="${id}-glow" cx="50%" cy="48%" r="44%">
          <stop offset="0%" stop-color="${scene.glow}" stop-opacity=".82"/>
          <stop offset="100%" stop-color="${scene.glow}" stop-opacity="0"/>
        </radialGradient>
        <filter id="${id}-soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#1b1420" flood-opacity=".2"/>
        </filter>
      </defs>
      ${renderWorld(scene, id, sky, light, ground, deep)}
      ${renderMoment(scene)}
      ${renderSparkField(scene.page)}
    </svg>
  `;
}

function renderWorld(scene, id, sky, light, ground, deep) {
  const base = `
    <rect width="1200" height="780" fill="url(#${id}-sky)"/>
    <circle class="scene-glow" cx="670" cy="322" r="350" fill="url(#${id}-glow)"/>
  `;

  if (scene.realm === "castle") {
    return `${base}
      <g class="castle-world">
        <path d="M0 575 C168 522 332 598 504 552 C690 500 856 566 1016 520 C1102 496 1160 504 1200 490 L1200 780 L0 780 Z" fill="url(#${id}-floor)" opacity=".96"/>
        <path d="M84 168 h1032 v422 h-1032 Z" fill="#fff6df" opacity=".76"/>
        <path d="M130 124 h130 v466 h-130 Z M394 124 h130 v466 h-130 Z M674 124 h130 v466 h-130 Z M940 124 h130 v466 h-130 Z" fill="#fffdf0" opacity=".82"/>
        <g class="stained-glass" opacity=".84">
          <path d="M172 208 h74 v156 h-74 Z M436 208 h74 v156 h-74 Z M716 208 h74 v156 h-74 Z M982 208 h74 v156 h-74 Z" fill="#7edcff"/>
          <path d="M172 208 l74 156 M246 208 l-74 156 M436 208 l74 156 M510 208 l-74 156 M716 208 l74 156 M790 208 l-74 156 M982 208 l74 156 M1056 208 l-74 156" stroke="#f0c665" stroke-width="7"/>
        </g>
        <path d="M0 626 h1200" stroke="#cda04a" stroke-width="8" opacity=".4"/>
        <path d="M86 702 C260 650 430 736 604 690 C780 642 930 720 1112 676" fill="none" stroke="#ffffff" stroke-width="24" opacity=".32"/>
      </g>`;
  }

  if (scene.realm === "bedroom" || scene.realm === "ladybug" || scene.realm === "ladybug-night") {
    const night = scene.realm === "ladybug-night";
    return `${base}
      <g class="bedroom-world">
        <path d="M0 596 C208 548 358 616 548 572 C750 524 926 594 1200 538 L1200 780 L0 780 Z" fill="${night ? "#241943" : "#ffe6c8"}"/>
        <rect x="90" y="108" width="1020" height="500" rx="34" fill="${night ? "#211946" : "#fff4de"}" opacity=".72"/>
        <rect x="152" y="150" width="182" height="188" rx="18" fill="${night ? "#3c3178" : "#9ee3ff"}"/>
        <path d="M243 150 v188 M152 244 h182" stroke="#ffffff" stroke-width="10" opacity=".48"/>
        <g class="bunk-bed" filter="url(#${id}-soft-shadow)">
          <rect x="706" y="236" width="304" height="92" rx="20" fill="#f9d58b"/>
          <rect x="706" y="420" width="304" height="92" rx="20" fill="#f9d58b"/>
          <path d="M700 212 v340 M1016 212 v340 M742 328 v92 M968 328 v92" stroke="#8f6735" stroke-width="18" stroke-linecap="round"/>
          <rect x="724" y="250" width="150" height="52" rx="18" fill="#93dff2"/>
          <rect x="724" y="434" width="150" height="52" rx="18" fill="#ff9aa4"/>
        </g>
        ${scene.realm.startsWith("ladybug") ? renderLadybugDetails(night) : ""}
      </g>`;
  }

  if (scene.realm === "night-castle") {
    return `${base}
      <g class="night-hall-world">
        <path d="M0 600 C226 540 362 636 556 582 C740 530 924 604 1200 532 L1200 780 L0 780 Z" fill="#211b43"/>
        <rect x="80" y="126" width="1040" height="488" rx="34" fill="#221d4d" opacity=".86"/>
        <g opacity=".72">
          <rect x="160" y="178" width="110" height="196" rx="56" fill="#443780"/>
          <rect x="468" y="178" width="110" height="196" rx="56" fill="#443780"/>
          <rect x="778" y="178" width="110" height="196" rx="56" fill="#443780"/>
          <path d="M214 210 v142 M522 210 v142 M832 210 v142" stroke="#d8c3ff" stroke-width="10" opacity=".38"/>
        </g>
        <circle cx="986" cy="132" r="54" fill="#f8e77a" opacity=".82"/>
      </g>`;
  }

  if (scene.realm === "grounds") {
    return `${base}
      <g class="grounds-world">
        <path d="M0 560 C178 518 320 588 494 540 C704 482 868 570 1200 500 L1200 780 L0 780 Z" fill="#91c66f"/>
        <path d="M86 490 C260 444 348 492 454 456 C616 400 748 496 908 438 C1012 400 1102 424 1200 392 L1200 565 C920 620 670 604 422 622 C226 636 102 610 0 648 L0 554 Z" fill="#b6e08a" opacity=".88"/>
        <path d="M98 182 h1004 v86 h-1004 Z" fill="#fff2cc" opacity=".5"/>
        <path d="M168 210 h116 v216 h-116 Z M918 210 h116 v216 h-116 Z" fill="#fff7df" opacity=".64"/>
        <path d="M220 124 l54 -66 l54 66 Z M970 124 l54 -66 l54 66 Z" fill="#6181c7"/>
      </g>`;
  }

  if (scene.realm === "skyzone") {
    return `${base}
      <g class="skyzone-world">
        <rect x="80" y="122" width="1040" height="478" rx="34" fill="#f9f2ff" opacity=".82"/>
        <path d="M0 590 C180 540 378 618 568 574 C742 532 956 584 1200 520 L1200 780 L0 780 Z" fill="#3342ba"/>
        <g class="trampolines" fill="none" stroke="#7ce6ff" stroke-width="16">
          <path d="M140 620 h260 l60 76 h-380 Z"/>
          <path d="M484 610 h260 l60 80 h-380 Z"/>
          <path d="M820 618 h260 l60 74 h-380 Z"/>
        </g>
        <path d="M236 216 h732" stroke="#ff6a9c" stroke-width="20" stroke-linecap="round" opacity=".65"/>
      </g>`;
  }

  if (scene.realm === "car") {
    return `${base}
      <g class="car-world">
        <path d="M0 540 C208 508 390 596 582 542 C756 494 944 568 1200 504 L1200 780 L0 780 Z" fill="#f0c06f"/>
        <rect x="86" y="184" width="1028" height="410" rx="72" fill="#384966" filter="url(#${id}-soft-shadow)"/>
        <rect x="154" y="226" width="362" height="152" rx="36" fill="#a8eaff"/>
        <rect x="684" y="226" width="362" height="152" rx="36" fill="#a8eaff"/>
        <path d="M110 538 h980" stroke="#27364d" stroke-width="74" stroke-linecap="round"/>
        <path d="M404 510 h392" stroke="#ffdf8c" stroke-width="24" stroke-linecap="round" opacity=".62"/>
      </g>`;
  }

  if (scene.realm === "school") {
    return `${base}
      <g class="school-world">
        <rect x="90" y="118" width="1020" height="500" rx="34" fill="#fff8df" opacity=".86"/>
        <rect x="190" y="170" width="490" height="236" rx="18" fill="#2f7a61"/>
        <path d="M232 232 h404 M232 292 h322 M232 352 h378" stroke="#dff6d6" stroke-width="8" opacity=".54"/>
        <path d="M0 610 C168 560 356 632 558 586 C736 548 966 604 1200 546 L1200 780 L0 780 Z" fill="#d6b483"/>
        <g class="desks" fill="#c88548">
          <path d="M220 536 h196 l-28 96 h-196 Z"/>
          <path d="M540 542 h196 l-28 94 h-196 Z"/>
          <path d="M860 536 h196 l-28 96 h-196 Z"/>
        </g>
      </g>`;
  }

  if (scene.realm === "woods") {
    return `${base}
      <g class="woods-world">
        <path d="M0 574 C168 518 326 600 506 548 C708 492 882 570 1200 500 L1200 780 L0 780 Z" fill="#5f9f62"/>
        ${tree(128, 506, 1.25, "#3d7b4f")}
        ${tree(332, 502, 1.05, "#4f9359")}
        ${tree(924, 506, 1.22, "#3f7c54")}
        ${tree(1086, 510, .94, "#5fa166")}
        <path d="M456 666 C536 580 650 560 744 668" fill="none" stroke="#dfc68e" stroke-width="62" stroke-linecap="round" opacity=".72"/>
      </g>`;
  }

  if (scene.realm === "cave" || scene.realm === "waterfall-cave") {
    const waterfall = scene.realm === "waterfall-cave";
    return `${base}
      <g class="cave-world">
        <path d="M0 590 C190 520 330 650 530 560 C718 474 902 594 1200 502 L1200 780 L0 780 Z" fill="#161a2a"/>
        <path d="M-40 0 C180 110 130 360 300 448 C430 516 420 650 306 780 L-40 780 Z" fill="#132838" opacity=".92"/>
        <path d="M1240 0 C1028 138 1070 344 890 468 C760 558 788 666 910 780 L1240 780 Z" fill="#132838" opacity=".92"/>
        ${waterfall ? `<path class="waterfall" d="M774 22 C720 180 770 330 708 486 C670 584 668 670 722 780 h164 C814 650 848 544 830 442 C800 276 852 162 872 22 Z" fill="#9cecff" opacity=".68"/>` : ""}
        <g class="crystals">
          <path d="M160 642 l48 -168 l54 168 Z M240 660 l74 -218 l72 218 Z M890 648 l52 -184 l66 184 Z M990 666 l78 -250 l82 250 Z" fill="#9e72ff" opacity=".82"/>
          <path d="M186 628 l22 -118 l20 118 M286 642 l28 -158 l34 158 M942 636 l24 -136 l30 136" stroke="#f4dcff" stroke-width="8" opacity=".44"/>
        </g>
      </g>`;
  }

  if (scene.realm === "clocktower") {
    return `${base}
      <g class="clocktower-world">
        <path d="M0 590 C190 542 334 624 526 574 C700 530 916 602 1200 540 L1200 780 L0 780 Z" fill="#8f6735"/>
        <rect x="180" y="116" width="840" height="520" rx="30" fill="#fff0bc" opacity=".8"/>
        <circle cx="600" cy="300" r="132" fill="#fbe5a2" stroke="#8f6735" stroke-width="20"/>
        <path d="M600 300 v-82 M600 300 h78" stroke="#8f6735" stroke-width="16" stroke-linecap="round"/>
        ${gear(290, 476, 64)}
        ${gear(892, 470, 80)}
        ${gear(720, 530, 48)}
      </g>`;
  }

  if (scene.realm === "library") {
    return `${base}
      <g class="library-world">
        <rect x="80" y="100" width="1040" height="520" rx="34" fill="#8a563b" opacity=".88"/>
        <g class="books" opacity=".92">
          ${bookRows(140, 150)}
          ${bookRows(720, 150)}
        </g>
        <path d="M0 612 C170 558 352 630 554 586 C742 548 958 604 1200 540 L1200 780 L0 780 Z" fill="#e7c18a"/>
      </g>`;
  }

  if (scene.realm === "beach") {
    return `${base}
      <g class="beach-world">
        <path d="M0 478 C210 430 360 520 560 470 C740 426 916 500 1200 430 L1200 612 C966 658 744 614 554 650 C346 690 178 636 0 692 Z" fill="#49bfe3" opacity=".85"/>
        <path d="M0 618 C190 568 390 646 590 604 C768 566 960 632 1200 560 L1200 780 L0 780 Z" fill="#ffd08b"/>
        <path d="M910 510 C958 386 1078 350 1200 398 L1200 780 L906 780 C826 680 840 590 910 510 Z" fill="#3b4661"/>
        <path d="M968 560 C1018 512 1088 526 1130 592 C1074 584 1026 600 1000 654 C970 632 954 596 968 560 Z" fill="#1f2639"/>
        <circle cx="208" cy="164" r="74" fill="#ffde77" opacity=".88"/>
      </g>`;
  }

  return `${base}<path d="M0 600 h1200 v180 h-1200 Z" fill="url(#${id}-floor)"/>`;
}

function renderMoment(scene) {
  switch (scene.key) {
    case "two-sisters":
      return `${sisterPair(520, 560, { tug: true, skates: false })}${tinyStorm(374, 236)}${tinyStorm(798, 220)}`;
    case "great-race":
      return `${motionLines(244, 600)}${sisterPair(550, 568, { skates: true, race: true })}${vase(916, 500, .72)}`;
    case "crash":
      return `${sisterPair(512, 548, { skates: true, startled: true })}${shatteredVase(720, 620, 1.1)}`;
    case "pancakes":
      return `${bed(260, 548)}${sisterPair(440, 560, { seated: true, worried: true })}${pancakes(782, 512)}${shardBundle(925, 626)}`;
    case "max-knows":
      return `${bed(278, 558)}${max(840, 520, 1.08)}${sisterPair(506, 574, { worried: true })}`;
    case "deal":
      return `${max(780, 522, 1)}${sisterPair(470, 570, { worried: true })}${shardBundle(620, 636)}${promiseSpark(690, 406)}`;
    case "speech":
      return `${queen(600, 408, 1.05)}${stage(600, 494)}${sisterPair(440, 634, { seated: true, stiff: true })}${max(900, 592, .72)}${lanterns()}`;
    case "ice-cream-truck":
      return `${iceCreamTruck(686, 522)}${sisterPair(426, 610, { treats: true })}${cashBill(370, 468)}`;
    case "heist":
      return `${sisterPair(558, 592, { sneaky: true })}${coinJar(710, 596)}${moonBeam(238, 230)}`;
    case "caught":
      return `${bed(260, 552)}${max(814, 526, 1)}${sisterPair(500, 588, { chocolate: true })}${sundaes(336, 642)}`;
    case "sky-zone":
      return `${sisterPair(482, 480, { jumping: true })}${max(868, 524, .9, { hiddenTie: true })}${bounceStars()}`;
    case "sodas":
      return `${max(842, 464, .78)}${sisterPair(474, 534, { seated: true, sodas: true })}${sodaCups(438, 612)}`;
    case "math-test":
      return `${teacher(832, 432, "ironfist")}${sisterPair(470, 552, { desks: true, worried: true })}${mathPapers(514, 618)}`;
    case "together-again":
      return `${flashcards(360, 452)}${sisterPair(540, 548, { hug: true })}${successStars(732, 338)}`;
    case "mrs-rosie":
      return `${teacher(760, 430, "rosie")}${sisterPair(460, 558, { cheerful: true })}${juiceBoxes(608, 620)}${sunflowers(812, 304)}`;
    case "ladybug-room":
      return `${sisterPair(416, 578, { amazed: true })}${secretSlide(860, 536)}${glowStars()}${ladybugs()}`;
    case "whispering-voice":
      return `${sisterPair(430, 584, { amazed: true })}${walkieTalkie(608, 608)}${carvedStar(880, 330)}${soundWaves(630, 520)}`;
    case "field-trip-note":
      return `${sisterPair(492, 610, { explorer: true })}${hollowTreeNote(720, 520)}${teacher(940, 582, "rosie", .64)}`;
    case "crystal-cave":
      return `${sisterPair(456, 610, { amazed: true })}${waterfallVines(770, 336)}${picnic(250, 628)}`;
    case "mechanical-owl":
      return `${sisterPair(390, 606, { curious: true })}${mechanicalOwl(704, 496)}${woodenBox(846, 602)}${blueShard(846, 548)}`;
    case "castle-keeper":
      return `${max(612, 518, 1.12, { keeper: true })}${sisterPair(376, 610, { amazed: true })}${gear(840, 296, 56)}${gear(930, 420, 44)}`;
    case "golden-glue":
      return `${sisterPair(430, 612, { focused: true })}${max(846, 560, .86, { keeper: true })}${repairedVase(610, 540, true)}${goldenGlue(530, 600)}`;
    case "truth":
      return `${momHug(560, 566)}${repairedVase(836, 534, true)}${pictureCards(334, 536)}`;
    case "egg":
      return `${sisterPair(418, 610, { amazed: true })}${dragonEgg(680, 560, false)}${silverMoss(680, 640)}`;
    case "cinder-hatches":
      return `${sisterPair(376, 622, { amazed: true })}${dragonEgg(650, 574, true)}${dragon(742, 552, .86)}${hatchGlow(700, 520)}`;
    case "marshmallows":
      return `${sisterPair(402, 616, { cheerful: true })}${dragon(686, 566, .86)}${marshmallowPot(796, 628)}${goldFire(750, 612)}`;
    case "echo-vision":
      return `${sisterPair(386, 622, { alert: true })}${dragon(646, 588, .78)}${echoVision(802, 366)}`;
    case "secret-wall":
      return `${sisterPair(398, 630, { working: true })}${dragon(650, 594, .78)}${rockWall(828, 604)}${silverMist(734, 520)}`;
    case "first-flight":
      return `${sisterPair(398, 634, { bracelets: true })}${dragon(746, 404, .78, { flying: true })}${flightTrail(590, 442)}`;
    case "next-adventure":
      return `${sisterPair(392, 626, { explorer: true })}${leilani(584, 612, .9)}${dragon(936, 596, .58)}${oceanWhisper(1022, 492)}`;
    default:
      return sisterPair(520, 560, {});
  }
}

function girl(kind, x, y, scale = 1, options = {}) {
  const isElizabeth = kind === "elizabeth";
  const hair = isElizabeth ? "#b97a38" : "#9b4f34";
  const dress = isElizabeth ? "#1586b4" : "#da5856";
  const dark = isElizabeth ? "#245b83" : "#98363c";
  const skate = isElizabeth ? "#20d8ff" : "#ff4b57";
  const hairPath = isElizabeth
    ? `<path d="M-34 -88 q24 -42 72 -18 q-2 -36 -50 -38 q-42 8 -54 54 Z" fill="${hair}"/><path d="M18 -104 q28 46 10 96" fill="none" stroke="${hair}" stroke-width="14" stroke-linecap="round"/>`
    : `<path d="M-46 -80 q20 -62 88 -24 q10 56 -18 82 q-8 -38 -70 -58 Z" fill="${hair}"/>`;
  const arms = options.tug
    ? `<path d="M-48 -8 q-44 28 -88 4" stroke="#f4c29a" stroke-width="14" stroke-linecap="round"/><path d="M48 -8 q44 28 88 4" stroke="#f4c29a" stroke-width="14" stroke-linecap="round"/>`
    : options.working
      ? `<path d="M-48 0 q-38 40 -72 86" stroke="#f4c29a" stroke-width="14" stroke-linecap="round"/><path d="M48 0 q42 34 78 74" stroke="#f4c29a" stroke-width="14" stroke-linecap="round"/>`
      : `<path d="M-48 -8 q-34 28 -58 42" stroke="#f4c29a" stroke-width="14" stroke-linecap="round"/><path d="M48 -8 q34 28 58 42" stroke="#f4c29a" stroke-width="14" stroke-linecap="round"/>`;
  const body = options.seated || options.desks
    ? `<path d="M-42 -42 h84 l22 98 h-128 Z" fill="${dress}"/><path d="M-38 54 q-28 38 -60 42 M38 54 q32 38 66 42" stroke="${dark}" stroke-width="16" stroke-linecap="round"/>`
    : `<path d="M-44 -42 h88 l30 124 h-148 Z" fill="${dress}"/><path d="M-34 80 v72 M34 80 v72" stroke="${dark}" stroke-width="17" stroke-linecap="round"/>`;
  const feet = options.skates || options.race
    ? `<path d="M-58 160 h72 M4 160 h74" stroke="${skate}" stroke-width="13" stroke-linecap="round"/><circle cx="-50" cy="170" r="5" fill="#17233b"/><circle cx="4" cy="170" r="5" fill="#17233b"/><circle cx="12" cy="170" r="5" fill="#17233b"/><circle cx="70" cy="170" r="5" fill="#17233b"/>`
    : `<path d="M-54 160 h62 M10 160 h64" stroke="${dark}" stroke-width="13" stroke-linecap="round"/>`;
  const face = options.worried
    ? `<path d="M-12 -82 q10 -8 20 0 M16 -68 q8 12 20 0" fill="none" stroke="#5b382a" stroke-width="5" stroke-linecap="round"/>`
    : options.chocolate
      ? `<circle cx="-12" cy="-78" r="4" fill="#50321f"/><circle cx="18" cy="-78" r="4" fill="#50321f"/><circle cx="8" cy="-62" r="8" fill="#6f4324"/>`
      : `<circle cx="-12" cy="-78" r="4" fill="#513827"/><circle cx="18" cy="-78" r="4" fill="#513827"/><path d="M-8 -62 q14 12 30 0" fill="none" stroke="#513827" stroke-width="5" stroke-linecap="round"/>`;
  const accessory = options.sodas
    ? `<rect x="${isElizabeth ? -72 : 56}" y="4" width="34" height="78" rx="12" fill="${isElizabeth ? "#7d47b7" : "#ff8a31"}"/><path d="M${isElizabeth ? -55 : 73} -10 v18" stroke="#fff" stroke-width="5"/>`
    : options.treats
      ? `<circle cx="${isElizabeth ? -78 : 80}" cy="-8" r="18" fill="${isElizabeth ? "#3669d9" : "#ff66a6"}"/><rect x="${isElizabeth ? -84 : 74}" y="6" width="12" height="46" rx="5" fill="#d8a25a"/>`
      : options.bracelets
        ? `<circle cx="-58" cy="26" r="9" fill="#65e8ff"/><circle cx="58" cy="26" r="9" fill="#65e8ff"/>`
        : "";

  return `
    <g class="story-person story-girl ${kind}" transform="translate(${x} ${y}) scale(${scale})">
      <circle cx="0" cy="-80" r="34" fill="#f4c29a"/>
      ${hairPath}
      ${face}
      ${arms}
      ${body}
      ${feet}
      ${accessory}
    </g>
  `;
}

function sisterPair(x, y, options = {}) {
  const spread = options.hug ? 54 : options.tug ? 96 : 78;
  const lift = options.jumping ? -88 : 0;
  const scale = options.seated ? .82 : options.desks ? .72 : .88;
  const pairOptions = {
    ...options,
    tug: options.tug,
    working: options.working
  };
  const extra = options.desks
    ? `<rect x="${x - 178}" y="${y + 34}" width="356" height="82" rx="18" fill="#c88548"/><path d="M${x - 150} ${y + 78} h300" stroke="#8f4e28" stroke-width="8" opacity=".46"/>`
    : "";
  const hug = options.hug
    ? `<path class="hug-line" d="M${x - 58} ${y - 10} C${x - 16} ${y + 32} ${x + 16} ${y + 32} ${x + 58} ${y - 10}" fill="none" stroke="#fff6c7" stroke-width="12" stroke-linecap="round"/>`
    : "";
  return `
    <g class="sister-pair ${options.race ? "is-racing" : ""} ${options.jumping ? "is-jumping" : ""} ${options.sneaky ? "is-sneaky" : ""}">
      ${extra}
      ${girl("elizabeth", x - spread, y + lift, scale, pairOptions)}
      ${girl("scarlet", x + spread, y + lift + (options.race ? 10 : 0), scale, pairOptions)}
      ${hug}
    </g>
  `;
}

function max(x, y, scale = 1, options = {}) {
  const tie = options.hiddenTie ? "M-8 -20 l16 0 l24 92 l-32 26 l-32 -26 Z" : "M-9 -28 l18 0 l20 76 l-29 26 l-29 -26 Z";
  return `
    <g class="story-person max ${options.keeper ? "is-keeper" : ""} ${options.hiddenTie ? "hidden-tie" : ""}" transform="translate(${x} ${y}) scale(${scale})">
      ${options.hiddenTie ? `<rect x="-106" y="-154" width="118" height="258" rx="16" fill="#54607e"/>` : ""}
      <circle cx="0" cy="-112" r="36" fill="#e9b98e"/>
      <path d="M-36 -120 q28 -42 72 0 q-16 -46 -72 0 Z" fill="#433229"/>
      <path d="M-34 -98 q34 22 68 0" stroke="#3a241f" stroke-width="10" stroke-linecap="round"/>
      ${options.keeper ? `<circle cx="-16" cy="-118" r="15" fill="none" stroke="#422f24" stroke-width="7"/><circle cx="18" cy="-118" r="15" fill="none" stroke="#422f24" stroke-width="7"/><path d="M-1 -118 h4" stroke="#422f24" stroke-width="7"/>` : ""}
      <path d="M-54 -70 h108 l44 188 h-196 Z" fill="${options.keeper ? "#705338" : "#ffffff"}"/>
      <path d="${tie}" fill="url(#rainbowTie)"/>
      <path d="M-70 -46 q-58 42 -88 82 M70 -46 q58 42 88 82" stroke="#e9b98e" stroke-width="17" stroke-linecap="round"/>
      <path d="M-36 116 v80 M36 116 v80" stroke="#202020" stroke-width="18" stroke-linecap="round"/>
      <path d="M-60 204 h62 M8 204 h62" stroke="#101010" stroke-width="14" stroke-linecap="round"/>
      ${options.keeper ? `<path d="M-88 -36 h176" stroke="#d49a37" stroke-width="18" opacity=".75"/><path d="M82 30 h44 v68 h-44 Z" fill="#d49a37"/>` : ""}
      <defs>
        <linearGradient id="rainbowTie" x1="0" x2="1">
          <stop offset="0%" stop-color="#ff4b57"/>
          <stop offset="25%" stop-color="#ffcf4f"/>
          <stop offset="50%" stop-color="#38c99c"/>
          <stop offset="75%" stop-color="#36a9ff"/>
          <stop offset="100%" stop-color="#935ef0"/>
        </linearGradient>
      </defs>
    </g>
  `;
}

function queen(x, y, scale = 1) {
  return `
    <g class="story-person queen" transform="translate(${x} ${y}) scale(${scale})">
      <path d="M-34 -144 l20 -38 l18 38 l22 -42 l22 42 l20 -38 l20 38 Z" fill="#f8d76a"/>
      <circle cx="28" cy="-120" r="38" fill="#efbd96"/>
      <path d="M-24 -80 h106 l42 178 h-190 Z" fill="#c44e78"/>
      <path d="M-70 28 h194" stroke="#ffe8a4" stroke-width="16" stroke-linecap="round"/>
    </g>
  `;
}

function teacher(x, y, kind = "ironfist", scale = .88) {
  const rosie = kind === "rosie";
  return `
    <g class="story-person teacher ${rosie ? "rosie" : "ironfist"}" transform="translate(${x} ${y}) scale(${scale})">
      <circle cx="0" cy="-90" r="34" fill="#e9b98e"/>
      <path d="M-36 -100 q30 -42 72 0 q-8 -52 -72 0 Z" fill="${rosie ? "#7a4e35" : "#2f2a29"}"/>
      <path d="M-48 -54 h96 l36 144 h-168 Z" fill="${rosie ? "#ffd64a" : "#56617a"}"/>
      ${rosie ? `<g fill="#8b663a"><circle cx="-24" cy="-20" r="10"/><circle cx="18" cy="12" r="10"/><circle cx="0" cy="46" r="10"/></g>` : `<path d="M70 -46 l96 -50" stroke="#5d3b22" stroke-width="10" stroke-linecap="round"/>`}
      <path d="M-62 -34 q-40 34 -70 70 M62 -34 q42 34 72 70" stroke="#e9b98e" stroke-width="14" stroke-linecap="round"/>
      <path d="M-34 88 v82 M34 88 v82" stroke="#2e3040" stroke-width="16" stroke-linecap="round"/>
    </g>
  `;
}

function leilani(x, y, scale = 1) {
  return `
    <g class="story-person leilani" transform="translate(${x} ${y}) scale(${scale})">
      <circle cx="0" cy="-84" r="34" fill="#b9794f"/>
      <path d="M-42 -98 q26 -54 84 -8 q4 58 -20 86 q-4 -50 -64 -78 Z" fill="#3d2b24"/>
      <path d="M-46 -44 h92 l32 124 h-156 Z" fill="#39a9a4"/>
      <circle cx="0" cy="-22" r="10" fill="#a8f0ef"/>
      <path d="M-52 -8 q-40 34 -72 72 M52 -8 q42 34 74 72" stroke="#b9794f" stroke-width="14" stroke-linecap="round"/>
      <path d="M-34 80 v70 M34 80 v70" stroke="#256c71" stroke-width="17" stroke-linecap="round"/>
      <path d="M-54 158 h62 M10 158 h64" stroke="#256c71" stroke-width="13" stroke-linecap="round"/>
    </g>
  `;
}

function dragon(x, y, scale = 1, options = {}) {
  return `
    <g class="cinder ${options.flying ? "is-flying" : ""}" transform="translate(${x} ${y}) scale(${scale})">
      <path d="M-90 8 C-34 -46 70 -34 116 18 C72 10 42 32 20 70 C-20 84 -78 66 -90 8 Z" fill="#137d67"/>
      <path d="M-84 10 C-130 -28 -174 -10 -196 42 C-136 36 -104 58 -76 100 C-50 74 -50 36 -84 10 Z" fill="#70d2b6" opacity=".88"/>
      <path d="M42 0 C80 -52 142 -30 154 20 C118 12 94 34 76 70 C42 64 28 28 42 0 Z" fill="#70d2b6" opacity=".88"/>
      <circle cx="96" cy="-18" r="38" fill="#23a27f"/>
      <circle cx="110" cy="-26" r="7" fill="#7a50cc"/>
      <path d="M72 -54 l15 -34 l14 38 Z M116 -54 l20 -30 l8 40 Z" fill="#e5be58"/>
      <path d="M-94 54 q-66 20 -104 86" fill="none" stroke="#e5be58" stroke-width="14" stroke-linecap="round"/>
      <circle cx="18" cy="30" r="14" fill="#d3a94a" opacity=".8"/>
    </g>
  `;
}

function momHug(x, y) {
  return `
    <g class="mom-hug">
      ${queen(x, y - 28, .9)}
      ${girl("elizabeth", x - 78, y + 58, .72, { cheerful: true })}
      ${girl("scarlet", x + 78, y + 58, .72, { cheerful: true })}
      <path d="M${x - 154} ${y - 24} C${x - 64} ${y + 86} ${x + 64} ${y + 86} ${x + 154} ${y - 24}" fill="none" stroke="#ffe8a4" stroke-width="20" stroke-linecap="round"/>
    </g>
  `;
}

function renderSparkField(page) {
  return `
    <g class="svg-spark-field" fill="#fff6b8">
      <path style="--delay: ${page * 30}ms" d="M156 164 l10 22 l24 10 l-24 10 l-10 24 l-10 -24 l-24 -10 l24 -10 Z"/>
      <path style="--delay: ${page * 45}ms" d="M1024 174 l12 28 l30 12 l-30 12 l-12 30 l-12 -30 l-30 -12 l30 -12 Z"/>
      <path style="--delay: ${page * 58}ms" d="M982 648 l8 18 l20 8 l-20 8 l-8 20 l-8 -20 l-20 -8 l20 -8 Z"/>
    </g>
  `;
}

function tree(x, y, scale, color) {
  return `
    <g class="tree" transform="translate(${x} ${y}) scale(${scale})">
      <path d="M-20 80 h40 v-150 h-40 Z" fill="#6a4329"/>
      <circle cx="-42" cy="-78" r="72" fill="${color}"/>
      <circle cx="28" cy="-106" r="76" fill="${color}"/>
      <circle cx="70" cy="-36" r="64" fill="${color}"/>
    </g>
  `;
}

function gear(x, y, r) {
  return `
    <g class="gear" transform="translate(${x} ${y})">
      ${Array.from({ length: 12 }, (_, i) => {
        const a = i * 30;
        return `<rect x="${-r * .12}" y="${-r * 1.26}" width="${r * .24}" height="${r * .34}" rx="${r * .04}" fill="#c89235" transform="rotate(${a})"/>`;
      }).join("")}
      <circle r="${r}" fill="#d9ad51"/>
      <circle r="${r * .52}" fill="#fff0bc"/>
      <circle r="${r * .18}" fill="#8f6735"/>
    </g>
  `;
}

function bookRows(x, y) {
  const colors = ["#e66565", "#f4bb4f", "#5dbf9d", "#5f83d8", "#b56be0"];
  return Array.from({ length: 3 }, (_, row) => {
    const top = y + row * 120;
    const books = Array.from({ length: 10 }, (_, i) => {
      const w = 28 + ((i + row) % 4) * 7;
      const h = 78 + ((i + row) % 3) * 14;
      const left = x + i * 48;
      return `<rect x="${left}" y="${top + 88 - h}" width="${w}" height="${h}" rx="4" fill="${colors[(i + row) % colors.length]}"/>`;
    }).join("");
    return `<g>${books}<path d="M${x - 18} ${top + 94} h520" stroke="#5c3628" stroke-width="12" stroke-linecap="round"/></g>`;
  }).join("");
}

function renderLadybugDetails(night = false) {
  return `
    <g class="room-stars" fill="${night ? "#f8e77a" : "#fff7a6"}">
      ${[220, 390, 554, 686, 938, 1030].map((x, i) => `<path d="M${x} ${150 + (i % 3) * 56} l10 22 l24 10 l-24 10 l-10 24 l-10 -24 l-24 -10 l24 -10 Z"/>`).join("")}
    </g>
    <g class="ladybug-dots">
      ${[170, 450, 608, 820, 1040].map((x, i) => `<g transform="translate(${x} ${408 + (i % 2) * 70})"><circle r="18" fill="#e84e5d"/><path d="M0 -18 v36" stroke="#251417" stroke-width="5"/><circle cx="-7" cy="-6" r="4" fill="#251417"/><circle cx="8" cy="7" r="4" fill="#251417"/></g>`).join("")}
    </g>
  `;
}

function stage(x, y) {
  return `<path d="M${x - 230} ${y + 48} h460 l58 98 h-576 Z" fill="#8f4f4e"/><path d="M${x - 194} ${y + 34} h388" stroke="#ffd56a" stroke-width="18" stroke-linecap="round"/>`;
}

function lanterns() {
  return `<g class="lanterns">${[178, 342, 858, 1024].map((x, i) => `<g transform="translate(${x} ${210 + (i % 2) * 34})"><path d="M0 -70 v70" stroke="#705338" stroke-width="6"/><rect x="-24" y="0" width="48" height="62" rx="18" fill="#ffcf6f"/><path d="M-18 20 h36 M-18 42 h36" stroke="#b96b40" stroke-width="5"/></g>`).join("")}</g>`;
}

function bed(x, y) {
  return `
    <g class="bed" transform="translate(${x} ${y})">
      <rect x="-194" y="-124" width="388" height="150" rx="28" fill="#f7c98c"/>
      <rect x="-172" y="-104" width="154" height="76" rx="24" fill="#9ee3ff"/>
      <rect x="-24" y="-104" width="176" height="76" rx="24" fill="#ff9aa4"/>
      <path d="M-210 28 h420" stroke="#7d4d36" stroke-width="22" stroke-linecap="round"/>
    </g>
  `;
}

function pancakes(x, y) {
  return `
    <g class="pancakes" transform="translate(${x} ${y})">
      <ellipse cx="0" cy="78" rx="116" ry="28" fill="#f3f0e5"/>
      <path d="M-52 28 C-96 -14 -30 -54 0 -20 C30 -54 96 -14 52 28 L0 78 Z" fill="#e0a852"/>
      <circle cx="-18" cy="18" r="10" fill="#d6424b"/>
      <circle cx="28" cy="16" r="9" fill="#4e7fc6"/>
      <path d="M-4 -18 q18 34 48 42" fill="none" stroke="#fff2ce" stroke-width="14" stroke-linecap="round"/>
    </g>
  `;
}

function shardBundle(x, y) {
  return `<g class="shard-bundle" transform="translate(${x} ${y})"><path d="M-78 34 q70 -88 150 0 q-70 48 -150 0 Z" fill="#e9d1a3"/><path d="M-34 18 l28 -70 l36 68 l48 -40 l-10 74 l-92 12 Z" fill="#55ceff" opacity=".86"/></g>`;
}

function vase(x, y, scale = 1) {
  return `<g class="vase" transform="translate(${x} ${y}) scale(${scale})"><path d="M-44 -112 h88 q-16 52 32 128 q26 80 -76 104 q-102 -24 -76 -104 q48 -76 32 -128 Z" fill="#32c7ff"/><path d="M-28 -94 h56 M-44 36 q44 32 88 0" stroke="#e9fbff" stroke-width="10" stroke-linecap="round" opacity=".6"/></g>`;
}

function shatteredVase(x, y, scale = 1) {
  return `<g class="shattered-vase" transform="translate(${x} ${y}) scale(${scale})"><path d="M-124 44 l56 -128 l34 106 Z M-28 60 l40 -156 l52 134 Z M64 54 l70 -110 l20 128 Z" fill="#32c7ff" opacity=".88"/><g fill="#b8f1ff"><circle cx="-140" cy="78" r="12"/><circle cx="-58" cy="98" r="8"/><circle cx="104" cy="86" r="10"/><circle cx="166" cy="58" r="7"/></g></g>`;
}

function promiseSpark(x, y) {
  return `<g class="promise-spark" transform="translate(${x} ${y})"><circle r="64" fill="#ffdf7f" opacity=".42"/><path d="M0 -60 l18 40 l44 18 l-44 18 l-18 44 l-18 -44 l-44 -18 l44 -18 Z" fill="#fff6b8"/></g>`;
}

function iceCreamTruck(x, y) {
  return `
    <g class="ice-cream-truck" transform="translate(${x} ${y})">
      <rect x="-220" y="-132" width="410" height="208" rx="30" fill="#fff3c8"/>
      <rect x="-204" y="-110" width="126" height="92" rx="18" fill="#7edcff"/>
      <rect x="-44" y="-104" width="162" height="78" rx="16" fill="#ff9fb8"/>
      <path d="M-232 -132 h436 l-42 -74 h-350 Z" fill="#41bee1"/>
      <path d="M-222 -56 h414" stroke="#ff6a9c" stroke-width="20"/>
      <circle cx="-122" cy="92" r="44" fill="#2b3048"/>
      <circle cx="114" cy="92" r="44" fill="#2b3048"/>
      <circle cx="-122" cy="92" r="20" fill="#d8f5ff"/>
      <circle cx="114" cy="92" r="20" fill="#d8f5ff"/>
    </g>
  `;
}

function cashBill(x, y) {
  return `<g class="cash-bill" transform="translate(${x} ${y}) rotate(-8)"><rect x="-48" y="-24" width="96" height="48" rx="8" fill="#a2d87d"/><circle r="17" fill="#eaffc8"/><path d="M-34 0 h68" stroke="#5b9948" stroke-width="5"/></g>`;
}

function coinJar(x, y) {
  return `<g class="coin-jar" transform="translate(${x} ${y})"><rect x="-48" y="-82" width="96" height="126" rx="26" fill="#aeeaff" opacity=".62" stroke="#e9fbff" stroke-width="8"/><rect x="-34" y="-104" width="68" height="32" rx="10" fill="#d3a052"/><g fill="#ffdf7f"><circle cx="-22" cy="-12" r="14"/><circle cx="18" cy="8" r="14"/><circle cx="0" cy="28" r="14"/></g></g>`;
}

function moonBeam(x, y) {
  return `<path class="moonbeam" d="M${x} ${y} C${x + 120} ${y + 110} ${x + 180} ${y + 260} ${x + 260} ${y + 470}" stroke="#d8c3ff" stroke-width="70" stroke-linecap="round" opacity=".28"/>`;
}

function sundaes(x, y) {
  return `<g class="sundaes" transform="translate(${x} ${y})"><path d="M-86 0 h70 l-14 74 h-42 Z M36 -4 h70 l-14 74 h-42 Z" fill="#f2f0ec"/><path d="M-80 -18 q36 -42 72 0 M42 -22 q36 -42 72 0" fill="none" stroke="#6b3e24" stroke-width="20" stroke-linecap="round"/></g>`;
}

function bounceStars() {
  return `<g class="bounce-stars" fill="#fff6b8">${[260, 530, 732].map((x, i) => `<path d="M${x} ${240 + i * 22} l12 28 l30 12 l-30 12 l-12 30 l-12 -30 l-30 -12 l30 -12 Z"/>`).join("")}</g>`;
}

function sodaCups(x, y) {
  return `<g class="soda-cups" transform="translate(${x} ${y})"><rect x="-94" y="-88" width="52" height="118" rx="18" fill="#7d47b7"/><rect x="42" y="-88" width="52" height="118" rx="18" fill="#ff8a31"/><path d="M-68 -126 v44 M68 -126 v44" stroke="#fff" stroke-width="8" stroke-linecap="round"/></g>`;
}

function mathPapers(x, y) {
  return `<g class="math-papers" transform="translate(${x} ${y}) rotate(-3)"><rect x="-70" y="-44" width="140" height="92" rx="10" fill="#fffdf2"/><path d="M-42 -18 h84 M-42 10 h54 M-42 36 h72" stroke="#496ab3" stroke-width="6"/><path d="M28 -30 l34 34" stroke="#e24b5a" stroke-width="8" stroke-linecap="round"/></g>`;
}

function flashcards(x, y) {
  return `<g class="flashcards" transform="translate(${x} ${y})"><rect x="-94" y="-58" width="122" height="86" rx="12" fill="#fffdf2" transform="rotate(-10)"/><rect x="-34" y="-44" width="122" height="86" rx="12" fill="#fff7c5" transform="rotate(8)"/><path d="M-60 -10 h54 M8 -2 h52" stroke="#4bbd96" stroke-width="7"/></g>`;
}

function successStars(x, y) {
  return `<g class="success-stars" fill="#fff176">${[0, 76, 150].map((offset, i) => `<path d="M${x + offset} ${y + i * 42} l12 28 l30 12 l-30 12 l-12 30 l-12 -30 l-30 -12 l30 -12 Z"/>`).join("")}</g>`;
}

function juiceBoxes(x, y) {
  return `<g class="juice-boxes" transform="translate(${x} ${y})"><rect x="-68" y="-80" width="48" height="92" rx="8" fill="#ff8a31"/><rect x="22" y="-80" width="48" height="92" rx="8" fill="#7d47b7"/><path d="M-44 -102 l16 24 M44 -102 l16 24" stroke="#fff" stroke-width="5"/></g>`;
}

function sunflowers(x, y) {
  return `<g class="sunflowers" transform="translate(${x} ${y})">${[0, 72, 144].map(offset => `<g transform="translate(${offset} 0)"><circle r="18" fill="#7d4d23"/><g fill="#ffd64a"><ellipse cx="0" cy="-32" rx="9" ry="22"/><ellipse cx="0" cy="32" rx="9" ry="22"/><ellipse cx="-32" cy="0" rx="22" ry="9"/><ellipse cx="32" cy="0" rx="22" ry="9"/></g></g>`).join("")}</g>`;
}

function secretSlide(x, y) {
  return `<path class="secret-slide" d="M${x - 170} ${y - 250} C${x + 120} ${y - 160} ${x - 50} ${y + 90} ${x + 210} ${y + 150}" fill="none" stroke="#60d6ff" stroke-width="54" stroke-linecap="round"/><path d="M${x + 144} ${y + 136} q60 18 108 -12" stroke="#24a7da" stroke-width="18" stroke-linecap="round"/>`;
}

function glowStars() {
  return `<g class="glow-stars" fill="#fff7a6">${[220, 364, 520, 662, 918, 1040].map((x, i) => `<path d="M${x} ${154 + (i % 3) * 58} l10 22 l24 10 l-24 10 l-10 24 l-10 -24 l-24 -10 l24 -10 Z"/>`).join("")}</g>`;
}

function ladybugs() {
  return `<g class="ladybugs">${[180, 512, 988].map((x, i) => `<g transform="translate(${x} ${430 + i * 62})"><circle r="20" fill="#e84e5d"/><path d="M0 -18 v36" stroke="#251417" stroke-width="5"/><circle cx="-8" cy="-6" r="4" fill="#251417"/><circle cx="8" cy="7" r="4" fill="#251417"/></g>`).join("")}</g>`;
}

function walkieTalkie(x, y) {
  return `<g class="walkie" transform="translate(${x} ${y}) rotate(-8)"><rect x="-42" y="-98" width="84" height="142" rx="18" fill="#374264"/><path d="M-12 -98 v-60" stroke="#374264" stroke-width="8" stroke-linecap="round"/><circle cx="0" cy="-42" r="22" fill="#8ee9ff"/><path d="M-22 12 h44" stroke="#8ee9ff" stroke-width="8" stroke-linecap="round"/></g>`;
}

function carvedStar(x, y) {
  return `<g class="carved-star" transform="translate(${x} ${y})"><path d="M0 -70 l18 46 l50 2 l-40 30 l14 50 l-42 -30 l-42 30 l14 -50 l-40 -30 l50 -2 Z" fill="#f8e77a" opacity=".78"/><path d="M-68 86 h136" stroke="#8f6735" stroke-width="18" stroke-linecap="round"/></g>`;
}

function soundWaves(x, y) {
  return `<g class="sound-waves" fill="none" stroke="#f8e77a" stroke-width="9" stroke-linecap="round"><path d="M${x} ${y} q58 -46 116 0"/><path d="M${x - 28} ${y - 34} q86 -72 172 0"/><path d="M${x - 56} ${y - 70} q114 -98 228 0"/></g>`;
}

function hollowTreeNote(x, y) {
  return `<g class="hollow-note" transform="translate(${x} ${y})"><path d="M-82 126 h164 v-246 q-84 -40 -164 0 Z" fill="#6a4329"/><ellipse cy="8" rx="54" ry="72" fill="#2c1d18"/><rect x="-34" y="-4" width="80" height="54" rx="8" fill="#eee8ff" transform="rotate(-8)"/><path d="M-10 20 h38" stroke="#8e54e9" stroke-width="6"/></g>`;
}

function waterfallVines(x, y) {
  return `<g class="waterfall-vines"><path d="M${x} ${y - 240} C${x - 50} ${y - 88} ${x + 28} ${y + 16} ${x - 34} ${y + 204}" stroke="#9cecff" stroke-width="58" stroke-linecap="round" opacity=".72"/><path d="M${x - 170} ${y - 210} q54 136 8 300 M${x + 140} ${y - 230} q-72 142 -16 330" stroke="#3d7b4f" stroke-width="18" stroke-linecap="round"/></g>`;
}

function picnic(x, y) {
  return `<g class="picnic" transform="translate(${x} ${y})"><path d="M-92 30 h184 l38 66 h-260 Z" fill="#e94f5d"/><path d="M-78 44 h156 M-48 30 v76 M12 30 v76 M72 30 v76" stroke="#fff7df" stroke-width="8" opacity=".8"/></g>`;
}

function mechanicalOwl(x, y) {
  return `<g class="mechanical-owl" transform="translate(${x} ${y})"><path d="M-92 28 q4 -114 92 -146 q88 32 92 146 q-20 118 -92 128 q-72 -10 -92 -128 Z" fill="#bd8841"/><circle cx="-34" cy="-28" r="32" fill="#ffe7a4"/><circle cx="34" cy="-28" r="32" fill="#ffe7a4"/><circle cx="-34" cy="-28" r="10" fill="#32c7ff"/><circle cx="34" cy="-28" r="10" fill="#32c7ff"/><path d="M0 -2 l24 36 h-48 Z" fill="#e7c15f"/><path d="M-112 30 q-62 0 -92 54 M112 30 q62 0 92 54" stroke="#d8a052" stroke-width="24" stroke-linecap="round"/></g>`;
}

function woodenBox(x, y) {
  return `<g class="wooden-box" transform="translate(${x} ${y})"><rect x="-82" y="-48" width="164" height="96" rx="12" fill="#8d572b"/><path d="M-82 -10 h164 M-32 -48 v96 M32 -48 v96" stroke="#c88844" stroke-width="8"/></g>`;
}

function blueShard(x, y) {
  return `<path class="blue-shard" d="M${x - 28} ${y - 64} l52 -38 l40 94 l-92 22 Z" fill="#55ceff" opacity=".9"/>`;
}

function repairedVase(x, y, gold = false) {
  return `<g class="repaired-vase" transform="translate(${x} ${y})"><path d="M-58 -120 h116 q-20 58 40 140 q28 92 -98 120 q-126 -28 -98 -120 q60 -82 40 -140 Z" fill="#32c7ff"/><path d="M-28 -92 q44 34 8 78 q54 36 14 122 M26 -78 q-30 64 38 108 q-42 34 -12 82" fill="none" stroke="${gold ? "#ffd54a" : "#e9fbff"}" stroke-width="10" stroke-linecap="round"/><path d="M-36 -96 h72" stroke="#e9fbff" stroke-width="10" stroke-linecap="round" opacity=".62"/></g>`;
}

function goldenGlue(x, y) {
  return `<g class="golden-glue" transform="translate(${x} ${y}) rotate(-18)"><rect x="-34" y="-92" width="68" height="132" rx="18" fill="#ffd54a"/><path d="M-20 -92 h40 l16 -42 h-72 Z" fill="#fff0a4"/><path d="M18 26 q76 -4 104 -62" stroke="#ffd54a" stroke-width="14" stroke-linecap="round"/></g>`;
}

function pictureCards(x, y) {
  return `<g class="picture-cards" transform="translate(${x} ${y})"><rect x="-92" y="-70" width="110" height="92" rx="10" fill="#fffdf2" transform="rotate(-8)"/><rect x="-8" y="-54" width="110" height="92" rx="10" fill="#fffdf2" transform="rotate(8)"/><path d="M-70 -20 l40 -28 l28 42 M20 -10 l38 -28 l32 42" stroke="#32c7ff" stroke-width="7" fill="none"/></g>`;
}

function dragonEgg(x, y, cracked = false) {
  return `<g class="dragon-egg ${cracked ? "is-cracked" : ""}" transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="78" ry="112" fill="#28a77d"/><path d="M-42 -64 q44 -60 90 4 q-28 44 -12 102 q-56 32 -94 -16 q34 -44 16 -90 Z" fill="#e9c95e" opacity=".76"/><path d="M-36 -26 l32 30 l-18 28 l42 22 l-4 44" stroke="#fff4b3" stroke-width="8" fill="none" opacity="${cracked ? ".9" : ".3"}"/></g>`;
}

function silverMoss(x, y) {
  return `<path class="silver-moss" d="M${x - 150} ${y} C${x - 78} ${y - 56} ${x + 86} ${y - 54} ${x + 154} ${y + 4} C${x + 70} ${y + 52} ${x - 84} ${y + 48} ${x - 150} ${y} Z" fill="#c7d9ce" opacity=".82"/>`;
}

function hatchGlow(x, y) {
  return `<circle class="hatch-glow" cx="${x}" cy="${y}" r="154" fill="#e9c95e" opacity=".32"/>`;
}

function marshmallowPot(x, y) {
  return `<g class="marshmallow-pot" transform="translate(${x} ${y})"><path d="M-96 -34 h192 l-24 82 h-144 Z" fill="#6c5b5b"/><ellipse cy="-34" rx="96" ry="30" fill="#f9f0dc"/><g fill="#fffdf8"><circle cx="-38" cy="-48" r="18"/><circle cx="12" cy="-54" r="18"/><circle cx="54" cy="-42" r="16"/></g></g>`;
}

function goldFire(x, y) {
  return `<g class="gold-fire" transform="translate(${x} ${y})"><path d="M0 64 C-44 14 -20 -36 8 -70 C6 -22 58 -8 32 58 Z" fill="#ffd54a"/><path d="M4 44 C-18 12 -4 -18 12 -36 C14 -8 38 4 24 40 Z" fill="#ff8a31"/></g>`;
}

function echoVision(x, y) {
  return `<g class="echo-vision" transform="translate(${x} ${y})"><rect x="-170" y="-116" width="340" height="232" rx="32" fill="#88f0ff" opacity=".32" stroke="#c9fbff" stroke-width="10"/><path d="M-96 46 q78 -150 192 0" fill="none" stroke="#374264" stroke-width="20" stroke-linecap="round" opacity=".74"/><circle cy="-28" r="36" fill="#374264" opacity=".74"/><path d="M-202 -10 q-66 38 -102 118 M202 -10 q66 38 102 118" stroke="#88f0ff" stroke-width="12" stroke-linecap="round" opacity=".6"/></g>`;
}

function rockWall(x, y) {
  return `<g class="rock-wall" transform="translate(${x} ${y})">${[[-110, 20, 72], [-42, -28, 86], [46, 12, 76], [118, -38, 66], [-86, 92, 80], [2, 78, 92], [100, 84, 82]].map(([cx, cy, r], i) => `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * .62}" fill="${i % 2 ? "#73837d" : "#8fa19b"}"/>`).join("")}</g>`;
}

function silverMist(x, y) {
  return `<g class="silver-mist" fill="none" stroke="#c6f4ff" stroke-width="18" stroke-linecap="round" opacity=".72"><path d="M${x - 180} ${y} C${x - 80} ${y - 90} ${x + 48} ${y + 60} ${x + 190} ${y - 26}"/><path d="M${x - 120} ${y + 58} C${x - 40} ${y + 10} ${x + 86} ${y + 110} ${x + 170} ${y + 52}"/></g>`;
}

function flightTrail(x, y) {
  return `<path class="flight-trail" d="M${x - 220} ${y + 88} C${x - 90} ${y - 20} ${x + 80} ${y + 40} ${x + 240} ${y - 108}" fill="none" stroke="#ffe182" stroke-width="22" stroke-linecap="round" opacity=".78"/>`;
}

function oceanWhisper(x, y) {
  return `<g class="ocean-whisper" fill="none" stroke="#76e5ff" stroke-width="12" stroke-linecap="round"><path d="M${x - 120} ${y} q62 -44 124 0 t124 0"/><path d="M${x - 132} ${y + 44} q72 -42 144 0 t144 0"/></g>`;
}

function tinyStorm(x, y) {
  return `<g class="tiny-storm" transform="translate(${x} ${y})"><path d="M-74 24 q30 -70 92 -28 q60 -26 84 28 q-24 54 -88 30 q-56 30 -88 -30 Z" fill="#d9f5ff" opacity=".72"/><path d="M-16 68 l-18 58 l46 -46 l-8 60 l52 -76" stroke="#ffcf6f" stroke-width="10" stroke-linecap="round"/></g>`;
}

function motionLines(x, y) {
  return `<g class="motion-lines" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity=".66"><path d="M${x} ${y} h172"/><path d="M${x + 34} ${y - 58} h224"/><path d="M${x - 18} ${y + 56} h140"/></g>`;
}

function bindStoryEvents() {
  const sections = [...document.querySelectorAll(".story-scene")];
  const progressLinks = [...document.querySelectorAll("[data-progress-page]")];

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) updateActivePage(Number(visible.target.dataset.page));
  }, { threshold: [0.34, 0.56, 0.74], rootMargin: "-14% 0px -24% 0px" });

  sections.forEach(section => observer.observe(section));

  document.addEventListener("pointermove", event => {
    const x = Math.round((event.clientX / Math.max(window.innerWidth, 1)) * 100);
    const y = Math.round((event.clientY / Math.max(window.innerHeight, 1)) * 100);
    document.documentElement.style.setProperty("--story-x", `${x}%`);
    document.documentElement.style.setProperty("--story-y", `${y}%`);
  }, { passive: true });

  document.addEventListener("click", event => {
    const hotSpot = event.target.closest("[data-hotspot]");
    if (hotSpot) {
      const scene = hotSpot.closest(".story-scene");
      scene.classList.add("is-awake");
      burstAt(scene, hotSpot);
      playChime(scene);
      return;
    }

    const speakButton = event.target.closest("[data-speak]");
    if (speakButton) {
      speakScene(Number(speakButton.dataset.speak));
      return;
    }

    if (event.target.closest("[data-read-current]")) {
      speakScene(activePage);
      return;
    }

    if (event.target.closest("[data-prev]")) {
      goToPage(activePage - 1);
      return;
    }

    if (event.target.closest("[data-next]")) {
      goToPage(activePage + 1);
    }
  });

  window.addEventListener("keydown", event => {
    if (event.defaultPrevented) return;
    if (event.key === "ArrowRight") goToPage(activePage + 1);
    if (event.key === "ArrowLeft") goToPage(activePage - 1);
  });

  progressLinks.forEach(link => {
    link.addEventListener("click", () => updateActivePage(Number(link.dataset.progressPage)));
  });
}

function updateActivePage(page) {
  activePage = Math.min(Math.max(page, 1), storyScenes.length);
  const counter = document.querySelector("#story-counter");
  if (counter) counter.textContent = `Page ${activePage} of ${storyScenes.length}`;

  document.querySelectorAll("[data-progress-page]").forEach(link => {
    link.toggleAttribute("aria-current", Number(link.dataset.progressPage) === activePage);
  });
}

function goToPage(page) {
  const clamped = page < 1 ? storyScenes.length : page > storyScenes.length ? 1 : page;
  const target = document.querySelector(`#page-${padPage(clamped)}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  updateActivePage(clamped);
}

function speakScene(page) {
  const scene = storyScenes.find(item => item.page === page) || storyScenes[0];
  if (!("speechSynthesis" in window) || !scene) return;

  window.speechSynthesis.cancel();
  speechUtterance = new SpeechSynthesisUtterance(`${scene.title}. ${scene.text}`);
  speechUtterance.rate = .92;
  speechUtterance.pitch = 1.08;
  speechUtterance.volume = 1;
  window.speechSynthesis.speak(speechUtterance);
}

function burstAt(scene, hotSpot) {
  const burst = document.createElement("span");
  burst.className = "spark-burst";
  burst.style.left = hotSpot.style.getPropertyValue("--spot-left");
  burst.style.top = hotSpot.style.getPropertyValue("--spot-top");
  scene.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1100);
}

function playChime(scene) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion || !("AudioContext" in window || "webkitAudioContext" in window)) return;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  const context = new AudioEngine();
  const now = context.currentTime;
  const page = Number(scene.dataset.page || 1);
  [440 + page * 5, 660 + page * 3].forEach((frequency, index) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now + index * .05);
    gain.gain.setValueAtTime(0, now + index * .05);
    gain.gain.linearRampToValueAtTime(.045, now + index * .05 + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, now + index * .05 + .45);
    osc.connect(gain).connect(context.destination);
    osc.start(now + index * .05);
    osc.stop(now + index * .05 + .5);
  });
}

renderStory();
