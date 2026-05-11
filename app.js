// ===============================
// CONFIG
// ===============================
const API_URL = 'https://google.com';
const API_SECRET = 'rCF+2qYvyis5ulxT)6n&xao(svfCNmv#(pfxGXY-CUGHX!XV';

// ===============================
// ELEMENT REFERENCES
// ===============================
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
// OCR SCAN HANDLER
// ===============================
scanBtn.addEventListener('click', async () => {
    if (!photoInput.files.length) {
        ocrStatus.textContent = 'Please take a photo first.';
        return;
    }

    // FIX: Select the specific file from the input list
    const file = photoInput.files[0];
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.style.display = 'block';
    
    ocrProgress.style.width = '0%';
    ocrStatus.textContent = 'OCR: Initializing...';

    // FIX: Pass the single file object to Tesseract
    Tesseract.recognize(file, 'eng', {
        logger: m => {
            // Show every status (loading, initializing, etc.) so it doesn't look frozen
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

// ===============================
// OCR RESULT PARSING + UI UPDATE
// ===============================
function handleOCRResult(text) {
    const upper = text.toUpperCase();
    rawTextArea.value = text;
    const lines = upper.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length && !form.itemName.value) {
        form.itemName.value = lines[0];
    }

    const dateMatch = upper.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
        const d = new Date(dateMatch[1]);
        if (!isNaN(d)) {
            form.expirationDate.value = d.toISOString().slice(0, 10);
        }
    }

    const qtyMatch = upper.match(/([\d\.]+)\s*(LB|LBS|OZ|CT|COUNT|G|KG)/);
    if (qtyMatch) {
        form.quantity.value = qtyMatch[1];
        form.unit.value = qtyMatch[2].toLowerCase();
    }

    confirmCard.classList.remove('hidden');
    rawTextCard.classList.remove('hidden');
    ocrStatus.textContent = 'OCR complete. Please review and confirm.';
}

// ===============================
// FORM SUBMIT (SAVE ITEM)
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
        console.error("Fetch Error:", err);
        resultEl.textContent = 'Network error.';
    }
});

// ===============================
// RESET UI AFTER SAVE
// ===============================
function resetUI() {
    form.reset();
    photoInput.value = '';
    imagePreview.style.display = 'none';
    ocrProgress.style.width = '0%';
    ocrStatus.textContent = '';
    confirmCard.classList.add('hidden');
    rawTextCard.classList.add('hidden');
}
