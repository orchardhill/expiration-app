// ===============================
// CONFIG
// ===============================
const API_URL = 'https://google.com';
const API_SECRET = 'rCF+2qYvyis5ulxT)6n&xao(svfCNmv#(pfxGXY-CUGHX!XV';

// Ensure the script waits for the HTML to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // ===============================
    // ELEMENT REFERENCES
    // ===============================
    const takePicBtn = document.getElementById('takePicBtn');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const imagePreview = document.getElementById('imagePreview');
    const ocrProgress = document.getElementById('ocrProgress');
    const ocrStatus = document.getElementById('ocrStatus');
    const confirmCard = document.getElementById('confirmCard');
    const rawTextCard = document.getElementById('rawTextCard');
    const rawTextArea = document.getElementById('rawText');
    const form = document.getElementById('itemForm');
    const resultEl = document.getElementById('result');

    // ===============================
    // CAMERA HANDLER
    // ===============================
    if (takePicBtn) {
        takePicBtn.addEventListener('click', () => {
            photoInput.click(); // Trigger the hidden file input
        });
    }

    // ===============================
    // OCR SCAN HANDLER
    // ===============================
    if (scanBtn) {
        scanBtn.addEventListener('click', async () => {
            if (!photoInput.files.length) {
                ocrStatus.textContent = 'Please take a photo first.';
                return;
            }

            // Select the FIRST file from the input
            const file = photoInput.files[0];
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
            
            ocrProgress.style.width = '0%';
            ocrStatus.textContent = 'OCR: Initializing...';

            Tesseract.recognize(file, 'eng', {
                logger: m => {
                    ocrStatus.textContent = `OCR: ${m.status}...`;
                    if (m.status === 'recognizing text') {
                        const percent = Math.round(m.progress * 100);
                        ocrProgress.style.width = percent + '%';
                        ocrStatus.textContent = `OCR: Analyzing… ${percent}%`;
                    }
                }
            })
            .then(result => handleOCRResult(result.data.text))
            .catch(err => {
                console.error("OCR Error:", err);
                ocrStatus.textContent = 'OCR failed. Please try again.';
            });
        });
    }

    // ===============================
    // OCR RESULT PARSING
    // ===============================
    function handleOCRResult(text) {
        const upper = text.toUpperCase();
        rawTextArea.value = text;
        const lines = upper.split('\n').map(l => l.trim()).filter(Boolean);

        // Name Heuristic
        if (lines.length && !form.itemName.value) {
            form.itemName.value = lines[0];
        }

        // Date Detection
        const dateMatch = upper.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (dateMatch) {
            const d = new Date(dateMatch[1]);
            if (!isNaN(d)) {
                form.expirationDate.value = d.toISOString().slice(0, 10);
            }
        }

        // Qty/Unit Detection
        const qtyMatch = upper.match(/([\d\.]+)\s*(LB|LBS|OZ|CT|COUNT|G|KG)/);
        if (qtyMatch) {
            form.quantity.value = qtyMatch[1];
            form.unit.value = qtyMatch[2].toLowerCase();
        }

        confirmCard.classList.remove('hidden');
        rawTextCard.classList.remove('hidden');
        ocrStatus.textContent = 'OCR complete. Review and confirm.';
    }

    // ===============================
    // FORM SUBMIT
    // ===============================
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = {
            itemName: form.itemName.value,
            quantity: form.quantity.value,
            unit: form.unit.value,
            expirationDate: form.expirationDate.value,
            location: form.location.value,
            assignedTo: form.assignedTo.value,
            createdBy: 'pwa'
        };

        resultEl.textContent = 'Saving…';

        try {
            const response = await fetch(
                API_URL + '?key=' + encodeURIComponent(API_SECRET),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }
            );
            const json = await response.json();
            if (json.success) {
                resultEl.textContent = 'Saved successfully.';
                resetUI();
            } else {
                resultEl.textContent = json.error || 'Error saving item.';
            }
        } catch (err) {
            resultEl.textContent = 'Network error.';
        }
    });

    function resetUI() {
        form.reset();
        photoInput.value = '';
        imagePreview.style.display = 'none';
        ocrProgress.style.width = '0%';
        ocrStatus.textContent = '';
        confirmCard.classList.add('hidden');
        rawTextCard.classList.add('hidden');
    }
});
