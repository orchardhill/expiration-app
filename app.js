const API_URL = 'https://google.com';
const API_SECRET = 'rCF+2qYvyis5ulxT)6n&xao(svfCNmv#(pfxGXY-CUGHX!XV';

document.addEventListener('DOMContentLoaded', () => {
    const takePicBtn = document.getElementById('takePicBtn');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');
    const ocrProgress = document.getElementById('ocrProgress');
    const imagePreview = document.getElementById('imagePreview');
    const form = document.getElementById('itemForm');
    const confirmCard = document.getElementById('confirmCard');

    // 1. Trigger camera
    if (takePicBtn) {
        takePicBtn.onclick = () => photoInput.click();
    }

    // 2. Scan Logic with Safety Check
    if (scanBtn) {
        scanBtn.onclick = async () => {
            // FIX: Check if Tesseract loaded before running
            if (typeof Tesseract === 'undefined') {
                alert("The scanner library is still downloading. Please wait 10 seconds and try again.");
                return;
            }

            if (!photoInput.files.length) {
                alert("Please take a photo first.");
                return;
            }

            const file = photoInput.files[0];
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
            ocrStatus.textContent = "Starting scan...";

            try {
                const result = await Tesseract.recognize(file, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const p = Math.round(m.progress * 100);
                            ocrProgress.style.width = p + '%';
                            ocrStatus.textContent = `Analyzing: ${p}%`;
                        }
                    }
                });
                
                // Show form and fill name
                confirmCard.classList.remove('hidden');
                document.getElementById('itemName').value = result.data.text.split('\n')[0] || "";
                ocrStatus.textContent = "Scan Complete!";
                
            } catch (err) {
                console.error(err);
                ocrStatus.textContent = "Scan failed. Try again.";
            }
        };
    }

    // 3. Save to Google Sheets
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const resEl = document.getElementById('result');
            resEl.textContent = "Saving to Google Sheets...";

            const data = {
                itemName: document.getElementById('itemName').value,
                expirationDate: document.getElementById('expirationDate').value,
                location: document.getElementById('location').value,
                createdBy: 'pwa'
            };

            try {
                const response = await fetch(`${API_URL}?key=${encodeURIComponent(API_SECRET)}`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const json = await response.json();
                if (json.success) {
                    resEl.textContent = "✅ Saved Successfully!";
                    form.reset();
                    confirmCard.classList.add('hidden');
                } else {
                    resEl.textContent = "❌ Error: " + json.error;
                }
            } catch (err) {
                resEl.textContent = "❌ Network Error. Check your internet.";
            }
        };
    }
});
