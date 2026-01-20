try:
    from docx import Document
except ImportError:
    print("You need to install python-docx first.")
    print("Run: pip install python-docx")
    exit()

def create_essay(filename, title, content):
    doc = Document()
    doc.add_heading(title, 0)
    for paragraph in content.split('\n\n'):
        if paragraph.strip():
            doc.add_paragraph(paragraph.strip())
    doc.save(filename)
    print(f" Created: {filename}")

# --- Essay 1: The BAD Essay (Superficial) ---
bad_essay_content = """
Biology is the study of life. It looks at cells, plants, and animals. It is very important because we need medicine to survive. My favorite part of biology is learning about how the heart pumps blood.

On the other hand, Computer Science is about coding. We use Python and Java to make websites. Computers are very fast and can do math better than humans. I like playing video games which are made by computer scientists.

In conclusion, both biology and computer science are useful subjects. They are both hard to learn but very interesting. I think everyone should study them because computers help hospitals, so that is how they are related.
"""

# --- Essay 2: The GOOD Essay (Interdisciplinary) ---
good_essay_content = """
The architecture of modern artificial neural networks (ANNs) is not merely a computational invention but a direct abstraction of biological neuroplasticity. Specifically, the Hebbian theory of "cells that fire together, wire together" serves as the foundational logic for backpropagation algorithms used in machine learning.

However, a critical divergence exists. While biological brains operate on asynchronous, spike-based processing (neuromorphic computing), standard ANNs rely on synchronous, layer-based matrix multiplication. This essay argues that to achieve true "General Intelligence," computer science must move beyond current architectures and adopt the chaotic, fault-tolerant signaling methods observed in mammalian cortices.

By analyzing the efficiency of the human visual cortex against a Convolutional Neural Network (CNN), we see that biology prioritizes energy efficiency over raw throughput. This cross-disciplinary insight suggests that future hardware should mimic the chemical diffusion delays of synapses, rather than just the electrical connectivity.
"""

create_essay('essay_bad.docx', 'Computers and Living Things', bad_essay_content)
create_essay('essay_good.docx', 'Synapses and Silicon', good_essay_content)