import subprocess
import sys

try:
    import pypdf
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    import pypdf

reader = pypdf.PdfReader(r"c:\Users\ander\OneDrive\Documentos\Anderson\MEUS SISTEMAS COM ANTIGRAVITY\DIETA CAROLINA\Plano Retomada v2 Carolina Duque Mai2026.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

with open(r"c:\Users\ander\OneDrive\Documentos\Anderson\MEUS SISTEMAS COM ANTIGRAVITY\DIETA CAROLINA\diet_text.txt", "w", encoding="utf-8") as f:
    f.write(text)
print("done")
