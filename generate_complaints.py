"""
CivicAlert - Synthetic Complaint Dataset Generator (v2)
========================================================
Run:    python generate_complaints.py
Output: complaints.csv  (training data)

WHY v2?  The old file had only 20 unique sentences, so the model memorised
them. This version builds complaints from small parts (issue + impact +
place + style), so the dataset has ~2500 DIFFERENT sentences, including
Hinglish, typos and very short complaints.

LABEL RUBRIC (write this in your report - it is how labels are decided)
-----------------------------------------------------------------------
Critical : immediate danger to life / possible injury right now
           (live wire, open manhole, gas leak, collapse risk)
High     : serious hazard, health risk or essential service fully down
           (burst pipe, sewage in homes, no power/water for days)
Medium   : real inconvenience or service degraded, no direct danger
Low      : cosmetic / minor / can wait

How a label is made:
    base severity of the issue (0-3)
    +1 if an impact phrase is added (school, hospital, accident, children...)
    -1 if a dampener is added ("not urgent", "very little traffic")
    5% of labels are shifted by one level (real raters disagree) -> label noise
"""

import random
import pandas as pd

random.seed(42)

N_ROWS = 2500
LEVELS = ["Low", "Medium", "High", "Critical"]

LOCALITIES = ["Sakchi", "Bistupur", "Telco", "Adityapur", "Kadma", "Mango",
              "Sonari", "Jugsalai", "Golmuri", "Sidhgora", "Baridih",
              "Burmamines"]

# ---------------------------------------------------------------- ISSUES
# (category, text, base severity 0-3)
ISSUES_EN = [
    # Road
    ("Road", "deep pothole on the road", 2),
    ("Road", "huge pothole in the middle of the road", 2),
    ("Road", "small potholes on the road", 1),
    ("Road", "road surface is cracked and uneven", 1),
    ("Road", "open manhole on the road", 3),
    ("Road", "road marking has faded", 0),
    ("Road", "speed breaker is broken", 1),
    ("Road", "road has caved in after the rain", 2),
    ("Road", "divider on the main road is broken", 1),
    # Electricity
    ("Electricity", "high tension wire has fallen down", 3),
    ("Electricity", "electric pole is leaning and sparking", 3),
    ("Electricity", "transformer is sparking and making a loud noise", 3),
    ("Electricity", "streetlight is not working", 1),
    ("Electricity", "streetlight is a bit dim", 0),
    ("Electricity", "streetlight keeps flickering", 1),
    ("Electricity", "there is no power supply in the area", 2),
    ("Electricity", "frequent power cuts", 1),
    ("Electricity", "loose wires are hanging low", 2),
    # Water
    ("Water", "water pipeline has burst and water is flowing on the road", 2),
    ("Water", "water pressure is very low", 1),
    ("Water", "dirty contaminated water is coming from the tap", 2),
    ("Water", "tap water has a slight smell", 1),
    ("Water", "public tap keeps dripping", 0),
    ("Water", "no water supply for many days", 2),
    # Garbage
    ("Garbage", "garbage has not been collected for many days", 2),
    ("Garbage", "garbage van does not come on time", 1),
    ("Garbage", "dustbin is overflowing", 1),
    ("Garbage", "dustbin needs to be shifted to another spot", 0),
    ("Garbage", "dead animal is lying on the road", 2),
    ("Garbage", "garbage is being burnt and smoke is spreading", 2),
    ("Garbage", "pile of garbage is blocking the lane", 2),
    # Drainage
    ("Drainage", "drain is blocked and dirty water is overflowing", 2),
    ("Drainage", "sewage is overflowing on the road", 2),
    ("Drainage", "drain cover is missing", 3),
    ("Drainage", "drain cover is broken", 2),
    ("Drainage", "drain is clogged with plastic", 1),
    ("Drainage", "small drain needs cleaning", 0),
    # Gas Leak
    ("Gas Leak", "there is a strong smell of gas from the pipeline", 3),
    ("Gas Leak", "gas pipeline is leaking", 3),
    ("Gas Leak", "faint gas smell near the meter", 2),
    # Building Safety
    ("Building Safety", "wall has a big crack and may collapse", 3),
    ("Building Safety", "old building is leaning dangerously", 3),
    ("Building Safety", "plaster is peeling off the wall", 1),
    ("Building Safety", "boundary wall has small cracks", 1),
    ("Building Safety", "balcony railing is broken", 2),
    # Public Property
    ("Public Property", "park gate is broken", 1),
    ("Public Property", "grass in the park has grown very long", 0),
    ("Public Property", "park bench is old and needs a fresh coat of paint", 0),
    ("Public Property", "swings in the park are broken", 1),
    ("Public Property", "bus stop roof is damaged", 1),
    ("Public Property", "public toilet is locked and dirty", 1),
    # Other
    ("Other", "stray dogs are attacking people", 2),
    ("Other", "tree branch has fallen and is blocking the road", 2),
    ("Other", "tree is leaning dangerously over the road", 2),
    ("Other", "hoarding is hanging loose and may fall", 2),
    ("Other", "loudspeaker noise continues late at night", 0),
]

ISSUES_HI = [
    ("Road", "sadak par bada gaddha ho gaya hai", 2),
    ("Road", "sadak par chhote chhote gaddhe hain", 1),
    ("Road", "manhole ka dhakkan khula hua hai", 3),
    ("Road", "sadak ka paint mit gaya hai", 0),
    ("Road", "speed breaker toot gaya hai", 1),
    ("Electricity", "bijli ka taar toot kar gir gaya hai", 3),
    ("Electricity", "pole se chingari nikal rahi hai", 3),
    ("Electricity", "streetlight kharab hai", 1),
    ("Electricity", "streetlight thodi dim hai", 0),
    ("Electricity", "kai din se bijli nahi hai", 2),
    ("Electricity", "bar bar light chali jati hai", 1),
    ("Water", "pani ki pipeline phat gayi hai", 2),
    ("Water", "nal me ganda pani aa raha hai", 2),
    ("Water", "pani ka pressure bahut kam hai", 1),
    ("Water", "nal se pani tapakta rehta hai", 0),
    ("Garbage", "kachra kai din se nahi utha hai", 2),
    ("Garbage", "kachre ki gaadi time par nahi aati", 1),
    ("Garbage", "kachra jalaya ja raha hai aur dhuan fail raha hai", 2),
    ("Garbage", "dustbin ko dusri jagah rakhna hai", 0),
    ("Drainage", "naali jam ho gayi hai aur ganda pani bah raha hai", 2),
    ("Drainage", "naali ka dhakkan gayab hai", 3),
    ("Drainage", "chhoti naali ki safai karni hai", 0),
    ("Gas Leak", "gas pipeline se gas leak ho rahi hai", 3),
    ("Gas Leak", "gas ki halki smell aa rahi hai", 2),
    ("Building Safety", "deewar me badi darar aa gayi hai aur gir sakti hai", 3),
    ("Building Safety", "boundary wall me chhoti darar hai", 1),
    ("Public Property", "park ka gate tuta hua hai", 1),
    ("Public Property", "park me ghaas bahut badh gayi hai", 0),
    ("Public Property", "park ki bench purani ho gayi hai", 0),
    ("Other", "awara kutte logon par hamla kar rahe hain", 2),
    ("Other", "ped ki daal sadak par gir gayi hai", 2),
]

# ---------------------------------------------------------------- MODIFIERS
IMPACT_EN = [
    "it is near a school", "it is right in front of the hospital",
    "an accident happened here yesterday", "children are getting hurt",
    "it is very dangerous at night", "old people are struggling because of it",
    "an ambulance cannot pass", "bike riders keep slipping here",
    "it is on the main road with heavy traffic",
    "two people were injured because of this",
]
IMPACT_HI = [
    "yeh school ke paas hai", "hospital ke bilkul saamne hai",
    "kal yahan accident ho gaya", "bachche chot kha rahe hain",
    "raat me yeh bahut khatarnak hai", "buzurgon ko bahut dikkat ho rahi hai",
    "ambulance nikal nahi pa rahi", "main road par bahut traffic rehta hai",
]
DAMPEN_EN = [
    "but it is not urgent", "it is only a minor inconvenience",
    "it is a lane with very little traffic", "can be done whenever possible",
]
DAMPEN_HI = [
    "itna zaroori nahi hai", "bas thodi dikkat hoti hai",
    "is gali me traffic bahut kam hai", "jab time mile tab dekh lena",
]

PLACES_EN = ["near the market", "near the bus stand", "near the temple",
             "near the railway station", "at the main chowk",
             "near the colony gate", "near the petrol pump", "in our lane"]
PLACES_HI = ["bazaar ke paas", "bus stand ke paas", "mandir ke paas",
             "station ke paas", "main chowk par", "colony ke gate par",
             "hamari gali me"]

PREFIX_EN = ["Urgent: ", "Sir, ", "Request: ", "Please help - ", "Complaint: "]
PREFIX_HI = ["Sir, ", "Kripya dhyan dein: ", "Urgent: ", "Namaste, "]


def add_typo(text):
    """Randomly drop or swap a character in one word."""
    words = text.split(" ")
    idx = random.randrange(len(words))
    w = words[idx]
    if len(w) > 4:
        i = random.randrange(1, len(w) - 2)
        if random.random() < 0.5:
            w = w[:i] + w[i + 1:]                      # drop a char
        else:
            w = w[:i] + w[i + 1] + w[i] + w[i + 2:]    # swap two chars
        words[idx] = w
    return " ".join(words)


ALL_ISSUES = ([(c, t, b, "en") for c, t, b in ISSUES_EN] +
              [(c, t, b, "hi") for c, t, b in ISSUES_HI])


def make_one():
    issue_id = random.randrange(len(ALL_ISSUES))
    category, issue, base, lang = ALL_ISSUES[issue_id]
    hi = lang == "hi"

    level = base
    extra = None
    roll = random.random()
    boost_p = 0.15 if base == 0 else 0.45                # cosmetic issues rarely escalate
    if roll < boost_p and level < 3:                     # impact boost
        extra = random.choice(IMPACT_HI if hi else IMPACT_EN)
        level += 1
    elif 0.45 <= roll < 0.60 and 1 <= base <= 2:                 # dampener
        extra = random.choice(DAMPEN_HI if hi else DAMPEN_EN)
        level -= 1
    elif 0.45 <= roll < 0.75 and base == 3:                      # critical + context
        extra = random.choice(IMPACT_HI if hi else IMPACT_EN)

    locality = random.choice(LOCALITIES)
    parts = issue

    if random.random() < 0.40:
        parts += " " + random.choice(PLACES_HI if hi else PLACES_EN)
    if random.random() < 0.35:
        parts += f" in {locality}" if not hi else f" {locality} me"

    if extra:
        sep = random.choice([". ", ", ", " - "])
        parts = parts + sep + extra
    # 12% very short complaints (just the issue words)
    if random.random() < 0.12:
        parts = issue

    text = parts[0].upper() + parts[1:]
    if random.random() < 0.20:
        text = random.choice(PREFIX_HI if hi else PREFIX_EN) + text
    if random.random() < 0.12:
        text = add_typo(text)
    if not text.endswith("."):
        text += random.choice([".", "", "!"])

    level = max(0, min(3, level))
    # label noise: real raters disagree sometimes
    if random.random() < 0.05:
        level = max(0, min(3, level + random.choice([-1, 1])))

    return {"complaint_text": text, "category": category,
            "location": locality, "priority": LEVELS[level],
            "issue_id": issue_id}


def generate(n=N_ROWS):
    seen, rows = set(), []
    attempts = 0
    while len(rows) < n and attempts < n * 50:
        attempts += 1
        r = make_one()
        key = r["complaint_text"].lower()
        if key in seen:
            continue
        seen.add(key)
        rows.append(r)
    df = pd.DataFrame(rows)
    df.insert(0, "complaint_id", [f"C{i:05d}" for i in range(1, len(df) + 1)])
    df.to_csv("complaints.csv", index=False)

    print(f"complaints.csv created: {len(df)} rows, "
          f"{df.complaint_text.nunique()} unique texts")
    print(df.priority.value_counts().to_dict())

    # Leak check: training texts must not appear in the hand-written test set
    try:
        test = pd.read_csv("test_set.csv")
        overlap = set(df.complaint_text.str.lower()) & \
                  set(test.complaint_text.str.lower())
        print(f"Overlap with test_set.csv: {len(overlap)} (must be 0)")
    except FileNotFoundError:
        print("test_set.csv not found yet - put it in this folder.")


if __name__ == "__main__":
    generate()
