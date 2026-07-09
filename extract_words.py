"""
Word Coordinate Extractor for English Grammar in Use
Extracts word text and bounding boxes (relative percentages) for each page from the vector PDF.
Saves them into pages/words/page_xxx.json.
"""

import sys
import io
import os
import json
import fitz  # PyMuPDF

# Fix console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PDF_PATH = r"D:\ingles\todo\B2 Upperintermediate\ENGLISH-GRAMMAR-IN-USE.pdf"
OUTPUT_DIR = os.path.join("pages", "words")

def extract_words():
    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF file not found at '{PDF_PATH}'")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    doc = fitz.open(PDF_PATH)
    total_pages = len(doc)
    print(f"Opened PDF with {total_pages} pages.")

    # Units start at page 14 (1-indexed) and go to page 303 (Unit 1 to 145)
    start_page = 14
    end_page = 303

    print(f"Extracting word coordinates for pages {start_page} to {end_page}...")

    for page_num in range(start_page, end_page + 1):
        # fitz is 0-indexed, so PDF page 14 is index 13
        page_idx = page_num - 1
        page = doc[page_idx]
        
        # Get page dimension
        rect = page.rect
        w = rect.width
        h = rect.height
        
        # Get list of words: (x0, y0, x1, y1, "word", block_no, line_no, word_no)
        raw_words = page.get_text("words")
        
        page_words = []
        for word_info in raw_words:
            x0, y0, x1, y1, word_text, _, _, _ = word_info
            
            # Normalize to percentage of page width/height (0.0 to 1.0)
            # Rounding to 4 decimal places saves ~50% file size
            x0_norm = round(x0 / w, 4)
            y0_norm = round(y0 / h, 4)
            x1_norm = round(x1 / w, 4)
            y1_norm = round(y1 / h, 4)
            
            # Filter out empty strings or extremely long noise words
            word_clean = word_text.strip()
            if not word_clean or len(word_clean) > 40:
                continue
                
            page_words.append([
                word_clean,
                x0_norm,
                y0_norm,
                x1_norm,
                y1_norm
            ])
            
        # Write to JSON
        output_file = os.path.join(OUTPUT_DIR, f"page_{page_num:03d}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(page_words, f, ensure_ascii=False, separators=(',', ':'))
            
        # Progress bar
        progress = int((page_num - start_page + 1) / (end_page - start_page + 1) * 100)
        bar = "=" * (progress // 2) + "-" * (50 - progress // 2)
        print(f"\r  [{bar}] {progress}% ({page_num}/{end_page})", end="", flush=True)

    doc.close()
    print(f"\nSuccessfully extracted words and saved to '{OUTPUT_DIR}/'.")

if __name__ == "__main__":
    extract_words()
