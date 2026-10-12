"""
CivicAlert - Severity Rules (keyword scorer)
=============================================
Idea in one line:
    The AI model guesses the priority from text. These rules look for
    DANGER WORDS. If the rules say "this is dangerous", the final priority
    can never be lower than what the rules say. (Safety net.)

How the score works (every matched keyword adds points):
    LIFE_DANGER   +6   live wire, gas leak, manhole, collapse, fire ...
    SERIOUS       +3   accident, injured, burst, sewage, cracks, sick ...
    CONTEXT       +2   school, hospital, children, night, main road ...
    HAZARD_OBJECT +2   wire, pole, transformer, drain, pothole, bridge ...
    DAMPENER      -3   "minor", "little", "faded", "paint", "not urgent" ...
                       (dampeners are IGNORED if a LIFE_DANGER word is found,
                        so "minor" can never hide a gas leak)

    score >= 6  -> rules say Critical
    score >= 4  -> rules say High
    otherwise   -> rules have no opinion (model decides)

Final priority = the HIGHER of (model prediction, rule floor).
Rules only ever RAISE a priority, never lower it.

Edit the lists below to add more words. Everything is plain text patterns
(regular expressions); \\b means "word boundary".
"""

import re

LEVELS = ["Low", "Medium", "High", "Critical"]

# ---------------------------------------------------------------- keywords
LIFE_DANGER = [          # +6 each
    r"\blive wire", r"\bhigh[- ]tension", r"\bspark\w*", r"\bchingari",
    r"\bfire\b", r"\baag\b", r"\bblast\w*", r"\bexplo\w+",
    r"\bgas (is )?leak\w*", r"\bleak\w* (of )?gas",
    r"\bgas\b.{0,30}(smell|badbu|leak)", r"(smell|badbu).{0,30}\bgas\b",
    r"\blpg\b",
    r"\bmanhole",
    r"drain cover.{0,15}missing", r"missing.{0,15}drain cover",
    r"dhakkan gayab",
    r"\bcollaps\w*", r"\bgir (sakti|sakta|jayega|jayegi)",
    r"\belectrocut\w*", r"electric shock", r"\bcurrent (lag|aa)\w*",
    r"\btrapped\b", r"\bfas (gay|gaya|gayi)\b", r"\bdrown\w*",
    r"fallen (electric )?pole", r"pole (has )?fallen", r"wire (has )?fallen",
    r"fallen wire", r"\btaar\b.{0,25}\b(gir|toot)\w*",
]

SERIOUS = [              # +3 each
    r"\baccident", r"\binjur\w*", r"\bchot\b", r"\bhurt\b", r"\bskid\w*",
    r"\bslipp\w*", r"\bbehosh", r"\bfell\b",
    r"\bbitten\b", r"\bbites?\b", r"\battack\w*",
    r"\bbit (three|two|four|many|kids|children|people|a child)",
    r"\bkaat (liya|liye)",
    r"\bburst\b", r"\bphat gayi",
    r"\bsewage",
    r"\bcontaminat\w*", r"\bganda pani", r"\bdirty (brown )?water",
    r"\binfection", r"\bbimar", r"\bsick\b", r"\bdizz\w*", r"\bfever",
    r"\basthma", r"\bvomit\w*",
    r"\b(no|without) (water|electricity|power)\b", r"\b(pani|bijli) (nahi|band)",
    r"\bsupply.{0,30}\b(cut|band|stopped|off)\b",
    r"\bdangerous\w*", r"\bkhatarnak", r"\bkhatra\b",
    r"\bcrack\w*", r"\bdarar",
    r"\bleaning\b", r"\btilt\w*", r"\bjhuk\w*",
    r"\bhang\w*", r"\blatak\w*",
    r"\brailing",
    r"\bdead \w+", r"\brotting",
    r"\bsmoke", r"\bdhuan",
    r"\bflood\w*", r"\bunder water", r"\bghus\w*",
    r"\bambulance",
    r"\b(can|may|might) fall\b",
]

CONTEXT = [              # +2 each (where / who is affected)
    r"\bschool", r"\bcollege", r"\bhospital", r"\bclinic",
    r"\bchild\w*", r"\bkids?\b", r"\bbachch\w*",
    r"\belderly", r"\bold (people|man|woman|person)", r"\bbuzurg",
    r"\bnight\b", r"\braat\b",
    r"\bwomen\b", r"\bladies\b", r"\bmahila",
    r"\bmain road", r"\bhighway", r"\bflyover", r"\bjunction", r"\btraffic",
]

HAZARD_OBJECT = [        # +2 each (things that become dangerous when damaged)
    r"\bwires?\b", r"\btaar\b", r"\bpole\b", r"\bkhamba",
    r"\btransformer", r"\bdrain\b", r"\bnaal[ei]\b", r"\bnala\b",
    r"\bpipeline", r"\btank\b",
    r"\bpothole\w*", r"\bgaddh\w*", r"\bcrater",
    r"\bbridge", r"\bslab\b",
]

DAMPENER = [             # -3 each (only used when no LIFE_DANGER word is found)
    r"not (very )?urgent", r"no hurry", r"\bminor\b", r"\blittle\b",
    r"\bslight\w*", r"\ba bit\b", r"\bthod[ai]\b", r"\bchhot[ie]\b",
    r"\bsmall\b", r"\bfad(ed|ing)\b", r"\bdim\b", r"\bpaint\w*",
    r"\brepaint", r"\bbench\b", r"no danger", r"itna zaroori nahi",
    r"jab time mile", r"\bsometime\b", r"\bwhenever\b",
]

GROUPS = [
    ("Life-danger word", LIFE_DANGER, 6),
    ("Serious-hazard word", SERIOUS, 3),
    ("Impact context", CONTEXT, 2),
    ("Hazardous object", HAZARD_OBJECT, 2),
]


def _find(patterns, text):
    """
    Return the list of matched words for these patterns.
    If two patterns match the same part of the text (e.g. 'gas leak' matched
    by two different patterns), it is counted only once.
    """
    hits, used_spans = [], []
    for p in patterns:
        m = re.search(p, text)
        if not m:
            continue
        s, e = m.span()
        if any(s < ue and us < e for us, ue in used_spans):
            continue                      # overlaps an earlier match, skip
        used_spans.append((s, e))
        hits.append(m.group(0).strip())
    return hits


def score_complaint(text: str) -> dict:
    """
    Returns:
      score       - total points
      floor       - "Critical" / "High" / None  (minimum priority the rules demand)
      rules_only  - priority if we used ONLY rules (for the comparison table)
      reasons     - human-readable list of why the score is what it is
    """
    t = (text or "").lower()
    score = 0
    reasons = []

    life_hit = False
    for name, patterns, weight in GROUPS:
        for h in _find(patterns, t):
            score += weight
            reasons.append(f"{name}: '{h}' (+{weight})")
            if name == "Life-danger word":
                life_hit = True

    # Dampeners only reduce the score when there is NO life-danger word
    if not life_hit:
        for h in _find(DAMPENER, t):
            score -= 3
            reasons.append(f"Minor-issue word: '{h}' (-3)")

    if score >= 6:
        floor = "Critical"
    elif score >= 4:
        floor = "High"
    else:
        floor = None

    if score >= 6:
        rules_only = "Critical"
    elif score >= 4:
        rules_only = "High"
    elif score >= 1:
        rules_only = "Medium"
    else:
        rules_only = "Low"

    return {"score": score, "floor": floor,
            "rules_only": rules_only, "reasons": reasons}


def combine(model_priority: str, floor):
    """Final priority = the higher of model prediction and rule floor."""
    if floor is None:
        return model_priority
    if LEVELS.index(floor) > LEVELS.index(model_priority):
        return floor
    return model_priority


if __name__ == "__main__":
    # Quick self-test: python severity_rules.py
    samples = [
        "The old water tank wall has cracked badly and is leaning toward the houses",
        "Park bench paint is fading",
        "Stray dogs bit three kids in our lane this week",
        "Gas smell near school, children getting dizzy",
        "Streetlight is a little dim",
    ]
    for s in samples:
        r = score_complaint(s)
        print(f"\n{s}\n  score={r['score']}  floor={r['floor']}  rules_only={r['rules_only']}")
        for why in r["reasons"]:
            print("   -", why)
