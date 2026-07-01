"""
English Grammar in Use 5th Ed - PDF Extractor
Extracts pages as HD images and generates structured units.json
"""

import sys
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import fitz  # PyMuPDF
import json
import os

PDF_PATH = "English Grammar in Use 5th Ed - Raymond Murphy.pdf"
OUTPUT_DIR = os.path.join("web", "pages")
UNITS_JSON_PATH = os.path.join("web", "units.json")

# DPI 150 is a good balance: sharp enough for mobile/tablet, small file size
DPI = 150
ZOOM = DPI / 72  # fitz uses 72 DPI as base
JPEG_QUALITY = 82  # Good visual quality, small file size


def extract_pages():
    """Extract all pages as optimized JPEG images."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    doc = fitz.open(PDF_PATH)
    total_pages = len(doc)
    print(f"Total pages in PDF: {total_pages}")

    mat = fitz.Matrix(ZOOM, ZOOM)

    for i in range(total_pages):
        page = doc[i]
        pix = page.get_pixmap(matrix=mat)

        # Save as JPEG for much smaller file size (~70% reduction vs PNG)
        output_path = os.path.join(OUTPUT_DIR, f"page_{i + 1:03d}.jpg")
        pix.save(output_path, jpg_quality=JPEG_QUALITY)

        # Progress indicator
        pct = int((i + 1) / total_pages * 100)
        bar = "=" * (pct // 2) + "-" * (50 - pct // 2)
        print(f"\r  [{bar}] {pct}% ({i + 1}/{total_pages})", end="", flush=True)

    doc.close()
    print(f"\nExtracted {total_pages} pages as JPEG to {OUTPUT_DIR}/")
    return total_pages


def extract_text_per_page():
    """Extract text content from each page for search functionality."""
    doc = fitz.open(PDF_PATH)
    texts = {}
    for i in range(len(doc)):
        page = doc[i]
        text = page.get_text("text").strip()
        if text:
            texts[i + 1] = text
    doc.close()
    return texts


def generate_units_json(total_pages, texts):
    """
    Generate a structured units.json based on the known structure of
    English Grammar in Use 5th Edition.
    
    The book structure (based on Table of Contents):
    - Pages 1-5: Title, Copyright, Contents
    - Pages 6-7: To the student / To the teacher
    - Pages 8-297: Units 1-145 (each unit = 2 pages)
    - Pages 298-307: Appendices 1-7
    - Pages 308-331: Additional Exercises
    - Pages 332-341: Study Guide
    - Pages 342-394: Answer Key
    - Pages 395+: Index
    """

    # Known section structure of English Grammar in Use 5th Ed
    sections = [
        {
            "id": "present-future",
            "title": "Present and Future",
            "icon": "🕐",
            "color": "#3B82F6",
            "units": [
                {"id": 1, "title": "Present continuous (I am doing)"},
                {"id": 2, "title": "Present simple (I do)"},
                {"id": 3, "title": "Present continuous and present simple 1 (I am doing and I do)"},
                {"id": 4, "title": "Present continuous and present simple 2 (I am doing and I do)"},
            ]
        },
        {
            "id": "past",
            "title": "Past",
            "icon": "⏪",
            "color": "#8B5CF6",
            "units": [
                {"id": 5, "title": "Past simple (I did)"},
                {"id": 6, "title": "Past continuous (I was doing)"},
            ]
        },
        {
            "id": "present-perfect",
            "title": "Present Perfect and Past",
            "icon": "✅",
            "color": "#10B981",
            "units": [
                {"id": 7, "title": "Present perfect 1 (I have done)"},
                {"id": 8, "title": "Present perfect 2 (I have done)"},
                {"id": 9, "title": "Present perfect continuous (I have been doing)"},
                {"id": 10, "title": "Present perfect continuous and simple (I have been doing and I have done)"},
                {"id": 11, "title": "How long have you (been) ...?"},
                {"id": 12, "title": "For and since / When ...? and How long ...?"},
                {"id": 13, "title": "Present perfect and past 1 (I have done and I did)"},
                {"id": 14, "title": "Present perfect and past 2 (I have done and I did)"},
            ]
        },
        {
            "id": "past-perfect",
            "title": "Past Perfect",
            "icon": "⏮️",
            "color": "#F59E0B",
            "units": [
                {"id": 15, "title": "Past perfect (I had done)"},
                {"id": 16, "title": "Past perfect continuous (I had been doing)"},
            ]
        },
        {
            "id": "have-used",
            "title": "Have and used to",
            "icon": "🔄",
            "color": "#EF4444",
            "units": [
                {"id": 17, "title": "Have and have got"},
                {"id": 18, "title": "Used to (do)"},
            ]
        },
        {
            "id": "future",
            "title": "Future",
            "icon": "🚀",
            "color": "#06B6D4",
            "units": [
                {"id": 19, "title": "Present tenses (I am doing / I do) for the future"},
                {"id": 20, "title": "(I'm) going to (do)"},
                {"id": 21, "title": "Will and shall 1"},
                {"id": 22, "title": "Will and shall 2"},
                {"id": 23, "title": "I will and I'm going to"},
                {"id": 24, "title": "Will be doing and will have done"},
                {"id": 25, "title": "When I do / When I've done / When and if"},
            ]
        },
        {
            "id": "modals",
            "title": "Modals",
            "icon": "💡",
            "color": "#D946EF",
            "units": [
                {"id": 26, "title": "Can, could and (be) able to"},
                {"id": 27, "title": "Could (do) and could have (done)"},
                {"id": 28, "title": "Must and can't"},
                {"id": 29, "title": "May and might 1"},
                {"id": 30, "title": "May and might 2"},
                {"id": 31, "title": "Have to and must"},
                {"id": 32, "title": "Must mustn't needn't"},
                {"id": 33, "title": "Should 1"},
                {"id": 34, "title": "Should 2"},
                {"id": 35, "title": "Had better / It's time ..."},
                {"id": 36, "title": "Would"},
                {"id": 37, "title": "Can/Could/Would you ...? etc. (Requests, offers, permission)"},
            ]
        },
        {
            "id": "conditionals-wish",
            "title": "If and wish",
            "icon": "🌟",
            "color": "#F97316",
            "units": [
                {"id": 38, "title": "If I do ... and If I did ..."},
                {"id": 39, "title": "If I knew ... / I wish I knew ..."},
                {"id": 40, "title": "If I had known ... / I wish I had known ..."},
                {"id": 41, "title": "Wish"},
            ]
        },
        {
            "id": "passive",
            "title": "Passive",
            "icon": "🔀",
            "color": "#14B8A6",
            "units": [
                {"id": 42, "title": "Passive 1 (is done / was done)"},
                {"id": 43, "title": "Passive 2 (be done / been done / being done)"},
                {"id": 44, "title": "Passive 3"},
                {"id": 45, "title": "It is said that ... / He is said to ... etc."},
                {"id": 46, "title": "Have/Get something done"},
            ]
        },
        {
            "id": "reported-speech",
            "title": "Reported Speech",
            "icon": "💬",
            "color": "#6366F1",
            "units": [
                {"id": 47, "title": "Reported speech 1 (He said that ...)"},
                {"id": 48, "title": "Reported speech 2"},
            ]
        },
        {
            "id": "questions-auxiliary",
            "title": "Questions and Auxiliary Verbs",
            "icon": "❓",
            "color": "#EC4899",
            "units": [
                {"id": 49, "title": "Questions 1"},
                {"id": 50, "title": "Questions 2 (Do you know where ...? / He asked me where ...)"},
                {"id": 51, "title": "Auxiliary verbs (have/do/can etc.) / I think so / I hope so etc."},
                {"id": 52, "title": "Question tags (do you? / isn't it? etc.)"},
            ]
        },
        {
            "id": "ing-infinitive",
            "title": "-ing and to ...",
            "icon": "📝",
            "color": "#84CC16",
            "units": [
                {"id": 53, "title": "Verb + -ing (enjoy doing / stop doing etc.)"},
                {"id": 54, "title": "Verb + to ... (decide to ... / forget to ... etc.)"},
                {"id": 55, "title": "Verb (+ object) + to ... (I want you to ...)"},
                {"id": 56, "title": "Verb + -ing or to ... 1 (remember, regret etc.)"},
                {"id": 57, "title": "Verb + -ing or to ... 2 (try, need, help)"},
                {"id": 58, "title": "Verb + -ing or to ... 3 (like, would like etc.)"},
                {"id": 59, "title": "Prefer and would rather"},
                {"id": 60, "title": "Preposition (in/for/about etc.) + -ing"},
                {"id": 61, "title": "Be/get used to ... (I'm used to ...)"},
                {"id": 62, "title": "Verb + preposition + -ing (succeed in -ing / insist on -ing etc.)"},
                {"id": 63, "title": "Expressions + -ing"},
                {"id": 64, "title": "To ..., for ... and so that ... (purpose)"},
                {"id": 65, "title": "Adjective + to ..."},
                {"id": 66, "title": "To ... (afraid to do) and preposition + -ing (afraid of -ing)"},
                {"id": 67, "title": "See somebody do and see somebody doing"},
                {"id": 68, "title": "-ing clauses (Feeling tired, I went to bed early.)"},
            ]
        },
        {
            "id": "articles-nouns",
            "title": "Articles and Nouns",
            "icon": "📰",
            "color": "#0EA5E9",
            "units": [
                {"id": 69, "title": "Countable and uncountable 1"},
                {"id": 70, "title": "Countable and uncountable 2"},
                {"id": 71, "title": "Countable nouns with a/an and some"},
                {"id": 72, "title": "A/an and the"},
                {"id": 73, "title": "The 1"},
                {"id": 74, "title": "The 2 (school / the school etc.)"},
                {"id": 75, "title": "The 3 (children / the children)"},
                {"id": 76, "title": "The 4 (the giraffe / the telephone / the old etc.)"},
                {"id": 77, "title": "Names with and without the 1"},
                {"id": 78, "title": "Names with and without the 2"},
                {"id": 79, "title": "Singular and plural"},
                {"id": 80, "title": "Noun + noun (a bus driver / a headache)"},
                {"id": 81, "title": "'s (the girl's name) and of (the name of the book)"},
            ]
        },
        {
            "id": "pronouns-determiners",
            "title": "Pronouns and Determiners",
            "icon": "👤",
            "color": "#A855F7",
            "units": [
                {"id": 82, "title": "Myself/yourself/themselves etc."},
                {"id": 83, "title": "A friend of mine / my own house / on my own"},
                {"id": 84, "title": "There ... and it ..."},
                {"id": 85, "title": "Some and any"},
                {"id": 86, "title": "No/none/any / Nothing/nobody etc."},
                {"id": 87, "title": "Much, many, little, few, a lot, plenty"},
                {"id": 88, "title": "All / all of / most / most of / no / none of etc."},
                {"id": 89, "title": "Both / both of / neither / neither of / either / either of"},
                {"id": 90, "title": "All, every and whole"},
                {"id": 91, "title": "Each and every"},
            ]
        },
        {
            "id": "relative-clauses",
            "title": "Relative Clauses",
            "icon": "🔗",
            "color": "#F43F5E",
            "units": [
                {"id": 92, "title": "Relative clauses 1: clauses with who/that/which"},
                {"id": 93, "title": "Relative clauses 2: clauses with and without who/that/which"},
                {"id": 94, "title": "Relative clauses 3: whose/whom/where"},
                {"id": 95, "title": "Relative clauses 4: extra information clauses (1)"},
                {"id": 96, "title": "Relative clauses 5: extra information clauses (2)"},
                {"id": 97, "title": "-ing and -ed clauses (the woman talking to Tom, the boy injured in the accident)"},
            ]
        },
        {
            "id": "adjectives-adverbs",
            "title": "Adjectives and Adverbs",
            "icon": "⚡",
            "color": "#22D3EE",
            "units": [
                {"id": 98, "title": "Adjectives ending in -ing and -ed (boring/bored etc.)"},
                {"id": 99, "title": "Adjectives: a nice new house, you look tired"},
                {"id": 100, "title": "Adjectives and adverbs 1 (quick/quickly)"},
                {"id": 101, "title": "Adjectives and adverbs 2 (well, fast, late, hard/hardly)"},
                {"id": 102, "title": "So and such"},
                {"id": 103, "title": "Enough and too"},
                {"id": 104, "title": "Quite, pretty, rather and fairly"},
                {"id": 105, "title": "Comparison 1 (cheaper, more expensive etc.)"},
                {"id": 106, "title": "Comparison 2 (much better etc. / any better? etc.)"},
                {"id": 107, "title": "Comparison 3 (as ... as / than)"},
                {"id": 108, "title": "Superlatives (the longest, the most enjoyable etc.)"},
                {"id": 109, "title": "Word order 1: verb + object; place and time"},
                {"id": 110, "title": "Word order 2: adverbs with the verb"},
                {"id": 111, "title": "Still, yet and already / Any more, any longer, no longer"},
                {"id": 112, "title": "Even"},
            ]
        },
        {
            "id": "conjunctions",
            "title": "Conjunctions and Prepositions",
            "icon": "🔗",
            "color": "#FB923C",
            "units": [
                {"id": 113, "title": "Although / though / even though / In spite of / despite"},
                {"id": 114, "title": "In case"},
                {"id": 115, "title": "Unless / As long as / Provided"},
                {"id": 116, "title": "As (As I walked ... / As I didn't ... etc.)"},
                {"id": 117, "title": "Like and as"},
                {"id": 118, "title": "Like / as if / as though"},
                {"id": 119, "title": "For, during and while"},
                {"id": 120, "title": "By and until / By the time ..."},
            ]
        },
        {
            "id": "prepositions",
            "title": "Prepositions",
            "icon": "📍",
            "color": "#4ADE80",
            "units": [
                {"id": 121, "title": "At/on/in (time)"},
                {"id": 122, "title": "On time and in time / At the end and in the end"},
                {"id": 123, "title": "In/at/on (position) 1"},
                {"id": 124, "title": "In/at/on (position) 2"},
                {"id": 125, "title": "In/at/on (position) 3"},
                {"id": 126, "title": "To, at, in and into"},
                {"id": 127, "title": "In/at/on (other uses)"},
                {"id": 128, "title": "By"},
                {"id": 129, "title": "Noun + preposition (reason for, cause of etc.)"},
                {"id": 130, "title": "Adjective + preposition 1"},
                {"id": 131, "title": "Adjective + preposition 2"},
                {"id": 132, "title": "Verb + preposition 1 to and at"},
                {"id": 133, "title": "Verb + preposition 2 about/for/of/after"},
                {"id": 134, "title": "Verb + preposition 3 about and of"},
                {"id": 135, "title": "Verb + preposition 4 of/for/from/on"},
                {"id": 136, "title": "Verb + preposition 5 in/into/with/to/on"},
            ]
        },
        {
            "id": "phrasal-verbs",
            "title": "Phrasal Verbs",
            "icon": "🔃",
            "color": "#E879F9",
            "units": [
                {"id": 137, "title": "Phrasal verbs 1 Introduction"},
                {"id": 138, "title": "Phrasal verbs 2 in/out"},
                {"id": 139, "title": "Phrasal verbs 3 out"},
                {"id": 140, "title": "Phrasal verbs 4 on/off (1)"},
                {"id": 141, "title": "Phrasal verbs 5 on/off (2)"},
                {"id": 142, "title": "Phrasal verbs 6 up (1)"},
                {"id": 143, "title": "Phrasal verbs 7 up (2)"},
                {"id": 144, "title": "Phrasal verbs 8 away/back"},
                {"id": 145, "title": "Phrasal verbs 9 about/round/forward/over"},
            ]
        },
    ]

    # Calculate page numbers: Units start at page 14 (verified visually)
    # Each unit is 2 pages (left = explanation, right = exercises)
    FIRST_UNIT_PAGE = 14  # Page number where Unit 1 starts (1-indexed)

    for section in sections:
        for unit in section["units"]:
            unit_num = unit["id"]
            start_page = FIRST_UNIT_PAGE + (unit_num - 1) * 2
            unit["pages"] = [start_page, start_page + 1]
            unit["page_images"] = [
                f"pages/page_{start_page:03d}.jpg",
                f"pages/page_{start_page + 1:03d}.jpg"
            ]
            # Add search text if available
            search_text = ""
            for p in unit["pages"]:
                if p in texts:
                    search_text += " " + texts[p]
            # Keep only first 200 chars for search index
            unit["search_text"] = search_text.strip()[:300]

    # Last unit page = FIRST_UNIT_PAGE + (145-1)*2 + 1 = 14 + 288 + 1 = 303
    LAST_UNIT_PAGE = FIRST_UNIT_PAGE + (145 - 1) * 2 + 1  # = 303

    # Additional sections (non-unit content)
    extras = [
        {
            "id": "contents",
            "title": "Contents",
            "icon": "📋",
            "pages": list(range(1, FIRST_UNIT_PAGE)),
            "page_images": [f"pages/page_{p:03d}.jpg" for p in range(1, FIRST_UNIT_PAGE)]
        },
        {
            "id": "appendices",
            "title": "Appendices",
            "icon": "📎",
            "pages": list(range(LAST_UNIT_PAGE + 1, LAST_UNIT_PAGE + 15)),
            "page_images": [f"pages/page_{p:03d}.jpg" for p in range(LAST_UNIT_PAGE + 1, LAST_UNIT_PAGE + 15)]
        },
        {
            "id": "additional-exercises",
            "title": "Additional Exercises",
            "icon": "✏️",
            "pages": list(range(LAST_UNIT_PAGE + 15, LAST_UNIT_PAGE + 40)),
            "page_images": [f"pages/page_{p:03d}.jpg" for p in range(LAST_UNIT_PAGE + 15, LAST_UNIT_PAGE + 40)]
        },
        {
            "id": "study-guide",
            "title": "Study Guide",
            "icon": "🗺️",
            "pages": list(range(LAST_UNIT_PAGE + 40, LAST_UNIT_PAGE + 55)),
            "page_images": [f"pages/page_{p:03d}.jpg" for p in range(LAST_UNIT_PAGE + 40, LAST_UNIT_PAGE + 55)]
        },
        {
            "id": "answer-key",
            "title": "Answer Key",
            "icon": "🔑",
            "pages": list(range(LAST_UNIT_PAGE + 55, min(total_pages + 1, LAST_UNIT_PAGE + 100))),
            "page_images": [f"pages/page_{p:03d}.jpg" for p in range(LAST_UNIT_PAGE + 55, min(total_pages + 1, LAST_UNIT_PAGE + 100))]
        },
    ]

    manifest = {
        "title": "Personal Study Reader",
        "subtitle": "Study Reference Guide",
        "author": "Personal",
        "total_pages": total_pages,
        "total_units": 145,
        "sections": sections,
        "extras": extras
    }

    os.makedirs(os.path.dirname(UNITS_JSON_PATH), exist_ok=True)
    with open(UNITS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"✅ Generated {UNITS_JSON_PATH} with {len(sections)} sections and 145 units")
    return manifest


def main():
    print("English Grammar in Use - PDF Extractor")
    print("=" * 50)

    if not os.path.exists(PDF_PATH):
        print(f"PDF not found: {PDF_PATH}")
        sys.exit(1)

    json_only = '--json-only' in sys.argv

    if not json_only:
        print("\nStep 1: Extracting pages as HD images...")
        total_pages = extract_pages()
    else:
        import fitz as fitz_check
        doc = fitz_check.open(PDF_PATH)
        total_pages = len(doc)
        doc.close()
        print(f"\nSkipping image extraction (--json-only). Total pages: {total_pages}")

    print("\nStep 2: Extracting text for search...")
    texts = extract_text_per_page()
    print(f"  Extracted text from {len(texts)} pages")

    print("\nStep 3: Generating units.json...")
    generate_units_json(total_pages, texts)

    print("\nDone! Now open web/index.html in your browser.")


if __name__ == "__main__":
    main()
