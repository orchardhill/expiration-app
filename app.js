// ===============================
// CONFIG
// ===============================
const APP_VERSION = '1.0.1'; // Update this manually with each GitHub push!
const API_URL = 'https://google.com';
const API_SECRET = 'rCF+2qYvyis5ulxT)6n&xao(svfCNmv#(pfxGXY-CUGHX!XV';

document.addEventListener('DOMContentLoaded', () => {
    // Set version label
    document.getElementById('versionLabel').textContent = APP_VERSION;

    // Elements
    const takePicBtn = document.getElementById('takePicBtn');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');
    const ocrProgress = document.getElementById('ocrProgress');
    const imagePreview = document.getElementById('imagePreview');
    const confirmCard = document.getElementById('confirmCard');
    const form = document.getElementById('itemForm');
    const resultEl = document.getElementById('result');

    // Camera Trigger
    if (takePicBtn) takePicBtn.onclick = () => photoInput.click();

    // OCR Trigger
    if (scanBtn) {
        scanBtn.onclick = async () => {
            const TESS = window.Tesseract;
            
            if (!TESS) {
                ocrStatus.textContent = "⌛ Still connecting to scanner brain... Wait 10s.";
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
                const result = await TESS.recognize(file, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const p = Math.round(m.progress * 100);
                            ocrProgress.style.width = p + '%';
                            ocrStatus.textContent = `Analyzing: ${p}%`;
                        } else {
                            ocrStatus.textContent = "Status: " + m.status;
                        }
                    }
                });
                
                // Show form and populate Name
                confirmCard.classList.remove('hidden');
                document.getElementById('itemName').value = result.data.text.split('\n')[0] || "";
                ocrStatus.textContent = "✅ Scan Complete!";
                confirmCard.scrollIntoView({ behavior: 'smooth' });

            } catch (err) {
                ocrStatus.textContent = "❌ OCR Error: " + err.message;
            }
        };
    }

    // Save Logic
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            resultEl.textContent = "⌛ Saving to Sheet...";
            
            const payload = {
                itemName: document.getElementById('itemName').value,
                expirationDate: document.getElementById('expirationDate').value,
                location: document.getElementById('location').value
            };

            try {
                await fetch(`${API_URL}?key=${encodeURIComponent(API_SECRET)}`, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(payload)
                });
                resultEl.textContent = "✅ Saved Successfully!";
                setTimeout(() => {
                    form.reset();
                    confirmCard.classList.add('hidden');
                    resultEl.textContent = "";
                }, 2500);
            } catch (err) {
                resultEl.textContent = "❌ Network Error.";
            }
        };
    }
});
