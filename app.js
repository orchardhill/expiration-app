// ===============================
// CONFIG
// ===============================
const API_URL = 'https://google.com';
const API_SECRET = 'rCF+2qYvyis5ulxT)6n&xao(svfCNmv#(pfxGXY-CUGHX!XV';

document.addEventListener('DOMContentLoaded', () => {
    // ELEMENT REFERENCES
    const takePicBtn = document.getElementById('takePicBtn');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');
    const ocrProgress = document.getElementById('ocrProgress');
    const imagePreview = document.getElementById('imagePreview');
    const confirmCard = document.getElementById('confirmCard');
    const form = document.getElementById('itemForm');
    const resultEl = document.getElementById('result');

    // 1. CAMERA HANDLER
    if (takePicBtn) {
        takePicBtn.onclick = () => photoInput.click();
    }

    // 2. OCR SCAN HANDLER
    if (scanBtn) {
        scanBtn.onclick = async () => {
            // Safety Check: Is Tesseract loaded?
            if (typeof Tesseract === 'undefined') {
                ocrStatus.textContent = "Library still loading... Please wait 5s.";
                setTimeout(() => { location.reload(); }, 3000); 
                return;
            }

            if (!photoInput.files.length) {
                alert("Please take a picture first!");
                return;
            }

            const file = photoInput.files[0];
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
            ocrStatus.textContent = "OCR: Initializing Engine...";
            ocrProgress.style.width = '0%';

            try {
                // Use the modern Worker approach for better mobile stability
                const worker = await Tesseract.createWorker('eng', 1, {
                    logger: m => {
                        ocrStatus.textContent = `Status: ${m.status}`;
                        if (m.status === 'recognizing text') {
                            const p = Math.round(m.progress * 100);
                            ocrProgress.style.width = p + '%';
                            ocrStatus.textContent = `Analyzing: ${p}%`;
                        }
                    }
                });

                const { data: { text } } = await worker.recognize(file);
                await worker.terminate();
                
                handleOCRResult(text);
            } catch (err) {
                console.error(err);
                ocrStatus.textContent = "Error: " + err.message;
            }
        };
    }

    // 3. RESULT PARSING
    function handleOCRResult(text) {
        const upper = text.toUpperCase();
        const lines = upper.split('\n').map(l => l.trim()).filter(l => l.length > 2);

        // Autofill Item Name (First significant line)
        if (lines.length > 0) {
            document.getElementById('itemName').value = lines[0];
        }

        // Autofill Date (Looks for MM/DD/YYYY or YYYY-MM-DD)
        const dateMatch = upper.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (dateMatch) {
            const d = new Date(dateMatch[1]);
            if (!isNaN(d)) {
                document.getElementById('expirationDate').value = d.toISOString().slice(0, 10);
            }
        }

        ocrStatus.textContent = "OCR Complete! Review below.";
        confirmCard.classList.remove('hidden');
        // Scroll to the form
        confirmCard.scrollIntoView({ behavior: 'smooth' });
    }

    // 4. SAVE TO GOOGLE SHEETS
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            resultEl.textContent = "⌛ Saving to Google Sheets...";
            resultEl.style.color = "blue";

            const payload = {
                itemName: document.getElementById('itemName').value,
                expirationDate: document.getElementById('expirationDate').value,
                location: document.getElementById('location').value,
                createdBy: 'pwa-app'
            };

            try {
                const response = await fetch(`${API_URL}?key=${encodeURIComponent(API_SECRET)}`, {
                    method: 'POST',
                    mode: 'no-cors', // Essential for Google Apps Script Web Apps
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                // With no-cors, we won't see the JSON response, but we assume success if no catch
                resultEl.textContent = "✅ Saved Successfully!";
                resultEl.style.color = "green";
                
                // Reset UI after 2 seconds
                setTimeout(() => {
                    form.reset();
                    confirmCard.classList.add('hidden');
                    imagePreview.style.display = 'none';
                    ocrStatus.textContent = "Ready...";
                    resultEl.textContent = "";
                }, 2000);

            } catch (err) {
                console.error(err);
                resultEl.textContent = "❌ Network Error.";
                resultEl.style.color = "red";
            }
        };
    }
});
