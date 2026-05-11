// ===============================
// CONFIG
// ===============================
const API_URL = 'https://google.com';
const API_SECRET = 'rCF+2qYvyis5ulxT)6n&xao(svfCNmv#(pfxGXY-CUGHX!XV';

document.addEventListener('DOMContentLoaded', () => {
    const takePicBtn = document.getElementById('takePicBtn');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');
    const ocrProgress = document.getElementById('ocrProgress');
    const imagePreview = document.getElementById('imagePreview');
    const confirmCard = document.getElementById('confirmCard');
    const form = document.getElementById('itemForm');
    const resultEl = document.getElementById('result');

    // 1. OPEN CAMERA
    if (takePicBtn) {
        takePicBtn.onclick = () => photoInput.click();
    }

    // 2. SCAN BUTTON LOGIC
    if (scanBtn) {
        scanBtn.onclick = async () => {
            // Check if library exists
            if (typeof Tesseract === 'undefined') {
                ocrStatus.textContent = "⌛ Connecting to scanner... please wait 10s.";
                return;
            }

            if (!photoInput.files.length) {
                alert("Please take a picture first!");
                return;
            }

            const file = photoInput.files[0];
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
            ocrStatus.textContent = "⚡ Starting Engine...";

            try {
                // One-step recognition
                const { data: { text } } = await Tesseract.recognize(file, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const p = Math.round(m.progress * 100);
                            ocrProgress.style.width = p + '%';
                            ocrStatus.textContent = `Analyzing: ${p}%`;
                        } else {
                            ocrStatus.textContent = m.status; // Shows loading progress
                        }
                    }
                });
                
                handleResults(text);
            } catch (err) {
                console.error(err);
                ocrStatus.textContent = "❌ Scan Failed. Try again.";
            }
        };
    }

    // 3. FILL THE FORM
    function handleResults(text) {
        const lines = text.split('\n').filter(l => l.trim().length > 2);
        if (lines.length > 0) {
            document.getElementById('itemName').value = lines[0].trim();
        }
        
        ocrStatus.textContent = "✅ Scan Complete!";
        confirmCard.classList.remove('hidden');
        confirmCard.scrollIntoView({ behavior: 'smooth' });
    }

    // 4. SAVE TO GOOGLE SHEETS
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            resultEl.textContent = "⌛ Saving...";
            
            const payload = {
                itemName: document.getElementById('itemName').value,
                expirationDate: document.getElementById('expirationDate').value,
                location: document.getElementById('location').value
            };

            try {
                // We use mode: 'no-cors' for Google Apps Script stability
                await fetch(`${API_URL}?key=${encodeURIComponent(API_SECRET)}`, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(payload)
                });

                resultEl.textContent = "✅ Saved to Sheet!";
                setTimeout(() => {
                    form.reset();
                    confirmCard.classList.add('hidden');
                    imagePreview.style.display = 'none';
                    ocrStatus.textContent = "Ready...";
                    resultEl.textContent = "";
                }, 2500);

            } catch (err) {
                resultEl.textContent = "❌ Network Error.";
            }
        };
    }
});
