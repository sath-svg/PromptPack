export interface PresetPrompt {
  header: string;
  text: string;
}

export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  colorAccent: string;
  icon: string;
  owner: string;
  prompts: PresetPrompt[];
  fileName: string;
  images: string[];
}

const DESIGN_HEADERS = [
  "Art Style / Visual Language",
  "Color Palette & Mood",
  "Character Proportions",
  "Line Work & Outlines",
  "Texturing & Surface",
  "Lighting & Shading",
  "Background & Environment",
  "Facial Features & Expressions",
];

function makePrompts(texts: string[]): PresetPrompt[] {
  return texts.map((text, i) => ({ header: DESIGN_HEADERS[i], text }));
}

const PRESET_IMAGE_IDS = [
  "south-park", "simpsons", "family-guy", "rick-and-morty",
  "adventure-time", "anime-chibi", "disney-classic", "looney-tunes",
  "studio-ghibli", "shonen-action", "seinen-dark", "magical-girl",
  "mecha", "slice-of-life", "cyberpunk-neon", "pixel-art-retro",
  "vaporwave", "isometric-3d", "low-poly", "glitch-art",
  "oil-renaissance", "impressionist", "art-nouveau", "surrealist",
  "baroque", "expressionist", "pop-art-comic", "watercolor-botanical",
  "storybook", "graphic-novel", "scientific", "vintage-film-grain",
  "cinematic-widescreen", "polaroid-instant", "double-exposure",
  "dark-fantasy", "gothic-horror", "lovecraftian", "steampunk",
  "art-deco",
];

const PRESET_IMAGES: Record<string, string[]> = Object.fromEntries(
  PRESET_IMAGE_IDS.map(id => [id, [0,1,2,3].map(i => `/presets/images/${id}-${i}.jpg`)])
);

function preset(
  id: string,
  name: string,
  description: string,
  category: string,
  tags: string[],
  colorAccent: string,
  icon: string,
  prompts: string[]
): PromptPreset {
  return {
    id,
    name,
    description,
    category,
    tags,
    colorAccent,
    icon,
    owner: "PromptPack",
    prompts: makePrompts(prompts),
    fileName: `${id}.pmtpk`,
    images: PRESET_IMAGES[id] ?? [],
  };
}

export const PRESETS: PromptPreset[] = [
  // ── Cartoon/Animation (8) ──
  preset(
    "south-park",
    "South Park",
    "Flat cutout paper animation style with crude geometry, bold outlines, and deliberately simple construction-paper aesthetic.",
    "cartoon",
    ["cutout", "paper", "crude", "comedy", "flat"],
    "#FF6B35",
    "Scissors",
    [
      "Render in a flat 2D cutout paper animation style. All elements should look like they are made from construction paper, with visible layering. No 3D perspective, no gradients within shapes. Everything is front-facing or side-profile with minimal foreshortening.",
      "Use a saturated, primary-heavy palette: bright reds, blues, yellows, greens against muted earth-tone backgrounds. The mood is irreverent and playful. Skies are flat single-color fields. Snow is plain white with no texture variation.",
      "Characters have oversized round or oval heads roughly 1/3 of total body height. Bodies are simple rectangles or trapezoids. Arms are thin tubes without elbows. Legs are short stumps. Children are roughly 3 heads tall, adults 4 heads tall.",
      "Thick black outlines (2-3px equivalent) around every shape. No line weight variation. Lines are perfectly uniform. No sketchy or organic line quality — everything is clean-cut as if die-cut from paper.",
      "Flat solid fills with zero texture. Surfaces look like colored construction paper. No material differentiation — skin, clothing, and objects all share the same matte paper finish. Occasional visible 'cut edges' on layered elements.",
      "Completely flat lighting with no shadows or highlights. No light source is implied. Characters and environments exist in uniform ambient illumination. No cast shadows on ground planes.",
      "Backgrounds are simple layered paper cutouts: flat mountain silhouettes, rectangular buildings, circular trees. Minimal detail. Environments are sparse with large empty areas. Indoor scenes use flat colored walls with basic furniture shapes.",
      "Dot eyes (simple black circles) placed on the upper third of the head. Mouths are simple lines or small ovals that animate between open/closed states. No nose detail. Expressions conveyed through mouth shape and eyebrow lines only.",
    ]
  ),

  preset(
    "simpsons",
    "Simpsons",
    "Classic American animated sitcom style with exaggerated features, yellow skin tones, and clean cel-animation rendering.",
    "cartoon",
    ["sitcom", "yellow", "cel", "comedy", "american"],
    "#FFD700",
    "Tv",
    [
      "Render in a clean American TV cel-animation style with smooth curves, consistent line weight, and flat color fills. All forms are rounded and organic. 3/4 view is the default angle. Style balances caricature with readable silhouettes.",
      "Dominated by bright yellow skin tones as the base. Use bold saturated colors for clothing and environments: bright blues, reds, greens. Mood is warm and suburban. Skies are light blue with simple white clouds.",
      "Characters have large spherical heads with prominent overbites. Eyes are large white circles sitting on top of the head outline. Bodies are pear-shaped with rounded bellies. Adults are 4-5 heads tall. Fingers are four per hand.",
      "Clean uniform black outlines of medium weight throughout. Slightly thicker outlines on character silhouettes than interior details. Smooth curves dominate — no sharp angles except on architectural elements. No sketchy quality.",
      "Flat cel-shaded fills with no texture. Skin, clothing, and objects are all smooth solid colors. No fabric weave, no wood grain, no material differentiation through texture. Occasional simple pattern on clothing (stripes, dots).",
      "Minimal shading using a single shadow tone per surface. Shadows are flat shapes, not gradients. Light source is generally from above-left. No rim lighting, no specular highlights. Cast shadows are simple dark ovals beneath characters.",
      "Suburban American settings: simple houses with peaked roofs, flat lawns, basic interiors. Backgrounds have moderate detail with clean architectural lines. Indoor scenes show flat walls with framed pictures, basic furniture with rounded edges.",
      "Large circular eyes (white with black pupil dots) positioned on top of the head silhouette. Prominent overbite on most characters. Nose is a simple bump or cylinder shape. Expressions are broad — wide smiles, exaggerated frowns. Ear is a simple C-shape.",
    ]
  ),

  preset(
    "family-guy",
    "Family Guy",
    "Bold American animated comedy style with thick outlines, exaggerated anatomy, and clean digital coloring.",
    "cartoon",
    ["comedy", "bold", "american", "digital", "exaggerated"],
    "#4169E1",
    "Users",
    [
      "Render in a bold American adult animation style with thick outlines and flat digital coloring. Characters are drawn with exaggerated proportions and simplified anatomy. Views alternate between front-facing and 3/4 angles with minimal perspective.",
      "Clean bright colors with white or light-colored backgrounds. Skin tones are naturalistic peach/beige. Clothing uses solid saturated primary and secondary colors. Overall mood is bright and comedic. Environments use muted pastels.",
      "Large round or oval heads dominate the figure — roughly 1/3 of total height. Bodies are soft and rounded with prominent bellies on adult males. Arms are tube-like without defined muscle. Characters range from 3.5 to 5 heads tall depending on age.",
      "Very thick black outlines (3-4px equivalent) on all character silhouettes. Interior lines are slightly thinner but still bold. All lines are uniform weight with no taper. Clean digital line quality — no organic wobble or hand-drawn feel.",
      "Completely flat digital fills. No texture on any surface. Skin, clothing, hair, and objects all have the same smooth matte finish. No gradients, no material variation. Color is the only differentiator between surfaces.",
      "Flat lighting with minimal or no shading. When shadows appear, they are simple flat darker tone versions of the base color. No complex light interaction. No ambient occlusion. Characters appear evenly lit from all directions.",
      "Simple American suburban and domestic interiors. Living rooms with flat-colored walls, basic rectangular furniture. Outdoor scenes show simple houses, flat green lawns, blue skies. Moderate background detail — enough to establish setting without visual complexity.",
      "Large oval eyes with visible white sclera and small black pupils. Chin is prominent and often angular. Nose is a simple triangular or rectangular protrusion. Mouth expressions are exaggerated — wide grins, dramatic frowns. Eyebrows float above the head outline for emphasis.",
    ]
  ),

  preset(
    "rick-and-morty",
    "Rick & Morty",
    "Sci-fi cartoon style with wobbly linework, drool details, alien color palettes, and interdimensional chaos.",
    "cartoon",
    ["scifi", "wobbly", "alien", "interdimensional", "quirky"],
    "#00FF7F",
    "Atom",
    [
      "Render in a loose, slightly wobbly cartoon style that blends clean digital animation with intentionally imperfect line work. Forms are organic and slightly asymmetrical. Designs mix mundane suburban elements with bizarre alien and sci-fi concepts.",
      "Split palette between mundane earth tones (beige, brown, muted green) for domestic scenes and vivid alien colors (neon green, electric purple, hot pink, cosmic blue) for sci-fi elements. Portal green (#00FF7F) is a signature accent color throughout.",
      "Characters have simple rounded bodies. Heads are large ovals or pill shapes. Eyes are very large — often taking up 50%+ of the face. Bodies are lanky with thin limbs and minimal muscle definition. Old characters are hunched with spindly legs.",
      "Medium-weight lines with intentional wobble and variation. Lines are not perfectly smooth — they have a hand-drawn, slightly shaky quality. Outlines may vary in thickness along their length. Interior detail lines are thinner than silhouette lines.",
      "Mostly flat fills with occasional gross-out texture details (slime, drool, alien goo). Surfaces are generally smooth and matte. Sci-fi technology has metallic sheen suggested through simple color shifts rather than detailed rendering.",
      "Flat lighting for domestic scenes. Sci-fi and alien environments use dramatic colored lighting — green portal glow, purple nebula light, red emergency lighting. Shadows are minimal in normal scenes but appear dramatically in tense moments.",
      "Dual environment style: mundane suburban homes and garages contrast with bizarre alien planets, interdimensional spaces, and futuristic labs. Alien environments are highly detailed with strange organic/mechanical hybrid architecture. Domestic scenes are simple and grounded.",
      "Enormous circular eyes with tiny pupils that can shrink to dots for shock/fear. Unibrow is common. Mouths show drool and saliva details during speech. Expressions are extreme — wide-eyed panic, manic grins. Wrinkles and age lines are simple parallel strokes.",
    ]
  ),

  preset(
    "adventure-time",
    "Adventure Time",
    "Whimsical candy-colored cartoon style with simple shapes, noodle arms, and a magical post-apocalyptic world.",
    "cartoon",
    ["whimsical", "candy", "magical", "simple", "noodle"],
    "#00BFFF",
    "Sword",
    [
      "Render in a simple, whimsical cartoon style with soft rounded shapes and minimal detail. Everything is adorable and approachable. Characters and objects use basic geometric forms — circles, ovals, beans. The world feels handmade and magical.",
      "Bright candy colors: sky blues, grass greens, bubblegum pinks, lemon yellows. Pastel tones dominate with occasional deep jewel-tone accents. The mood is cheerful and dreamlike. Skies shift between pastel gradients. Candy and gem colors appear in architecture.",
      "Extremely simplified bodies. Characters are often just a head with noodle-thin arms and legs attached. Proportions are wildly varied — some characters are all head, others are long stretchy tubes. No anatomical rules. Height ratios are stylistic, not realistic.",
      "Thin clean outlines of uniform weight. Lines are smooth and simple with minimal interior detail. Some characters have no outlines at all and are defined purely by color shapes. Line color is always black. Curves are gentle and flowing.",
      "Flat solid color fills with no texture. Everything has a smooth, clean finish. No material differentiation — grass, skin, metal, and candy all have the same flat matte look. Occasional simple pattern (polka dots, stripes) on clothing or surfaces.",
      "Flat ambient lighting with no shadows in most scenes. Occasional atmospheric color washes for mood (warm orange for sunset, cool blue for night). No defined light source. Special moments may use dramatic backlighting as a simple silhouette effect.",
      "Lush candy-colored landscapes: rolling green hills, cotton-candy forests, ice cream mountains. Architecture is organic and whimsical — tree houses, candy castles, cloud kingdoms. Backgrounds are layered but simple, with distant elements as flat color silhouettes.",
      "Dot eyes (two black circles) are the default. Some characters have large round eyes with visible whites. Mouths are simple curved lines. Expressions are broad and readable: wide smiles, tiny worried mouths. Faces are extremely minimal — nose is usually absent.",
    ]
  ),

  preset(
    "anime-chibi",
    "Anime Chibi",
    "Super-deformed Japanese style with oversized heads, tiny bodies, and maximum kawaii expressiveness.",
    "cartoon",
    ["chibi", "kawaii", "deformed", "japanese", "cute"],
    "#FF69B4",
    "Heart",
    [
      "Render in Japanese super-deformed chibi style. Characters are extremely simplified and cute with massively oversized heads on tiny bodies. All features are rounded and soft. The style prioritizes adorable expressiveness over anatomical accuracy.",
      "Bright anime palette with lots of pinks, light blues, lavenders, and warm yellows. Backgrounds use soft pastel washes. Mood is overwhelmingly cute and cheerful. Sparkle effects and small hearts/stars float as decorative elements. Blush marks are pink circles on cheeks.",
      "Heads are 50-60% of total character height (2:1 head-to-body ratio). Bodies are tiny rounded beans. Arms and legs are short stubby cylinders. Hands are simplified mittens or tiny star shapes. Characters are 2-2.5 heads tall maximum.",
      "Clean thin outlines with slight variation at joints and intersections. Lines are smooth and digital. Hair is defined by large flowing shapes rather than individual strands. Outline color may shift to dark versions of the fill color rather than pure black.",
      "Smooth flat fills with anime-style cel shading (one shadow layer). Hair has a single glossy highlight shape. Skin is smooth with blush spots. Clothing is flat with minimal fold lines. Everything is clean and polished with no gritty texture.",
      "Soft frontal lighting with one simple shadow tone on each surface. Shadows are rounded shapes, never harsh. A subtle top-light creates small shadow under the chin and hair. Background elements may have a soft ambient glow. Sparkle highlights on eyes and hair.",
      "Simple cute environments: pastel-colored rooms, flower gardens, candy shops. Backgrounds are often minimal or abstract (gradient wash with floating decorative elements). When detailed, environments match the cute aesthetic with rounded furniture and soft colors.",
      "Enormous eyes taking up 40-50% of the face. Eyes are detailed with large colored irises, multiple highlight spots, and visible lash lines. Mouth is a tiny shape — small triangle, cat-mouth, or simple curve. Nose is a single dot or absent entirely. Expressions use full-face blush, sweat drops, anger veins as visual shorthand.",
    ]
  ),

  preset(
    "disney-classic",
    "Disney Classic",
    "Golden-age hand-drawn animation style with fluid forms, expressive eyes, and lush painted backgrounds.",
    "cartoon",
    ["disney", "golden-age", "handdrawn", "fluid", "painted"],
    "#9370DB",
    "Castle",
    [
      "Render in classic Disney hand-drawn animation style from the golden era. Characters have fluid organic forms with appealing curves and strong silhouettes. Every pose should feel dynamic and graceful. The style balances realism with caricature for maximum appeal.",
      "Rich warm palette with jewel tones: deep blues, royal purples, emerald greens, ruby reds. Mood shifts between warm golden scenes and cool dramatic moments. Nature scenes use lush saturated greens and warm earth tones. Magic effects glow with soft golden or blue light.",
      "Idealized human proportions with subtle exaggeration for appeal. Heroes/heroines are 7-8 heads tall with slightly large eyes and small waists. Villains have angular exaggerated proportions. Animal characters follow realistic proportions but with expressive faces. Movement suggests weight and grace.",
      "Confident flowing lines with beautiful weight variation — thick on shadows and silhouette, thin on interior details and overlapping forms. Lines taper elegantly at endpoints. Pencil-like quality with smooth curves. Hair flows in large sweeping shapes with individual strand accents.",
      "Smooth cel-painted finish with subtle color variation within shadows. Fabric shows gentle folds with soft shadow gradients. Hair has a silky sheen with flowing highlight shapes. Skin is smooth with warm undertones. Natural materials (wood, stone) have subtle painted texture.",
      "Dramatic cinematic lighting with clear key light and fill. Strong rim lighting separates characters from backgrounds. Warm golden light for happy scenes, cool blue for dramatic moments. Volumetric light shafts through windows and forests. Cast shadows are soft and atmospheric.",
      "Lush painted backgrounds in a romantic realist style. Forests are dense with atmospheric depth — detailed foreground, softer middle ground, hazy background. Castles and architecture have grandeur and detail. Skies are painterly with soft cloud formations. Backgrounds feel like fine art paintings.",
      "Large expressive eyes with visible iris detail, catch-light reflections, and defined eyelashes. Eyes convey deep emotion through pupil dilation and brow movement. Noses are small and softly defined. Mouths are expressive with visible lip shape on female characters. Smiles are warm and genuine with personality.",
    ]
  ),

  preset(
    "looney-tunes",
    "Looney Tunes",
    "Classic slapstick cartoon style with rubber-hose animation, extreme squash-and-stretch, and anarchic energy.",
    "cartoon",
    ["slapstick", "rubber-hose", "squash-stretch", "classic", "anarchic"],
    "#FF4500",
    "Rabbit",
    [
      "Render in classic American theatrical cartoon style with extreme squash-and-stretch principles. Characters are rubbery and elastic — they can flatten, elongate, and distort for comedic effect. Every pose is pushed to its extreme for maximum visual comedy.",
      "Bold primary colors against simple painted backgrounds. Characters use saturated reds, oranges, blues, and blacks. Background environments are watercolor-like with muted earth tones — desert browns, sky blues, forest greens. High contrast between foreground characters and softer backgrounds.",
      "Exaggerated cartoon proportions with no fixed rules. Characters stretch and compress dynamically. Default proportions: large heads (1/3 body), white-gloved hands, oversized feet. Bodies are simple tubes and ovals. During action, proportions distort wildly — legs become springs, bodies flatten to pancakes.",
      "Bold confident outlines with dynamic weight variation. Thicker lines on silhouettes, thinner on interior details. Lines are smooth and flowing with classic ink-brush quality. Speed lines and motion arcs appear during movement. Impact stars and visual effects use graphic line patterns.",
      "Flat cel-painted fills for characters. No texture on character surfaces — all smooth and clean. Background paintings have loose watercolor texture with visible brushwork. Dust clouds, explosions, and effects use simple flat shapes. Fur and feathers are suggested through silhouette shape, not surface texture.",
      "Flat even lighting on characters with minimal shading. Dramatic shadows appear only for comedic effect (spotlight gags, night scenes). Backgrounds have atmospheric lighting painted in. Characters maintain their flat-lit look even in dramatically lit environments. Explosions produce brief flash-white lighting.",
      "Simple iconic environments: desert mesas and canyons, suburban houses, forest clearings, opera stages. Backgrounds are painted in a loose watercolor style with moderate detail. Environments exist to serve the gag — they're simple enough to not distract from character action. Perspective exaggeration for comedy (impossibly long roads, towering cliffs).",
      "Large expressive eyes with heavy eyelids for attitude. Eyes can bug out to enormous size for shock reactions. Mouths stretch impossibly wide for screams and grins. Teeth are prominent during extreme expressions. Whiskers, long ears, and buck teeth define animal characters. Face takes (shock/surprise) involve the entire head reshaping.",
    ]
  ),

  // ── Anime/Manga (6) ──
  preset(
    "studio-ghibli",
    "Studio Ghibli",
    "Soft watercolor anime style with lush natural environments, gentle lighting, and emotionally resonant character design.",
    "anime",
    ["watercolor", "nature", "gentle", "japanese", "emotional"],
    "#87CEEB",
    "CloudSun",
    [
      "Render in Studio Ghibli's signature hand-painted anime style. Soft, naturalistic forms with gentle curves. Characters are grounded and relatable rather than stylized. Environments are lush and painterly. Every frame should feel like a watercolor illustration come to life.",
      "Natural earth-tone palette with soft pastels: sky blues, grass greens, warm browns, gentle pinks. Mood is nostalgic and serene with moments of wonder. Skies are always beautiful — sweeping cloud formations in soft blues and whites. Rain scenes use soft grey-blue washes.",
      "Realistic anime proportions — characters are 6-7 heads tall with natural body shapes. Children look like real children with round faces. No exaggerated anime proportions (no huge eyes or tiny mouths). Bodies have natural weight and volume. Movement is grounded with realistic physics.",
      "Clean thin lines with subtle variation. Outlines are softer than typical anime — sometimes lines dissolve into color areas. Hair is drawn in flowing groups of strands, not individual hairs. Environmental lines are looser and more painterly than character lines. A handcrafted quality throughout.",
      "Soft painted textures on environments — visible brushwork on clouds, trees, grass. Characters have smooth cel-shaded skin. Fabric shows soft, realistic draping. Natural materials (wood, stone, water) are rendered with beautiful painted texture. Water is translucent with visible depth.",
      "Warm natural lighting that shifts with time of day. Golden hour light is a signature — long warm shadows, glowing highlights on hair and skin. Overcast scenes have soft diffused light. Dramatic moments use volumetric light rays through clouds or trees. Night scenes are deep blue with warm lamp glow.",
      "Incredibly detailed natural environments: dense forests with individual leaf rendering, rolling hills with wildflowers, European-inspired towns with weathered buildings. Skies are always a focal point with dramatic cloud formations. Water (rivers, ocean, rain) is rendered with loving detail. Environments feel lived-in and real.",
      "Simple, naturalistic anime faces. Eyes are moderately large with detailed irises but not oversized. Expressions are subtle and genuine — small smiles, worried brows, wide-eyed wonder. Noses are small but present (dot or soft line). Mouths are small and expressive. Faces convey emotion through understatement rather than exaggeration.",
    ]
  ),

  preset(
    "shonen-action",
    "Shonen Action",
    "High-energy manga battle style with dynamic poses, speed lines, dramatic angles, and intense power effects.",
    "anime",
    ["battle", "dynamic", "manga", "energy", "intense"],
    "#DC143C",
    "Flame",
    [
      "Render in intense shonen manga/anime style optimized for action sequences. Every composition is dynamic — extreme angles, dramatic foreshortening, explosive poses. Characters radiate power and determination. The style prioritizes impact and energy over subtlety.",
      "High-contrast palette with deep blacks, vivid reds, electric blues, and searing whites. Energy effects glow with saturated colors (golden aura, blue lightning, red flame). Mood is intense and heroic. Battle scenes use darker backgrounds to make effects pop. Determined color grading — warm for heroes, cool for villains.",
      "Athletic idealized proportions — characters are 7-8 heads tall with muscular definition. Male characters have broad shoulders and defined arms. Dynamic poses show extreme foreshortening with fists/feet larger as they approach viewer. Hair defies gravity, becoming wilder during power-ups.",
      "Bold confident lines with dramatic weight variation. Silhouette lines are thick and powerful. Speed lines radiate from impact points. Cross-hatching for shadow and intensity. Lines become rougher and more chaotic during peak action moments. Clean lines for calm scenes, explosive lines for battle.",
      "Mix of flat cel-shading and dramatic rendering. Clothing tears and wrinkles under stress. Skin shows muscular definition through highlight and shadow. Energy effects have a glowing ethereal texture. Debris and dust are rendered as sharp angular fragments. Sweat and blood are detail accents during intense moments.",
      "Dramatic cinematic lighting with extreme contrast. Rim lighting outlines characters in action poses. Energy attacks cast colored light on surrounding surfaces. Backlighting creates powerful silhouettes. Shadow is used dramatically — half-face shadow for determination, full shadow for menace. Light concentrates on the point of impact.",
      "Dynamic environments that respond to action — cracking ground, shattering buildings, parting clouds. Backgrounds blur with speed during movement. Battle arenas are dramatic: cliff edges, ruined cities, volcanic landscapes. When characters power up, the environment itself distorts with energy waves.",
      "Intense expressive eyes with small detailed pupils that dilate with emotion. Determined expressions: furrowed brows, gritted teeth, narrowed eyes. Shock expressions: wide eyes, open mouth, sweat drops. Villains have sharp angular features and shadowed eyes. Power-up faces show glowing eyes and radiating energy lines.",
    ]
  ),

  preset(
    "seinen-dark",
    "Seinen Dark",
    "Mature dark manga style with detailed realism, heavy shadows, psychological tension, and gritty atmosphere.",
    "anime",
    ["mature", "dark", "realistic", "gritty", "psychological"],
    "#2F4F4F",
    "Shield",
    [
      "Render in dark seinen manga style aimed at mature audiences. Realistic proportions with detailed anatomy. Compositions emphasize psychological tension through tight framing, extreme close-ups, and uncomfortable angles. The style is grounded, gritty, and unflinching.",
      "Desaturated muted palette dominated by greys, dark blues, faded browns, and sickly yellows. Splashes of red for blood and violence. Mood is oppressive and tense. Night scenes are near-monochrome. Industrial settings use cold blue-grey. Flesh tones are pale and unhealthy.",
      "Realistic human proportions — characters are 7-7.5 heads tall with accurate anatomy. Muscles, joints, and bone structure are visible through skin. Bodies show age, wear, and imperfection. No idealization — characters have scars, wrinkles, and realistic body types.",
      "Detailed precise lines with heavy use of cross-hatching for shadow and texture. Lines are sharp and controlled. Thick outlines define silhouettes against dark backgrounds. Pen-and-ink quality with fine stippling for gradual shadow transitions. Panel borders are often heavy black.",
      "Highly textured surfaces. Skin shows pores, wrinkles, and imperfections through fine cross-hatching. Fabric is rendered with realistic fold patterns. Metal surfaces show scratches and wear. Environments have gritty urban texture — cracked concrete, rusted metal, weathered wood.",
      "High-contrast noir-influenced lighting. Deep blacks dominate with sharp highlights picking out key details. Single strong light sources create dramatic shadows across faces. Underlighting for menace. Fluorescent lighting for clinical coldness. Shadows obscure as much as light reveals.",
      "Gritty realistic environments: cramped urban apartments, rain-soaked streets, sterile institutional corridors, industrial wastelands. Architecture is detailed and oppressive. Spaces feel claustrophobic. Weather (rain, fog, snow) is used for atmospheric mood. Every environment tells a story through visual decay.",
      "Realistic detailed faces with visible bone structure. Eyes are proportionally accurate with heavy shadows underneath for exhaustion and stress. Expressions are subtle and psychologically complex — a slight downturn of the mouth, tensed jaw muscles, hollow stares. Scars, stubble, and age lines add character. Villains are not obviously 'evil-looking' — horror comes from normal-seeming faces.",
    ]
  ),

  preset(
    "magical-girl",
    "Magical Girl",
    "Sparkly shoujo transformation style with flowing ribbons, star motifs, pastel gradients, and dazzling magical effects.",
    "anime",
    ["shoujo", "sparkle", "transformation", "pastel", "magical"],
    "#FF1493",
    "Sparkles",
    [
      "Render in magical girl anime style with emphasis on beauty, sparkle, and transformation sequences. Every element should feel dazzling and enchanting. Compositions are elegant with flowing curved lines. Costumes are elaborate with ribbons, bows, and jewel motifs.",
      "Pastel rainbow palette: soft pinks, lavenders, sky blues, mint greens, and warm yellows. Magic effects use bright white and gold sparkles against deep starry backgrounds. Mood is hopeful and empowering. Gradient fills shift between complementary pastels. Rose and cherry blossom accents.",
      "Elegant elongated proportions — characters are 7-8 heads tall with long slender legs and small waists. Large expressive eyes dominate the face. Hair is voluminous, flowing, and often impossibly long. Transformation adds additional height and elegance. Poses emphasize grace and dynamism.",
      "Clean precise lines with elegant weight variation — thicker on hair and costume silhouettes, thinner on facial details and sparkle effects. Lines are smooth and flowing with beautiful curves. Hair strands flow in large elegant arcs. Ribbon and fabric lines are fluid and dynamic.",
      "Smooth gradient fills with glossy anime rendering. Hair has multiple highlight layers creating a silky sheen. Costume jewels and accessories have crystalline reflections. Skin is smooth with warm undertones and subtle blush. Fabric is smooth satin or flowing chiffon texture. Sparkle particles overlay everything during magical scenes.",
      "Bright glamorous lighting with multiple light sources. Characters glow with inner magical light during transformations. Star-shaped catch-lights in eyes. Rim lighting outlines hair and costume. Warm pink/gold lighting for romantic moments. Deep starfield backgrounds contrast with bright character lighting. Sparkle effects create ambient illumination.",
      "Dreamy fantastical settings: moonlit cityscapes, flower gardens, crystalline palaces, starfield dimensions. Transformation sequences occur in abstract sparkle-filled void spaces. Everyday settings (schools, bedrooms) are bright and cheerful. Magic creates temporary fantastical overlays on mundane environments.",
      "Enormous detailed eyes with elaborate iris patterns, multiple catch-lights, long curved lashes, and visible lid lines. Eyes are the primary emotional vehicle — tearful, determined, joyful. Small delicate nose (often just a dot). Small expressive mouth. Hair frames face in elaborate arrangements. Blush marks on cheeks during emotional moments.",
    ]
  ),

  preset(
    "mecha",
    "Mecha",
    "Giant robot anime style with detailed mechanical design, hard-surface modeling, dramatic battle framing, and technical precision.",
    "anime",
    ["robot", "mechanical", "technical", "battle", "hard-surface"],
    "#708090",
    "Cog",
    [
      "Render in detailed mecha anime style focused on giant robot design and mechanical precision. Machines are detailed with visible panel lines, joints, and mechanical components. Human characters use standard anime proportions. The style balances technical accuracy with dynamic action.",
      "Industrial metallic palette: steel greys, gunmetal blues, military greens, warning reds and yellows. Accent colors identify different factions or units. Cockpit interiors glow with green/blue holographic displays. Explosions use orange-red-white gradients. Space scenes are deep black with star points.",
      "Robots are designed with realistic mechanical proportions — joints bend at logical points, armor plates overlap functionally. Typical mecha proportions: broad shoulders, narrow waist, powerful legs. Scale is communicated through tiny human figures and detailed buildings for comparison. Human pilots use standard anime proportions (6-7 heads tall).",
      "Precise technical linework with consistent weight for mechanical components. Panel lines are thin and parallel. Rivets and mechanical details are precisely placed. Character outlines are cleaner and slightly thicker. Action scenes add speed lines and motion blur effects. Technical callout lines for diagram-style reveals.",
      "Metallic surfaces with clear material differentiation: brushed steel, painted armor panels, rubber joint seals, glass canopy surfaces. Panel lines create logical armor sections. Weathering effects: scratches, paint chips, carbon scoring from battle. Cockpit interiors have textured control panels and screens.",
      "Dramatic action lighting with strong directional sources. Thruster glow casts blue/orange light on surrounding armor. Beam weapons create intense white-hot illumination. Space scenes use single hard sunlight creating deep shadows. Explosions light up entire scenes in warm orange. Cockpit scenes are lit by cool screen glow.",
      "Large-scale environments that emphasize mecha size: destroyed cityscapes, military bases, orbital platforms, asteroid fields. Environments show battle damage and destruction. Space backgrounds feature stars, planets, and debris fields. Earth environments are realistic military/industrial settings. Scale objects (cars, buildings, humans) reinforce robot enormity.",
      "Human characters have standard anime faces with serious military expressions. Pilots show determination, stress, and fatigue. Helmeted characters have visor reflections showing tactical displays. Robot 'faces' are camera lenses, V-fins, and geometric armor shapes that suggest expression through design. Antagonist mecha have aggressive angular 'face' designs.",
    ]
  ),

  preset(
    "slice-of-life",
    "Slice of Life",
    "Soft everyday anime style with warm domestic settings, gentle expressions, and cozy atmosphere emphasizing quiet moments.",
    "anime",
    ["cozy", "domestic", "warm", "everyday", "gentle"],
    "#FFA07A",
    "Coffee",
    [
      "Render in soft slice-of-life anime style that celebrates quiet everyday moments. Compositions are calm and contemplative — wide establishing shots of neighborhoods, close-ups of hands preparing food, characters gazing out windows. Everything feels warm and intimate.",
      "Warm cozy palette: soft oranges, warm browns, cream whites, gentle pinks, muted greens. Golden hour lighting dominates — warm amber tones suffuse interior scenes. Mood is nostalgic and comforting. Rainy day scenes use soft blue-grey. Cherry blossom pink appears in spring scenes.",
      "Natural realistic anime proportions — characters are 6-7 heads tall with soft rounded features. No exaggerated anime proportions. Characters have believable body types reflecting age and personality. Children are properly proportioned. Elderly characters show realistic aging. Casual relaxed posture throughout.",
      "Soft clean lines with gentle weight variation. Lines are thinner and lighter than action anime — creating a gentle, approachable feel. Hair is drawn in soft flowing groups. Clothing lines show gentle draping. Environmental lines are loose and atmospheric. No harsh angular lines anywhere.",
      "Soft cel-shading with warm color shifts in shadows. Food is rendered with loving detail — visible steam, glossy sauces, fresh ingredients. Fabric shows soft natural draping. Wood grain and tatami textures appear in traditional Japanese interiors. Everything has a tactile, inviting quality.",
      "Warm ambient lighting emphasizing coziness. Indoor scenes glow with warm lamp light. Kitchen scenes have overhead warm lighting. Window light creates soft rectangles on floors and walls. Sunset scenes bathe everything in golden warmth. Night scenes are soft blue with warm interior glow visible through windows.",
      "Detailed domestic environments: cozy kitchens with visible utensils and ingredients, lived-in bedrooms with books and personal items, neighborhood streets with small shops. Environments are rich with everyday detail that suggests real lives. Seasonal changes visible — cherry blossoms, summer cicadas, autumn leaves, winter snow.",
      "Soft natural anime faces with gentle expressions. Eyes are moderately large with warm, kind expressions. Smiles are genuine and gentle — small upturn of lips, slightly closed eyes. Blush is common during embarrassing or tender moments. Expressions are subtle and emotionally nuanced. Characters look real and relatable.",
    ]
  ),

  // ── Digital Art (6) ──
  preset(
    "cyberpunk-neon",
    "Cyberpunk Neon",
    "Futuristic neon-soaked style with rain-slicked streets, holographic UI, and electric color contrasts against dark urban sprawl.",
    "digital",
    ["neon", "futuristic", "rain", "holographic", "urban"],
    "#FF00FF",
    "Zap",
    [
      "Render in a high-contrast cyberpunk aesthetic with dense urban layering and neon saturation. Architecture is vertical and oppressive. Technology is everywhere — holographic signs, augmented reality overlays, visible data streams. The world feels lived-in, chaotic, and electrifying.",
      "Deep blacks and dark blue-greys as base with intense neon accents: hot pink (#FF00FF), electric cyan (#00FFFF), acid green (#39FF14), warning orange. Neon colors reflect off wet surfaces creating color bleeding. Mood is electric and dangerous. Warm tungsten light contrasts with cool neon.",
      "Characters are stylized-realistic with cybernetic enhancements: metallic limbs, glowing eye implants, neural interface ports. Bodies range from athletic to augmented-bulky. Clothing is functional urban tech-wear with glowing accent strips. Height is realistic (7-8 heads tall) with exaggerated tech accessories.",
      "Sharp precise lines for technology and architecture. Softer organic lines for human elements. Neon sign text is rendered with glow effects. Circuit-board patterns appear as decorative elements. Rain streaks add vertical line energy. Holographic displays have scan-line effects and pixelated edges.",
      "High contrast between matte dark surfaces and glossy wet/metallic surfaces. Rain-soaked streets reflect neon with blurred color streaks. Metallic cybernetics have brushed or polished finishes. Leather and synthetic fabrics have visible grain. Holographic elements are semi-transparent with chromatic aberration.",
      "Neon is the primary light source — signs, advertisements, vehicle lights create pools of colored illumination. Rain and fog scatter light creating atmospheric depth. Strong rim lighting in neon colors separates figures from dark backgrounds. Screen glow lights faces from below. Lens flares and light bloom on bright sources.",
      "Dense vertical cityscapes: towering megastructures, cramped alleyways, elevated highways, rooftop markets. Every surface is covered with neon signage and holographic advertisements. Street level is dark and gritty while upper levels glow with corporate clean light. Rain is perpetual, creating reflective surfaces everywhere.",
      "Characters have intense focused expressions. Eyes may be replaced or enhanced with cybernetic implants that glow. Facial scars from augmentation surgery. Half-face cybernetic masks. Expressions are guarded and street-smart. Neon light casts colored shadows across faces. Augmented reality UI elements float near eyes.",
    ]
  ),

  preset(
    "pixel-art-retro",
    "Pixel Art Retro",
    "8-bit/16-bit pixel art with limited color palettes, grid-aligned shapes, and nostalgic retro game aesthetics.",
    "digital",
    ["pixel", "8bit", "retro", "game", "nostalgia"],
    "#00D4AA",
    "Gamepad2",
    [
      "Render in classic pixel art style reminiscent of 16-bit era video games. All shapes are built from visible square pixels on an implied grid. Anti-aliasing is manual (strategic pixel placement for smooth curves). Style balances readability with detail at low resolution. Every pixel is intentionally placed.",
      "Limited color palette of 16-32 colors maximum, inspired by classic console hardware. Colors are saturated and distinct: strong primaries and secondaries with a few mid-tones. Avoid gradients — use dithering patterns (checkerboard, diagonal stripe) for color transitions. Black outlines define silhouettes.",
      "Characters are typically 16-32 pixels tall with proportions adjusted for readability at small scale. Heads are large (1/3 of height) for expressive faces. Bodies are compact. Details are implied through minimal pixel clusters. Side-view sprites use 2-3 color shading per surface.",
      "No traditional linework — shapes are defined by contrasting pixel colors. One-pixel-wide borders in dark colors define silhouettes. Interior detail uses color changes rather than lines. Curves are 'stepped' following pixel grid angles (45-degree diagonals maximum for smooth curves).",
      "Flat fills defined by pixel clusters. Dithering patterns simulate texture and gradients: checkerboard for 50% mix, sparse dots for subtle gradients. Metal surfaces use 3-tone highlight-base-shadow striping. No smooth gradients anywhere — everything is discrete pixel steps.",
      "Simple directional lighting using 2-3 tone ramps per color (highlight, base, shadow). Light comes from upper-left by convention. Shadows are one step darker on the palette. Highlights are one step lighter. No soft shadow edges — shadow boundaries are hard pixel steps. Specular highlights are single bright pixels.",
      "Tiled backgrounds with repeating pattern elements: brick walls, grass tiles, sky gradients (using dithering). Parallax scrolling layers create depth. Architecture uses clean geometric pixel shapes. Nature elements (trees, clouds) are iconic simplified forms. Each tile is typically 16x16 or 32x32 pixels.",
      "Faces at character scale (16-32px tall) use minimal pixels: 2 dark pixels for eyes, 1 pixel for mouth highlight. Larger portrait sprites (64x64+) show more detail: visible iris color, eyebrow pixels, defined lip shapes. Expressions change through repositioning just 2-3 key pixels. Hair is a solid color mass with 1-2 highlight pixels.",
    ]
  ),

  preset(
    "vaporwave",
    "Vaporwave",
    "Retro-futuristic aesthetic with pastel gradients, Greek statuary, 80s computer graphics, and nostalgic digital decay.",
    "digital",
    ["retro-futuristic", "pastel", "80s", "aesthetic", "digital-decay"],
    "#DDA0DD",
    "Sunset",
    [
      "Render in vaporwave aesthetic combining 80s/90s computer graphics nostalgia with surreal classical elements. Clean geometric shapes float in void-like spaces. Greek/Roman statuary fragments mix with early 3D renders and Windows 95 UI elements. Everything feels simultaneously futuristic and dated.",
      "Signature pastel gradient palette: pink-to-cyan, purple-to-blue, magenta-to-orange sunset tones. Chrome and holographic rainbow accents. Mood is dreamy, melancholic, and nostalgic. Solid black or deep purple backgrounds. Neon grid lines in magenta or cyan. Sunset gradients are a recurring motif.",
      "Mix of human and object scales. Classical statuary busts and figures are rendered at monumental scale. 3D geometric primitives (spheres, cubes, pyramids) float at various sizes. When human figures appear, they are stylized or replaced by mannequin/statue forms. No consistent scale — dreamlike spatial relationships.",
      "Clean geometric lines dominate: grid patterns, wireframe shapes, geometric borders. No organic hand-drawn linework. Lines are precise and computer-generated in appearance. Wireframe 3D grids (perspective lines converging to horizon) are a signature element. UI window borders and scroll bars as graphic elements.",
      "Smooth gradient fills are the primary texture. Chrome/mirror surfaces reflect pink and cyan gradients. Marble texture on classical statuary. Early 3D render quality: smooth Phong-shaded surfaces with visible polygon edges. Water surfaces are glassy with perfect reflections. VHS scan line artifacts and glitch effects as overlay textures.",
      "Dramatic gradient lighting with no specific source — ambient pink/purple wash fills scenes. Neon glow from grid lines and geometric shapes. Chrome reflections bounce colored light. No realistic shadows — light exists as color gradient rather than directional illumination. Sunset backlighting creates silhouettes against gradient skies.",
      "Surreal digital landscapes: infinite checkerboard floors receding to gradient horizons, floating islands with palm trees, Greek temple ruins on synthetic plains, endless purple oceans reflecting sunset skies. Windows 95 dialog boxes and error messages float as environmental elements. Everything exists in a placeless digital void.",
      "Faces are often absent or replaced by classical statuary faces — smooth marble bust features with blank eyes. When present, human faces are obscured by glitch effects, VHS tracking errors, or gradient overlays. Mannequin-like smooth features. Sunglasses reflecting sunset gradients are a common facial element.",
    ]
  ),

  preset(
    "isometric-3d",
    "Isometric 3D",
    "Clean isometric illustration style with precise geometry, pastel palettes, and miniature diorama-like scenes.",
    "digital",
    ["isometric", "geometry", "miniature", "diorama", "clean"],
    "#7B68EE",
    "Box",
    [
      "Render in clean isometric projection at a fixed 30-degree angle. All objects use true isometric perspective — no vanishing points, parallel edges remain parallel. Scenes look like detailed miniature dioramas or architectural models viewed from above at an angle. Style is precise, geometric, and orderly.",
      "Soft pastel palette with clean differentiation between surfaces: light tops, medium sides, darker left faces. Colors are muted and harmonious — soft blues, warm greys, gentle greens, cream whites. Accent colors (coral, teal, gold) for interactive or important elements. Mood is calm, organized, and inviting.",
      "Objects and characters are simplified geometric forms. Buildings are clean boxes and cylinders. People are small simplified figures (10-15% of building height) made from basic shapes — pill-shaped bodies, circle heads. Trees are geometric cones or spheres on cylinders. Everything maintains strict isometric grid alignment.",
      "Clean precise lines at consistent weight. Edges of geometric forms are sharp and straight. No organic or hand-drawn line quality. Outlines may be a dark version of the fill color rather than pure black. Grid structure is implied through perfect alignment of all elements. No sketchy quality anywhere.",
      "Flat matte fills with three-tone face differentiation (top light, right medium, left dark) to communicate volume in isometric view. Surfaces are smooth without texture. Material is communicated through color alone — no wood grain, no metal reflection. Occasional simple pattern (window grids, brick rows) as graphic elements.",
      "Even ambient lighting with implicit light source from upper-left (creating the three-tone face system). No cast shadows between objects to maintain visual clarity. Soft drop shadow beneath the entire isometric scene to float it above the page. No dramatic lighting — consistent gentle illumination throughout.",
      "Modular tile-based environments: city blocks, office interiors, park scenes, factory floors. Everything aligns to an isometric grid. Scenes feel like detailed model kits or architectural site plans. Cut-away views reveal interior rooms. Multiple levels/floors visible simultaneously. Environments are rich with tiny details but remain organized.",
      "Faces are extremely simplified at isometric character scale: dot eyes, optional tiny mouth. No visible expression detail — emotion is conveyed through posture and gesture. Characters are more like chess pieces or game tokens than detailed portraits. Hair is a solid color shape on top of the head circle.",
    ]
  ),

  preset(
    "low-poly",
    "Low Poly",
    "Geometric faceted 3D style with visible polygon faces, flat shading per triangle, and modern minimalist aesthetic.",
    "digital",
    ["polygon", "geometric", "faceted", "3d", "minimalist"],
    "#20B2AA",
    "Triangle",
    [
      "Render in low-polygon 3D style where all forms are built from visible triangular and quadrilateral facets. Surfaces are flat-shaded per polygon face (no smooth shading). The aesthetic celebrates the geometric beauty of simple polygon meshes. Scenes look like stylized paper craft or early 3D rendering.",
      "Clean limited palette with subtle color variation between adjacent polygon faces. Nature scenes use greens, blues, and earth tones with each triangle face a slightly different shade. Gradients are achieved through stepping colors across polygons. Mood is modern, clean, and contemplative. Soft harmonious color relationships.",
      "Forms are simplified to essential geometric silhouettes. Animals and humans are recognizable through minimal polygon shapes — a fox is 30-50 triangles capturing the pointed ears and bushy tail. Trees are simple cone/pyramid shapes. Mountains are large angular facets. Scale is realistic but detail is extremely reduced.",
      "No traditional linework. Form is defined entirely by the edges between polygon faces, which are visible as sharp color transitions. Some styles add thin edge lines (wireframe overlay) for additional definition. All edges are perfectly straight — no curves anywhere in the geometry.",
      "Each polygon face is a single flat color — no texture mapping, no gradients within faces. Adjacent faces differ slightly in shade to communicate surface orientation. The faceted quality IS the texture. No material properties — everything shares the same matte flat-shaded look. The beauty is in the geometric fragmentation of smooth forms.",
      "Flat shading per polygon face implies directional light. Each face receives a single brightness value based on its angle to an implied light source (upper-left). No shadows between objects. No ambient occlusion. No specular highlights. The brightness steps between faces naturally create a sense of form and depth.",
      "Stylized natural landscapes: angular mountains with faceted snow caps, geometric trees in simplified forests, polygonal water surfaces with flat reflecting triangles. Skies may use large triangle gradients. Environments are serene and expansive. Urban scenes show buildings as clean geometric blocks.",
      "Faces are extremely abstracted — a few triangles define nose as a pyramid, eyes as dark diamond shapes, mouth as a single edge line. No expression detail possible at low polygon counts. Character identity comes from overall silhouette shape and color. Portrait close-ups reveal the beautiful geometry of a face broken into planes.",
    ]
  ),

  preset(
    "glitch-art",
    "Glitch Art",
    "Digital corruption aesthetic with data-bent visuals, RGB channel splitting, scan line distortion, and broken pixel patterns.",
    "digital",
    ["corruption", "data-bent", "rgb-split", "distortion", "broken"],
    "#FF6347",
    "Monitor",
    [
      "Render in a digital glitch aesthetic where images appear corrupted, data-bent, and digitally broken. Clean source imagery is disrupted by systematic visual errors: horizontal displacement, color channel separation, pixel sorting, and data corruption artifacts. The style makes digital failure beautiful.",
      "RGB channel separation is the signature color effect: red, green, and blue layers offset from each other creating color fringing. Base colors are oversaturated or posterized. Unexpected color blocks appear in corrupted regions. Neon colors (hot pink, electric cyan, acid green) emerge from the splitting. Dark regions fragment into colored noise.",
      "Source proportions are realistic/photographic but become distorted through glitch effects. Bodies may be horizontally displaced — upper body shifted left while lower body shifts right. Pixel sorting can stretch forms vertically. Scale is disrupted — some elements compress while others stretch. The human form remains recognizable through the distortion.",
      "No traditional linework. Scan lines (horizontal pixel rows) become visible as the image breaks down. Rectangular blocks of displaced data create hard geometric edges. Pixel sorting creates vertical streak lines. Corrupted regions show binary-pattern edges between clean and broken areas.",
      "Source textures are photorealistic but corrupted. Pixel sorting creates smooth gradient streaks through detailed areas. Compression artifacts create blocky JPEG-like patterns. Some regions maintain sharp detail while adjacent areas dissolve into noise. VHS-style tracking errors create horizontal smear textures.",
      "Source lighting is preserved but distorted. Bright areas may pixel-sort differently than dark areas, creating unexpected separation of highlights and shadows. Color channel offset means shadows appear with color fringing halos. Blown-out highlights create white blocks that resist corruption effects.",
      "Any environment can be glitched — the source scene peeks through between corruption zones. Urban and digital environments (screens, cityscapes, interiors with technology) are thematically appropriate. The glitch effects themselves become a visual environment — walls of pixel noise, corridors of sorted color.",
      "Faces are partially recognizable through glitch disruption. Key features (eyes, mouth) remain readable while other regions are displaced or sorted. The tension between recognizable human features and digital corruption creates the emotional impact. One eye might be perfectly clear while the other is smeared across displaced pixel rows.",
    ]
  ),

  // ── Fine Art/Painting (6) ──
  preset(
    "oil-renaissance",
    "Oil Renaissance",
    "Classical oil painting technique with rich chiaroscuro, layered glazes, and the luminous depth of Old Master works.",
    "painting",
    ["oil", "classical", "chiaroscuro", "old-master", "glazes"],
    "#DAA520",
    "Brush",
    [
      "Render in classical Renaissance oil painting technique. Every element shows the layered translucency of oil glazes built up over time. Forms emerge from dark grounds with luminous highlighted areas. Compositions follow classical triangular or pyramidal arrangements. The style conveys timeless grandeur and mastery.",
      "Rich warm palette built from earth pigments: raw sienna, burnt umber, yellow ochre, vermillion, ultramarine blue. Dark backgrounds in near-black brown or deep green. Flesh tones glow with warm underlayers showing through cool upper glazes. Gold leaf accents on halos, frames, and decorative elements. Mood is solemn, majestic, and contemplative.",
      "Idealized classical proportions based on ancient Greek/Roman canons: 7.5-8 heads tall for heroic figures. Bodies show understanding of underlying anatomy — musculature is visible but idealized. Drapery follows the body's form beneath. Poses reference classical contrapposto — weight on one leg, gentle S-curve of the spine.",
      "No visible outlines — forms are built entirely through value and color transitions. Edges range from sharp (key focal points) to extremely soft (backgrounds and transitional areas). Lost-and-found edge technique: some contours dissolve into background while others are crisp. The drawing is in the painting itself.",
      "Visible oil paint texture: thick impasto in highlights and light areas, thin transparent glazes in shadows. Canvas weave may show through thin passages. Fabric textures are rendered through careful observation — velvet absorbs light, silk reflects it, linen shows weave. Skin has a luminous translucency from layered glazes.",
      "Dramatic chiaroscuro: strong single light source (typically upper left) creates deep shadows and bright highlights. The tenebrism technique pushes backgrounds into near-darkness while spotlighting figures. Soft reflected light bounces into shadow areas from nearby surfaces. No harsh edges on shadows — smooth value transitions.",
      "Classical architectural settings: marble columns, arched doorways, tessellated floors. Landscape backgrounds show the sfumato atmospheric perspective technique — distant elements dissolve into blue haze. Interior scenes are dimly lit with light entering from specific windows or candles. Rich textile drapery provides background texture and color.",
      "Faces show classical idealized beauty with naturalistic detail. Eyes are rendered with multiple transparent layers creating depth — visible iris structure, moist sclera, delicate eyelash detail. Expressions are restrained and dignified — gentle smiles, contemplative gazes, serene composure. Skin transitions smoothly from warm highlights to cool shadow with subtle color temperature shifts.",
    ]
  ),

  preset(
    "impressionist",
    "Impressionist",
    "Broken-color painting style with visible brushstrokes, light-dappled scenes, and the fleeting quality of captured moments.",
    "painting",
    ["brushstrokes", "light", "plein-air", "broken-color", "fleeting"],
    "#9ACD32",
    "Palette",
    [
      "Render in French Impressionist painting style capturing the fleeting effects of light and atmosphere. Visible individual brushstrokes build up the image through accumulation rather than blending. Forms are suggested rather than precisely defined. Every scene captures a specific moment in time through its light quality.",
      "Pure prismatic colors applied in separate brushstrokes that optically mix at viewing distance. No pre-mixed muddy colors. Blue shadows contain touches of purple and green. Sunlit areas mix yellow, orange, and white strokes. Avoided black — darkest tones are deep blue-violet. Mood is luminous, fresh, and spontaneous.",
      "Proportions are naturalistically observed from life. Figures are captured in candid everyday poses — sitting in gardens, walking on boulevards, working in fields. Bodies are suggested through brushwork rather than precisely drawn. Scale is observational — figures relate naturally to their environment. No idealization or exaggeration.",
      "No defined outlines — forms are built entirely through juxtaposed color patches. Edges are soft and vibrating where different colored brushstrokes meet. Contours dissolve and reform across the surface. Some edges are found through contrast, others are lost into surrounding color. The overall effect is atmospheric rather than linear.",
      "Heavily textured surface with visible brushwork throughout. Each stroke deposits a distinct mark of paint. Palette knife passages create thick ridges. Paint builds up thickly in light areas (impasto) and remains thinner in shadows. Canvas texture shows through thinner passages. The physical paint surface is part of the visual experience.",
      "Light is the primary subject. Dappled sunlight filtering through leaves creates patterns of warm yellow and cool blue-violet shadow. Time of day is immediately readable through color temperature. Reflections on water fragment and scatter light. Atmosphere scatters light creating hazy distances. Every shadow contains reflected color from surrounding objects.",
      "Outdoor plein-air scenes: sun-dappled gardens, cafe terraces, river banks, wheat fields, busy boulevards. Water surfaces are painted with horizontal strokes reflecting sky and surroundings. Architecture dissolves into atmospheric color at distance. Trees are masses of broken color suggesting foliage without painting individual leaves.",
      "Faces are suggested through a few confident strokes rather than detailed rendering. A warm highlight on the cheekbone, a shadow under the brow, a touch of red on the lips. Eyes may be just a dark accent with a catch-light. Expressions are read from overall gesture and color rather than precise feature rendering. Close-up detail is sacrificed for overall light effect.",
    ]
  ),

  preset(
    "art-nouveau",
    "Art Nouveau",
    "Organic decorative style with sinuous curves, floral motifs, whiplash lines, and elegant integration of figure and ornament.",
    "painting",
    ["organic", "decorative", "floral", "sinuous", "ornamental"],
    "#D2691E",
    "Leaf",
    [
      "Render in Art Nouveau style with flowing organic forms and elaborate decorative integration. Every element — figure, border, background — flows together in sinuous curves inspired by natural plant forms. The style elevates the decorative to fine art. Compositions are vertically oriented with elegant bilateral symmetry.",
      "Rich jewel tones: deep teals, warm golds, olive greens, burgundy reds, with muted earth backgrounds. Metallic gold is used extensively for outlines and decorative elements. Color is applied in flat areas bounded by strong decorative outlines. Mood is elegant, mystical, and sensuous. Muted harmonious palettes with gold accents.",
      "Elongated elegant proportions for human figures — 8-9 heads tall with long flowing hair and graceful curved poses. Bodies integrate with surrounding decorative elements — hair becomes flowing plant tendrils, clothing hems merge into ornamental borders. Figures are idealized and ethereal rather than anatomically realistic.",
      "Sinuous 'whiplash' curves define everything. Lines flow with organic rhythm — no sharp angles except in geometric accent patterns. Outlines vary from thick decorative borders to thin interior details. Vine and tendril motifs create continuous flowing line patterns. Lines suggest growth and natural movement. All contours are elegant and deliberately designed.",
      "Flat color fills within decorative outlined areas, similar to stained glass or cloisonne enamel. Hair has flowing wave texture defined by parallel curved lines. Fabric shows gentle folds through linear patterning. Backgrounds may show mosaic-like patterns or tessellated designs. Metallic gold leaf effect on decorative elements and outlines.",
      "Flat decorative lighting — no strong shadows or dramatic contrast. Gentle modeling through color value shifts within flat areas. Background areas may be darker to push forward luminous foreground figures. No cast shadows. Glowing quality comes from warm color against dark backgrounds rather than depicted light sources.",
      "Backgrounds are decorative flat patterns rather than spatial environments: flowing vine and flower motifs, peacock feather arrangements, geometric tessellations. When landscapes appear, they are stylized into decorative flat patterns — mountains become flowing curves, trees become ornamental shapes. Architectural elements use organic curved forms — arched doorways, flowing ironwork.",
      "Faces are idealized with heavy-lidded dreamy eyes, defined eyebrows, and small sensuous mouths. Hair is the most prominent feature — flowing in elaborate waves and curls that fill the composition. Faces are serene, mysterious, and otherworldly. Profile views are common, showing elegant nose lines and jaw curves. Decorative floral elements frame and integrate with facial features.",
    ]
  ),

  preset(
    "surrealist",
    "Surrealist",
    "Dreamlike painting style with impossible juxtapositions, melting forms, and photorealistic rendering of impossible scenes.",
    "painting",
    ["dreamlike", "impossible", "melting", "subconscious", "juxtaposition"],
    "#BA55D3",
    "Eye",
    [
      "Render in Surrealist painting style where photorealistic technique depicts impossible dream-logic scenes. Objects are precisely rendered but placed in illogical combinations and scales. Physical laws are selectively broken — things float, melt, merge, or transform. The technical mastery makes the impossible feel disturbingly real.",
      "Hyper-clear palette with precise color relationships. Desert landscapes use warm golden tones under impossibly clear blue skies. Objects maintain their 'real' colors even in surreal contexts. Mood oscillates between serene emptiness and anxious strangeness. Colors are naturalistic but the clarity itself feels uncanny — too perfect, too vivid.",
      "Realistic proportions for recognizable objects, but scale relationships are deliberately wrong. A pocket watch might be the size of a cliff face. An ant could be larger than a horse. Human figures are anatomically correct but may stretch, fragment, or hollow out. The realism of individual element proportions makes the impossible scale relationships more disturbing.",
      "Precise realistic linework rendered through paint rather than drawn lines. Edges are crisp and photographic for hard objects. Melting or transforming elements have smooth flowing contours that transition between states. No decorative or stylistic line treatment — the drawing is invisible, serving only to define precise realistic forms.",
      "Photorealistic textures applied to impossible subjects: melting watches have metal and glass texture as they droop. Desert sand has visible grain. Skin has pores and fine hair. The realism of surface detail is critical — it grounds the impossible imagery in tangible reality. Dream textures (clouds, water, mirrors) are rendered with scientific precision.",
      "Clear rational lighting that treats impossible scenes as if they were real. Strong directional sunlight creates crisp shadows — even impossible objects cast physically correct shadows. The consistent lighting across surreal and normal elements unifies the scene and increases the uncanny feeling. Deep atmospheric perspective in vast empty landscapes.",
      "Vast empty landscapes: infinite deserts, calm oceans stretching to horizon, featureless plains under enormous skies. Architectural fragments (classical columns, arches, drawers) sit incongruously in natural settings. Horizon lines are always visible, emphasizing vast empty space. The emptiness gives impossible objects room to breathe and be contemplated.",
      "Faces rendered with photorealistic precision but may be obscured, replaced, or fragmented. A face might dissolve into a landscape. Features might be rearranged or replaced with objects. When intact, faces show enigmatic expressions — neither happy nor sad, suspended in dream-state neutrality. Eyes are often closed or obscured, suggesting inner vision rather than outward seeing.",
    ]
  ),

  preset(
    "baroque",
    "Baroque",
    "Dramatic grandeur with powerful diagonals, rich fabric, deep contrast, and theatrical emotional intensity.",
    "painting",
    ["dramatic", "grandeur", "theatrical", "contrast", "rich"],
    "#8B0000",
    "Crown",
    [
      "Render in Baroque painting style emphasizing drama, grandeur, and emotional power. Compositions are dynamic with strong diagonal movement and theatrical staging. Figures burst with energy and emotion. Every element serves the dramatic narrative — nothing is calm or restrained. The style overwhelms the viewer with visual power.",
      "Rich deep palette dominated by crimson reds, royal blues, gold, and warm flesh tones against dark amber-brown backgrounds. Strong warm/cool contrast: warm light on figures against cool dark shadows. Gold and metallic elements gleam in light. Mood is intense, passionate, and theatrical. Deep color saturation in lit areas, near-black in shadows.",
      "Muscular heroic proportions: 7.5-8 heads tall with powerful builds showing dynamic musculature in action. Figures are in dramatic motion — reaching, twisting, falling, gesturing. Foreshortened limbs project toward the viewer. Groups of figures intertwine in complex arrangements. Drapery billows and flows with the action, never static.",
      "No visible outlines — form emerges from extreme value contrast (light against dark, dark against light). Lost edges dissolve figures into dark backgrounds. Found edges snap into focus at key dramatic points. The approach is painterly rather than linear. Sharp focus on faces and hands, softer everywhere else.",
      "Rich heavy paint application with visible brushwork. Fabrics are rendered with tactile luxury: velvet depth, satin sheen, gold brocade patterns. Skin has warm glow with visible blood beneath. Armor reflects surrounding light. Paint is thickest in highlights and thinnest in dark shadows where canvas may show.",
      "Intense dramatic lighting. Single powerful light source (often from upper left or above) creates extreme contrast between brilliantly lit surfaces and deep velvet shadows. Light models form with sculptor-like precision. Figures emerge from darkness as if spotlit. Reflected light provides subtle warmth in deepest shadows.",
      "Theatrical settings: grand palaces, clouded heavens, dramatic landscapes with stormy skies. Architecture is monumental — massive columns, sweeping staircases, grand arches. Clouds part to reveal divine light. Interiors are opulent with rich drapery and ornate decoration. Settings amplify the emotional drama of the figures.",
      "Faces express extreme emotion with theatrical intensity: ecstasy, agony, divine rapture, fierce determination. Eyes roll upward or lock with the viewer with piercing intensity. Mouths open in cry or prayer. Wrinkled brows show strain and passion. Every facial muscle is engaged in the emotion. Hands gesture with dramatic eloquence.",
    ]
  ),

  preset(
    "expressionist",
    "Expressionist",
    "Raw emotional painting with distorted forms, intense colors, visible violent brushwork, and psychological intensity.",
    "painting",
    ["emotional", "distorted", "intense", "raw", "psychological"],
    "#FF8C00",
    "Paintbrush",
    [
      "Render in Expressionist painting style prioritizing raw emotional impact over visual accuracy. Forms are deliberately distorted to convey inner psychological states. Color and brushwork are aggressive and emotionally driven rather than observational. The style screams rather than whispers — every element conveys feeling.",
      "Intense clashing colors used for emotional effect rather than naturalistic accuracy. Faces may be green or blue. Skies can be blood red. Color combinations are deliberately harsh and unsettling: acid yellows against deep blues, hot oranges against cold purples. Mood ranges from anxious to agonized. No subtle neutral tones — everything is emotionally charged.",
      "Deliberately distorted proportions reflecting psychological states. Figures may be elongated (conveying isolation), compressed (conveying oppression), or angular (conveying anxiety). Hands and faces are often oversized as the loci of expression. Bodies twist and contort beyond anatomical possibility. Proportions change based on emotional meaning, not physical reality.",
      "Bold aggressive linework — thick dark outlines that feel carved or gouged rather than drawn. Lines are angular and harsh, never flowing or graceful. Interior contours are jagged. Wood-cut influence: bold simplified shapes with dramatic black-white contrast. Lines express tension and violence. No delicate or refined line quality.",
      "Heavily textured paint surface with violent visible brushstrokes. Paint is applied thickly and aggressively — stabbed, scraped, dragged across the surface. Brushwork direction conveys energy and emotion: swirling for anxiety, vertical for falling, explosive for rage. The physical act of painting is visible in every mark.",
      "Flat or anti-naturalistic lighting. Shadows may be colored rather than dark. Light doesn't follow physical rules — it serves emotional purposes. Figures may glow against dark backgrounds or be consumed by aggressive shadow. No gentle modeling — value transitions are abrupt and jarring. Light itself feels threatening or oppressive.",
      "Environments reflect psychological states rather than physical reality. A room may close in oppressively. Streets tilt and converge unnaturally. Nature landscapes writhe and pulse with energy. Urban scenes are angular and threatening. Skies swirl and press downward. Architecture distorts to express the emotional state of the inhabitants.",
      "Faces are the primary vehicle for expression — gaunt, angular, mask-like. Eyes are wide or hollow. Mouths are open in screams or clamped shut in tension. Skull-like features show through skin. Color on faces is non-naturalistic — sickly greens, feverish reds, deathly blues. The face becomes a landscape of psychological states rather than a likeness.",
    ]
  ),

  // ── Illustration (6) ──
  preset(
    "pop-art-comic",
    "Pop Art Comic",
    "Bold Ben-Day dot style with thick outlines, saturated primary colors, and dramatic comic panel compositions.",
    "illustration",
    ["pop-art", "ben-day", "comic", "bold", "saturated"],
    "#FF1744",
    "Megaphone",
    [
      "Render in Pop Art comic book style inspired by Roy Lichtenstein and classic comic printing. Images look like enlarged comic book panels with visible printing artifacts. Bold graphic impact with flat colors and strong outlines. Everything is high-contrast and immediately readable as a graphic statement.",
      "Limited palette of pure primary and secondary colors: RED, BLUE, YELLOW, GREEN, BLACK, WHITE. No subtle tones or gradients. Colors are at maximum saturation. Ben-Day dot patterns (regular grids of colored dots) create secondary tones and simulate printing. Mood is bold, ironic, and graphically powerful.",
      "Comic book heroic proportions: broad-shouldered men, glamorous women with idealized features. Figures are dramatically posed as if caught in a single powerful moment. Hands clench, arms reach, bodies twist toward the viewer. Everything is a snapshot of peak action or peak emotion, frozen in a single panel.",
      "Very thick black outlines (4-5px equivalent) on all forms. Lines are uniform weight, bold, and confident. No line variation or organic quality — everything is clean and graphic. Interior detail lines are slightly thinner but still bold. All contours are simplified and decisive. Speech balloons have thick round borders.",
      "Ben-Day dots are the signature texture: regular patterns of evenly spaced colored dots at various sizes. Large dots for strong color, small dots for lighter tones. Flat solid fills for primary colored areas. No realistic texture — everything is graphically flat. The printing process itself becomes the visual texture.",
      "Flat lighting with bold graphic shadows. Shadows are solid black shapes with hard edges — no gradual transitions. Light side is full color, shadow side is black or heavily dotted. No subtle modeling. The contrast is purely graphic: light or dark, with the Ben-Day dots providing the only middle tones.",
      "Backgrounds are minimal and graphic: solid color fields, Ben-Day dot patterns, or simple environmental indicators (a few perspective lines suggesting a room). Focus is entirely on the figure and the graphic impact. When environments appear, they are simplified to bold graphic shapes with flat color.",
      "Faces are comic-book idealized with strong jawlines, defined features, and dramatic expressions. Eyes have visible detailed irises with defined lashes. Eyebrows are thick and expressive. Mouths are rendered with defined lip shapes. Expressions are heightened: dramatic tears, determined grimaces, wide-eyed shock. Hair is solid black or Ben-Day dotted blonde.",
    ]
  ),

  preset(
    "watercolor-botanical",
    "Watercolor Botanical",
    "Delicate transparent watercolor style with precise botanical detail, natural pigment bleeds, and scientific illustration elegance.",
    "illustration",
    ["watercolor", "botanical", "transparent", "delicate", "scientific"],
    "#90EE90",
    "Flower2",
    [
      "Render in traditional watercolor botanical illustration style with precise observational detail and delicate transparent washes. Each element is painted with scientific accuracy and artistic beauty. White paper shows through transparent layers creating luminosity. The style combines scientific precision with painterly grace.",
      "Natural pigment palette: sap greens, viridian, cadmium yellows, alizarin crimson, ultramarine blue, raw sienna. Colors are achieved through transparent layered washes — pigment settles into paper texture creating subtle granulation. White is always the paper itself, never painted. Mood is serene, precise, and naturally beautiful.",
      "Proportions are botanically accurate — plants are rendered at life-size or with noted scale ratios. All structural details are precisely observed: leaf venation patterns, petal overlaps, stem cross-sections, root structures. When fauna appears, it follows the same precise observational accuracy. Scientific accuracy is paramount.",
      "Delicate precise pencil lines visible beneath transparent washes. Initial graphite drawing shows through thin paint layers. Fine-line pen may add crisp detail over dried watercolor. Lines are precise and controlled — scientific rather than expressive. Stem and leaf outlines are clean and botanically accurate.",
      "Transparent watercolor washes showing paper grain texture. Wet-on-wet techniques create soft pigment bleeds and blooms where colors merge. Wet-on-dry creates crisp edges with visible layering. Granulating pigments (ultramarine, raw sienna) show characteristic mineral texture. Paper texture is integral to the visual effect.",
      "Soft diffused natural lighting as if the specimen is viewed under even daylight. Shadows are transparent colored washes (never opaque grey). Light areas are simply unpainted white paper. Subtle three-dimensional modeling through layered value washes. No dramatic lighting — even, observational illumination that reveals every structural detail.",
      "Specimens float on white paper background — the traditional botanical illustration convention. No environmental context unless specifically illustrating habitat. White space is used generously, allowing the specimen to be studied in isolation. Occasionally, a simple ground shadow anchors the subject. Multiple study views (whole plant, detail close-ups, cross-sections) may share one composition.",
      "When human or animal subjects appear, they are treated with the same observational precision as botanical subjects. Faces show precise detail rendered through delicate transparent washes. Features are accurately proportioned with naturalistic detail. The watercolor medium gives skin a luminous living quality. Eyes show precise anatomical structure. Expressions are neutral and observational.",
    ]
  ),

  preset(
    "art-deco",
    "Art Deco",
    "Geometric elegance with bold symmetry, metallic accents, sunburst patterns, and luxurious streamlined forms.",
    "illustration",
    ["geometric", "elegant", "metallic", "symmetry", "luxurious"],
    "#FFD700",
    "Diamond",
    [
      "Render in Art Deco illustration style emphasizing geometric precision, luxury, and modern elegance. All forms are stylized into clean geometric shapes with strong symmetry. The style celebrates the machine age — speed, industry, and glamour. Every composition balances bold graphic impact with sophisticated refinement.",
      "Luxurious metallic palette: gold, silver, chrome, black, and cream white. Accent colors are jewel-toned: emerald green, sapphire blue, ruby red. Strong contrast between black backgrounds and metallic gold elements. Mood is glamorous, powerful, and sophisticated. No muted or muddy colors — everything is crisp and refined.",
      "Human figures are idealized and elongated: 9-10 heads tall with impossibly long legs, narrow waists, and elegant posture. Figures are stylized into geometric simplification — bodies become series of triangles, circles, and rectangles. Poses are static and symmetrical rather than dynamic. Figures serve as elegant geometric elements within the composition.",
      "Bold geometric linework with consistent weight. Straight lines and perfect geometric curves (arcs, circles) dominate. No organic or hand-drawn line quality. Stepped patterns (ziggurats, chevrons) create borders and frames. Parallel line groups create depth and texture. Sunburst/ray patterns radiate from central focal points.",
      "Flat color fills within geometric shapes. Metallic effects through parallel line shading (gold striping on black). No painterly texture — all surfaces are smooth and industrial. Chrome/mirror surfaces are depicted through graduated parallel lines. Geometric patterns (chevrons, zigzags, fans, keystones) serve as surface decoration.",
      "Stylized geometric lighting: sunburst rays emanate from light sources. Shadows are geometric shapes — triangular, stepped, or fan-shaped. Light and shadow create geometric patterns rather than naturalistic illumination. Spotlight effects with clean circular or conical light shapes. High contrast between lit and shadowed areas.",
      "Architectural environments showcase Deco design: stepped skyscrapers, streamlined trains, ocean liners, grand hotel lobbies. All architecture features Deco ornamental vocabulary: chevron patterns, ziggurat stepping, fan shapes, geometric flora. Cityscapes show gleaming towers against dramatic skies with searchlight beams. Interiors are opulent with geometric floor patterns and metallic fixtures.",
      "Faces are geometrically stylized: angular jawlines, arched eyebrows, defined cheekbones, strong nose lines. Eyes are almond-shaped with heavy lids and dramatic lashes. Lips are precisely defined. Expressions are cool, sophisticated, and enigmatic — no broad emotion, only elegant composure. Hair is sculpted into smooth geometric waves or sleek caps.",
    ]
  ),

  preset(
    "storybook",
    "Storybook",
    "Warm children's book illustration with cozy textures, gentle characters, and inviting narrative compositions.",
    "illustration",
    ["children", "cozy", "narrative", "warm", "whimsical"],
    "#DEB887",
    "BookOpen",
    [
      "Render in classic children's storybook illustration style with warmth, charm, and narrative clarity. Every image tells a story — characters interact with their environment in ways that invite the reader into the scene. The style is hand-crafted and personal, avoiding anything slick or digital-looking. Everything feels lovingly made.",
      "Warm cozy palette: honey golds, forest greens, warm browns, soft reds, cream whites. Colors are slightly muted as if printed on quality paper stock. Mood is inviting, safe, and magical. Night scenes use deep blues with warm golden window-light. Season is clearly conveyed through palette choices. Occasional bright accent colors for magical elements.",
      "Characters have gently exaggerated proportions for warmth and expressiveness. Children are round-faced with large eyes relative to face size (but not anime-large). Adults have kind, slightly caricatured features. Animal characters stand upright with human-like proportions. Everyone looks huggable and approachable. Scale may be slightly off for whimsical effect.",
      "Visible hand-drawn line quality with gentle wobble and personality. Lines are confident but not mechanical — they have the warmth of pen on textured paper. Weight varies naturally: thicker on near elements, thinner on distant ones. Hatching and cross-hatching for shadow. Loose line quality on foliage and textures. Ink line with watercolor or gouache fills.",
      "Rich variety of hand-made textures: cross-hatch shading, pencil grain, watercolor washes, gouache opacity. Fabric shows knitted, woven, or quilted patterns. Wood has visible grain. Stone has rough texture. Fur is suggested through directional strokes. Everything has a tactile handmade quality. Print-like textures (stipple, line pattern) add warmth.",
      "Warm diffused lighting that feels like a cozy room or gentle outdoor light. Indoor scenes glow with fireplace warmth or soft lamp light. Outdoor scenes have gentle sun through clouds. Shadows are colored (warm browns or soft purples), never harsh black. Light creates atmosphere rather than drama. Magical elements glow with soft warm inner light.",
      "Inviting detailed environments that reward close looking: cluttered cozy kitchens, overgrown cottage gardens, winding forest paths, snowy village streets. Every environment is full of small discoverable details — a sleeping cat, a specific book title, a hidden mouse. Environments feel lived-in and loved. Architecture has personality: leaning chimneys, round doors, crooked fences.",
      "Faces are expressive and endearing. Large round eyes convey emotion clearly. Rosy cheeks suggest warmth and health. Mouths are small but highly expressive — tiny smiles, worried O-shapes, delighted grins. Noses are small and round. Eyebrows are expressive. Animal faces have anthropomorphic expressions while maintaining species characteristics. Every face has personality and warmth.",
    ]
  ),

  preset(
    "graphic-novel",
    "Graphic Novel",
    "Sophisticated sequential art with cinematic framing, noir-influenced inking, and mature visual storytelling.",
    "illustration",
    ["sequential", "cinematic", "noir", "ink", "storytelling"],
    "#4A4A4A",
    "PenTool",
    [
      "Render in sophisticated graphic novel style suited for mature literary comics. Cinematic framing emphasizes mood and narrative through composition. The style balances between detailed realism and artistic stylization. Panel compositions reference film language: establishing shots, close-ups, over-the-shoulder angles. Every frame advances the story visually.",
      "Primarily monochrome or limited palette: black and white with grey tones, or a restrained palette of 3-4 colors. When color is used, it's strategic and symbolic — a single red element in a grey scene, warm sepia for flashbacks. Mood is controlled and atmospheric. High contrast between inked blacks and white space. Atmosphere through value, not color variety.",
      "Realistic proportions grounded in observed life — characters look like real people with individual body types, postures, and physical presence. No idealization. Figures have weight and occupy space realistically. Perspective is accurate with proper foreshortening. Character acting is subtle — small gestures and posture shifts convey meaning.",
      "Rich varied inking with brush, pen, and dry-brush techniques. Brush strokes create dynamic thick-thin variation. Hatching and cross-hatching build tone and texture. Spot blacks (large solid black areas) create drama and contrast. Dry-brush effects suggest texture and atmosphere. White space is used as actively as black. Line quality ranges from precise to expressively loose depending on mood.",
      "Ink-driven textures: cross-hatching density creates tonal range. Brush dry-drag creates rough surfaces. Stippling for gradual transitions. Hair texture through directional ink strokes. Fabric wrinkles rendered with confident brushwork. Architectural surfaces through varied hatching angles. Rain and weather through directional mark-making.",
      "Noir-influenced lighting with dramatic shadows. Characters partially obscured by shadow — faces half-lit, figures emerging from darkness. Light through venetian blinds creates stripe patterns. Street lamps create pools of light in dark scenes. Interior lighting from single sources creates long shadows. Shadow is used narratively — concealing, revealing, threatening.",
      "Grounded real-world environments rendered with selective detail. City streets with accurate architecture and signage. Interiors that tell stories through objects and arrangement. Environments match narrative mood — oppressive spaces feel cramped in frame, open spaces breathe. Background detail varies: dense for establishing shots, minimal for emotional close-ups.",
      "Naturalistic faces with individual character through specific features: a particular nose shape, a scar, tired eyes, a distinctive jawline. Expressions are understated and psychologically real — no exaggerated cartoon emotions. Acting is in the eyes and small mouth movements. Characters age visibly through stories. Faces carry history and experience in their lines.",
    ]
  ),

  preset(
    "scientific",
    "Scientific",
    "Precise technical illustration with anatomical accuracy, labeled diagrams, clean rendering, and educational clarity.",
    "illustration",
    ["technical", "anatomical", "diagram", "precise", "educational"],
    "#5F9EA0",
    "Microscope",
    [
      "Render in scientific/technical illustration style prioritizing clarity, accuracy, and educational value. Every element is precisely observed and rendered to communicate structural information. Cross-sections, exploded views, and labeled diagrams are standard techniques. Beauty emerges from precision rather than artistic expression.",
      "Clean professional palette: neutral greys and whites for backgrounds, precise naturalistic colors for specimens. Subtle color coding differentiates structures (arteries red, veins blue, nerves yellow). Limited palette avoids distraction from information. Mood is objective, clear, and authoritative. White or light grey backgrounds standard.",
      "Proportions are scientifically accurate to documented measurements. Anatomical structures maintain proper spatial relationships. Scale bars and measurement indicators accompany illustrations. When enlarged (microscopic views), magnification is noted. No stylistic distortion — accuracy is the only rule.",
      "Precise technical linework in consistent weight. Fine-point pen or technical pen quality: uniform, controlled, sharp. Stippling (thousands of tiny dots) builds tone and three-dimensional form. Hatching follows surface contours to communicate form. Leader lines connect labels to structures. All lines serve informational purpose.",
      "Stipple rendering is the signature technique: millions of tiny ink dots at varying density create smooth tonal gradients. High-dot-density areas recede as shadow, low-density areas advance as highlight. Surface textures are precisely communicated: smooth bone, rough cartilage, fibrous muscle, glossy organ surfaces. Each material has a characteristic stipple pattern.",
      "Even clinical lighting that reveals all structural detail equally. Slight directional bias (upper left) for three-dimensional modeling through stipple density. No dramatic shadows that would obscure information. Consistent lighting across all elements in a plate. No atmospheric effects — clarity over mood.",
      "White or light neutral backgrounds — specimens float in clean space for maximum clarity. Minimal environmental context unless specifically illustrating habitat or in-situ conditions. Multiple views (dorsal, ventral, lateral, cross-section) arranged on a single plate. Scale references (ruler, coin, hand) when helpful. Clean borders and organized layout.",
      "When human faces appear, they are rendered with anatomical precision showing underlying bone structure, musculature, and surface anatomy. Eyes show precise anatomical structure: corneal curve, iris pattern, pupil dilation. No emotional expression — faces are in neutral anatomical position. Medical illustration tradition: precise, detached, scientifically authoritative.",
    ]
  ),

  // ── Photography Style (4) ──
  preset(
    "vintage-film-grain",
    "Vintage Film Grain",
    "Analog photography aesthetic with warm color shifts, organic grain, light leaks, and the imperfect beauty of expired film.",
    "photography",
    ["analog", "film", "grain", "light-leaks", "vintage"],
    "#C4A882",
    "Film",
    [
      "Render with the aesthetic of vintage analog film photography from the 1970s-80s. Images should feel like they were shot on expired Kodak or Fuji film stock. Organic imperfections are features, not flaws: grain structure, color shifts, light leaks, and soft focus edges. The style evokes nostalgia and the physicality of photochemical imaging.",
      "Warm shifted colors as if the film stock has aged: yellowed whites, orange-shifted reds, muted blues that lean teal. Shadow areas take on a warm brown or green cast. Highlights bloom slightly warm. Overall desaturation compared to modern digital but with rich specific color: Kodachrome warmth or Fuji Pro green undertones. Faded blacks that never reach pure black.",
      "Natural photographic proportions — real people and places captured candidly. No idealization. Subjects are composed with the slightly imperfect framing of handheld shooting: slightly off-center subjects, tilted horizons, background distractions. The imperfection feels authentic and spontaneous. Depth of field is shallow with soft backgrounds.",
      "No artificial lines — definition comes from photographic focus and contrast. Edges are slightly soft overall with a gentle bloom on highlights. Sharpest focus on the subject with progressive softening toward frame edges (vintage lens vignette effect). No clinical digital sharpness — everything has the gentle resolution of period glass lenses.",
      "Film grain is visible throughout: fine organic pattern of random clumps varying with exposure (finer grain in highlights, larger clumps in shadows). Different from digital noise — grain is warm and organic. Color grain shows subtle red/green/blue speckling at high magnification. Light leak textures create warm orange/red washes at frame edges.",
      "Natural available light only — no flash or studio lighting. Indoor scenes use window light or tungsten bulb warmth. Outdoor scenes capture specific times of day through color temperature. Exposure may be slightly imperfect: pushed shadows, blown highlights. The limitations of period metering are part of the aesthetic.",
      "Everyday environments captured with documentary authenticity: suburban streets, kitchen interiors, backyard gatherings, road trip landscapes. Environments show their era through period details. Backgrounds are soft-focused but present enough to establish place and time. Architecture and vehicles suggest the 1970s-80s period.",
      "Faces are captured candidly with available light. Skin tones are warm with the characteristic color cast of the film stock. Shallow depth of field may render only the eyes sharp while ears and hair soften. Natural expression caught between moments — not posed smiles. Wrinkles and imperfections are preserved. The film grain texture sits on top of skin creating a organic, human quality.",
    ]
  ),

  preset(
    "cinematic-widescreen",
    "Cinematic Widescreen",
    "Film-grade cinematography style with 2.39:1 aspect ratio, precise color grading, dramatic depth, and blockbuster composition.",
    "photography",
    ["cinema", "widescreen", "color-grading", "dramatic", "blockbuster"],
    "#1C1C1C",
    "Clapperboard",
    [
      "Render in cinematic widescreen format (2.39:1 aspect ratio) with professional film-grade visual quality. Compositions use cinematic language: rule of thirds, leading lines, foreground framing elements, and negative space. Every frame is designed like a shot from a major motion picture. The image feels like a still from a film you want to watch.",
      "Professional color grading with deliberate teal-and-orange complementary contrast (the Hollywood standard). Alternatively: desaturated cool palette for thriller mood, warm golden tones for period drama, high-contrast silver for action. Blacks are crushed and rich. Highlights are controlled. Every color choice serves the narrative mood.",
      "Realistic proportions captured through cinematic lens choices. Wide-angle for environments (slight barrel distortion at edges). Long lens for portraits (compressed perspective, bokeh background). Character placement within frame follows cinematic blocking conventions. Scale communicates power dynamics — low angles make figures imposing.",
      "No artificial lines — all definition comes from photographic qualities: focus, contrast, and light. Lens characteristics are visible: soft vignetting at frame edges, subtle chromatic aberration on high-contrast edges, anamorphic lens flare streaks on light sources. Everything has the optical signature of professional cinema lenses.",
      "Photorealistic detail with cinematic texture: skin has visible pores with professional makeup sheen. Fabric shows weave and drape. Metal reflects environment. Atmosphere visible as haze, dust motes in light shafts, rain droplets. Shallow depth of field blurs textures into smooth bokeh. Film-grain overlay (subtle) adds organic quality to digital clarity.",
      "Dramatic intentional lighting designed like a cinematographer's setup. Key light, fill light, and rim light create three-dimensional depth. Motivated light sources within the scene (windows, lamps, screens) provide naturalistic justification. God rays through atmosphere. Silhouettes against bright backgrounds. Chiaroscuro for dramatic portraits. Every shadow is designed.",
      "Environments are production-designed: every element in frame is intentional. Urban scenes show weathered detail — puddles reflecting neon, steam rising from grates. Natural landscapes capture epic scale with tiny human figures for reference. Interiors are atmospheric with depth — foreground objects frame middle-ground subjects against background context. Letterbox black bars at top and bottom.",
      "Faces are captured with professional portrait cinematography: precise eye light creating catch-lights, subtle rim light separating hair from background, key light sculpting cheekbone and jawline. Skin has the quality of professional makeup under controlled lighting. Expressions are subtle and cinematic — meaningful glances, restrained emotion. Eyes are always the sharpest point of focus.",
    ]
  ),

  preset(
    "polaroid-instant",
    "Polaroid Instant",
    "Instant camera aesthetic with square format, white borders, slightly faded colors, and spontaneous snapshot energy.",
    "photography",
    ["instant", "square", "snapshot", "faded", "spontaneous"],
    "#F5F5DC",
    "Camera",
    [
      "Render with the aesthetic of Polaroid instant photography: square format (1:1 aspect ratio) with the iconic white border frame. Images have the spontaneous, one-of-a-kind quality of instant photos. Slight chemical imperfections and color shifts distinguish this from clean digital capture. Each image feels like a unique physical object.",
      "Slightly faded and shifted color palette: whites are creamy/yellowish, blues lean slightly cyan, reds are warm but slightly muted. Colors overall are softer and less saturated than modern digital. Green tones lean warm. Shadow detail is limited — dark areas block up into warm near-black. Highlights have a creamy quality rather than pure white. Nostalgic and intimate mood.",
      "Casual spontaneous framing — subjects are centered or slightly off-center with the energy of a quick snapshot. No professional composition rules — the charm is in the imperfect, immediate quality. Close-up subjects may be slightly too close with cropped heads. Group photos have people at slightly awkward angles. Authentically casual.",
      "Soft overall focus characteristic of the fixed plastic lens. Center of frame is reasonably sharp, edges soften noticeably. No clinical sharpness anywhere. Slight halo around high-contrast edges from the basic lens optics. The softness is warm and flattering rather than blurry — it smooths skin and diffuses light pleasantly.",
      "Chemical texture unique to instant film: slight surface sheen, occasional light spots from uneven chemical development, subtle color banding at development boundaries. Fingerprint smudges on the white border add authenticity. The image sits on the white card stock with a slight raised quality. No grain visible at this format — the look is smooth but imperfect.",
      "Flash or available light — instant cameras typically used built-in flash creating flat frontal lighting with slight red-eye tendency. Flash creates harsh small shadows behind subjects against walls. Outdoor available-light shots have more natural lighting but still the slightly flat quality of the simple lens. No professional lighting nuance.",
      "Everyday environments: birthday parties, vacation spots, backyards, living rooms, beaches. The subject matter is always personal and intimate — these are memories, not art projects. Background detail is soft and secondary to the subject. The white border frames everything with equal importance, regardless of subject matter.",
      "Faces are lit with direct flash creating flat, honest rendering. Red-eye may be visible. Expressions are genuine and unguarded: caught-in-the-moment laughter, surprised looks, casual smiles before being ready. Skin is smoothed by the soft lens. No one looks professionally photographed — everyone looks human and real. The snapshot aesthetic makes everyone photogenic through authenticity.",
    ]
  ),

  preset(
    "double-exposure",
    "Double Exposure",
    "Layered photographic technique with two merged images, ghostly transparency, and poetic visual metaphors.",
    "photography",
    ["layered", "merged", "transparency", "ghostly", "metaphor"],
    "#8A2BE2",
    "Layers",
    [
      "Render in photographic double-exposure style where two distinct images are layered and merged into a single frame. The technique creates poetic visual metaphors — a portrait merged with a landscape, a figure blended with natural elements. Light areas of one image reveal the other, creating ghostly transparent intersections.",
      "Desaturated or monochromatic palette works best for clarity of the double-exposure effect. Cool blue-grey or warm sepia toning unifies the two merged images. High-contrast images merge most effectively. Mood is dreamlike, contemplative, and metaphorical. When color is used, it's subtle and cohesive between both layers.",
      "Two different scale systems coexist: typically a close-up portrait (filling the frame) merged with a wider landscape or detailed texture (also filling the frame). The portrait silhouette contains the landscape within it. Or two similarly-scaled subjects overlap creating ghostly doubles. Proportions of each individual image are photorealistic.",
      "No artificial lines. Form is defined by the interaction of two overlapping photographic exposures. The silhouette edge of the dominant image (usually the portrait) becomes the frame within which the second image is revealed. Within the overlap zone, details from both images create complex visual webs of intersecting forms.",
      "Photographic texture from both source images blends: skin pores overlay with leaf textures, hair strands merge with tree branches, fabric weave combines with architectural patterns. The accidental textile created by overlapping textures is a key aesthetic pleasure. Smooth areas of one image reveal detail from the other.",
      "The two exposures interact through additive light: bright areas of both images compound to become even brighter (potentially overexposed). Dark areas of one image mask the other, creating selective reveals. The brightest areas of the portrait (forehead, nose, cheeks) show the most of the secondary image. Shadows remain as anchor points of the primary image.",
      "The secondary image is typically a natural landscape (forests, ocean, sky, mountains) or an architectural/urban scene that creates symbolic contrast with the primary portrait. Trees growing from a figure's silhouette. City lights visible through a face. Stars filling a person's form. The environment becomes internal — landscape as psychological state.",
      "Faces are partially visible, partially dissolved into the overlapping imagery. Key features (eyes, lips, profile edge) remain as anchor points while other areas dissolve into the secondary exposure. The face becomes a window or container for another world. Expression is contemplative — closed eyes or distant gaze work best. The face is both present and dissolving.",
    ]
  ),

  // ── Atmospheric/Dark (4) ──
  preset(
    "dark-fantasy",
    "Dark Fantasy",
    "Moody atmospheric fantasy with deep shadows, ethereal lighting, ancient mystical elements, and ominous grandeur.",
    "atmospheric",
    ["moody", "ethereal", "mystical", "ancient", "ominous"],
    "#4A0E4E",
    "Skull",
    [
      "Render in dark fantasy art style combining epic fantasy grandeur with gothic atmosphere and ominous mood. Scenes feel ancient, powerful, and slightly threatening. Magic is real but dangerous — it glows and corrupts. Architecture is monumental and crumbling. Nature is wild and primordial. Everything suggests a world of power and peril.",
      "Deep desaturated palette: charcoal blacks, midnight blues, deep purples, dried-blood reds, tarnished golds. Punctuated by magical light sources: ethereal blue-white glows, sickly green magic, molten orange fire. Mood is ominous and awe-inspiring. Shadows dominate with light as rare and precious. Warm tones only from fire sources.",
      "Fantasy character proportions: tall imposing warriors in elaborate armor (8-9 heads tall), gaunt mages in flowing robes, creatures mixing human and monstrous anatomy. Everything is slightly larger-than-life. Armor is ornate with organic and skeletal motifs. Weapons are oversized and decorative. Poses are powerful and commanding.",
      "Detailed refined linework visible within painterly rendering. Fine detail on armor engravings, magical rune patterns, and architectural stonework. Edges are primarily soft and atmospheric with selective sharp focus on key narrative elements. Line quality varies: precise for metalwork, organic for natural elements, ethereal for magic effects.",
      "Rich detailed textures: tarnished and weathered metal, cracked leather, rough-hewn stone, ancient fabric with fraying edges. Natural materials show age and wear. Magical elements have smooth ethereal quality contrasting with rough physical world. Skin may show scars, tattoos, or magical corruption. Every surface tells a story of age and use.",
      "Dramatic high-contrast lighting with mostly dark scenes punctuated by intense light sources. Fire provides warm dramatic illumination. Magical energy casts colored light (blue, green, purple) with otherworldly quality. Volumetric fog and mist scatter light creating atmospheric depth. Rim lighting outlines figures against dark backgrounds. Multiple colored light sources create complex shadow play.",
      "Epic fantasy environments: towering ruined castles, ancient forests with massive twisted trees, underground caverns with glowing crystals, fog-shrouded battlefields. Architecture is monumental and weathered — carved stone faces, crumbling towers, vast throne rooms. Nature is primordial and untamed. Weather is dramatic: lightning storms, swirling mists, blood-red sunsets.",
      "Faces show intensity and otherworldly quality: glowing eyes (magical characters), scarred and weathered features (warriors), gaunt angular features (mages/undead). Expressions are severe: grim determination, cold menace, sorrowful wisdom. No casual or light expressions. Hoods and helmets partially obscure faces adding mystery. Non-human characters have detailed alien facial features.",
    ]
  ),

  preset(
    "gothic-horror",
    "Gothic Horror",
    "Victorian horror aesthetic with oppressive architecture, lurking shadows, decay, and creeping supernatural dread.",
    "atmospheric",
    ["victorian", "horror", "decay", "shadows", "dread"],
    "#2C0A1A",
    "Ghost",
    [
      "Render in Gothic horror style evoking Victorian supernatural terror. Architecture is oppressive and labyrinthine. Shadows conceal more than they reveal. The atmosphere is thick with dread and the suggestion of things lurking just beyond sight. Beautiful and terrifying in equal measure. Every scene should create unease.",
      "Nearly monochrome palette: blacks, deep greys, sickly yellows, and cold blue-whites. Occasional blood red as the only saturated color. Candlelight provides warm amber spots against overwhelming cold darkness. Fog diffuses everything into grey uncertainty. Mood is oppressive, claustrophobic, and dread-filled. Faded, decayed color — nothing is vivid or healthy.",
      "Victorian-era human proportions with horror distortion: gaunt thin figures in period clothing, elongated shadows, slightly wrong proportions that create unease. Ghosts and creatures have stretched, contorted anatomy. Living characters are pale and drawn. Clothing is elaborate Victorian — high collars, long coats, flowing gowns — but faded and deteriorating.",
      "Fine detailed inking with heavy blacks. Cross-hatching creates oppressive shadow areas. Lines are precise for architectural detail (ironwork, carved stone, ornate frames) and loose/scratchy for organic horror elements. Textures are built through accumulated linework. Fine spider-web-like lines for delicate decay. Bold dramatic blacks for shadow masses.",
      "Decay textures throughout: cracking plaster, peeling wallpaper, tarnished silver, rotting wood, cobwebs, dust. Fabric is moth-eaten and faded. Stone is crumbling and lichen-covered. Metal is corroded. Everything is deteriorating from within. Moisture stains and mold patterns on walls. Physical decomposition as visual motif.",
      "Candlelight and firelight are the primary sources: warm amber glow that barely penetrates surrounding darkness. Pools of light surrounded by impenetrable shadow. Lightning provides brief harsh illumination. Moonlight is cold and blue, filtering through broken windows. Light is always insufficient — darkness dominates every scene. Things move in the shadows.",
      "Claustrophobic Victorian interiors: narrow corridors, cramped attic rooms, vast ballrooms gone to ruin. Overgrown graveyards with tilting headstones. Fog-shrouded moors. Abandoned asylums with peeling paint. Gothic architecture: pointed arches, gargoyles, wrought iron gates. Every environment is simultaneously grand and decaying. Secret passages, hidden rooms, sealed doors.",
      "Pale faces with dark-circled eyes emerging from shadow. Victorian beauty standards with supernatural overlay: alabaster skin too white to be healthy, eyes that reflect light unnaturally, mouths that suggest predatory intent beneath prim composure. Horror faces show wide eyes, open mouths, expressions frozen in terror. Ghost faces are partially transparent, partially decayed.",
    ]
  ),

  preset(
    "lovecraftian",
    "Lovecraftian",
    "Cosmic horror style with impossible geometry, tentacled forms, sanity-bending vistas, and the vastness of unknowable entities.",
    "atmospheric",
    ["cosmic", "tentacles", "impossible", "sanity", "vast"],
    "#0D3B2E",
    "Octagon",
    [
      "Render in Lovecraftian cosmic horror style depicting things that should not exist. Geometry is non-Euclidean — angles that don't add up, spaces that fold impossibly, architecture that hurts to perceive. Scale suggests entities so vast that human comprehension fails. The horror comes from the incomprehensible, not the grotesque.",
      "Deep oceanic palette: abyssal blacks, deep sea greens, phosphorescent blue-greens, sickly bioluminescent yellows. Ancient stone greys. Colors shift unnaturally — surfaces seem to change hue when viewed from different angles. Mood is cosmic dread — the realization of human insignificance. Colors from deep underwater and deep space dominate.",
      "Human figures are tiny and insignificant against incomprehensible cosmic entities. Entities defy consistent proportion — tentacles, eyes, mouths, and wings at impossible scales and quantities. Architecture has wrong proportions: doorways too tall and narrow, stairs at impossible angles, rooms with too many corners. Nothing follows terrestrial logic.",
      "Detailed intricate linework for architectural and organic horror elements. Fine tentacle textures with thousands of suckers. Stone carvings with alien hieroglyphs. Lines become distorted and warped near reality-bending entities — straight lines curve, parallel lines converge. The linework itself suggests madness and perceptual breakdown.",
      "Slimy organic textures: wet tentacle surfaces with visible suckers, chitin-like shell textures, mucous membranes, ancient barnacle-encrusted surfaces. Stone textures that seem organic on close inspection. Deep-sea bioluminescence: glowing spots in darkness. Ancient book pages with crumbling edges. Textures suggest biology that doesn't follow earthly rules.",
      "Lighting from unnatural sources: bioluminescence, eldritch energy, phosphorescent organisms, light that doesn't cast correct shadows. Deep underwater scenes lit from below. Cosmic voids with light that comes from everywhere and nowhere. Light behaves incorrectly near cosmic entities — shadows point wrong directions, light bends around impossible geometry.",
      "Non-Euclidean architecture: cyclopean ruins with walls at impossible angles, sunken cities with alien geometry, vast underground caverns of carved stone. Deep ocean trenches. Starless cosmic voids. Ancient libraries with infinite shelves. Environments that seem larger on the inside than outside. Perspectives that shift when not directly observed. Scale is vertiginously vast.",
      "Human faces show the progression of cosmic awareness: from curiosity to unease to horror to madness. Wide eyes, slack jaws, expressions of minds breaking under impossible knowledge. Entity 'faces' are incomprehensible: clusters of eyes in wrong arrangements, mouths within mouths, features that rearrange when attention shifts. No face should be fully comprehensible.",
    ]
  ),

  preset(
    "steampunk",
    "Steampunk",
    "Victorian industrial fantasy with brass gears, steam-powered machinery, goggles, and retro-futuristic mechanical wonder.",
    "atmospheric",
    ["victorian", "brass", "gears", "steam", "mechanical"],
    "#B8860B",
    "Settings",
    [
      "Render in steampunk aesthetic blending Victorian-era elegance with fantastical industrial machinery. Every surface features clockwork gears, brass fittings, riveted plates, and steam pipes. Technology is analog, mechanical, and beautiful — form follows function with ornamental flourishes. The world runs on steam, clockwork, and ingenuity.",
      "Warm metallic palette: brass gold, copper orange, burnished bronze, iron grey, weathered steel blue. Rich wood browns for panels and frames. Deep burgundy, forest green, and navy blue for fabric and leather. Mood is adventurous and industrious. Steam creates warm atmospheric haze. Amber glass and warm gas-lamp lighting throughout.",
      "Victorian human proportions with mechanical augmentation: characters wear goggles, mechanical prosthetic limbs, gear-studded corsets, and utility belts with tools. Bodies are dressed in layers: shirts, vests, coats, belts, pouches. Mechanical devices are integrated into clothing and accessories. Both elegance and function in every character design.",
      "Precise technical linework for mechanical components: clean circles for gears, straight lines for pistons and pipes, precise curves for pressure vessels. Organic elements (people, plants) use softer more natural lines. The contrast between technical precision (machines) and organic flow (humans) is deliberate. Engraving-style cross-hatching for metallic shading.",
      "Highly detailed mechanical textures: brushed brass with visible machining marks, riveted steel plates with raised bolt heads, polished mahogany with visible grain, tooled leather with stitching detail. Glass gauges and dials with printed numbers. Steam and smoke have soft atmospheric texture. Every mechanical element has visible construction logic.",
      "Warm gas-lamp and fire lighting: amber tungsten glow from filament lamps, orange flicker from furnace doors, warm brass reflections. Factory environments have dramatic shaft-of-light effects through dirty windows. Outdoor scenes use warm Victorian-era lighting — no harsh modern light. Steam catches and scatters warm light creating atmospheric haze.",
      "Elaborate Victorian-industrial environments: factory floors with massive steam engines, airship docking towers, clockwork laboratories, brass-fitted submarine interiors. City streets combine Victorian architecture with added mechanical elements — gear-driven streetcars, pneumatic tube postal systems, mechanical advertisement boards. Sky filled with dirigibles and smoke stacks.",
      "Faces show Victorian character types: determined inventors with soot-smudged cheeks, elegant adventurers with brass goggles pushed up on foreheads, stern captains with mechanical monocles. Expressions convey determination, curiosity, and wonder. Mutton-chop sideburns, elaborate hairstyles, and period-appropriate grooming. Goggles leave pale circles around eyes against soot-darkened skin.",
    ]
  ),
];

export function getPresetById(id: string): PromptPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export function getRelatedPresets(
  id: string,
  count: number = 4
): PromptPreset[] {
  const preset = getPresetById(id);
  if (!preset) return [];
  return PRESETS.filter(
    (p) => p.id !== id && (p.category === preset.category || p.tags.some((t) => preset.tags.includes(t)))
  ).slice(0, count);
}
