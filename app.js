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

    if (takePicBtn) takePicBtn.onclick = () => photoInput.click();

    if (scanBtn) {
        scanBtn.onclick = async () => {
            // FIX: Use the window object to find Tesseract
            const TESS = window.Tesseract;
            
            if (!TESS) {
                ocrStatus.textContent = "⌛ Library still downloading... check your Wi-Fi.";
                return;
            }

            if (!photoInput.files.length) {
                alert("Please take a picture first!");
                return;
            }

            const file = photoInput.files[0];
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
            ocrStatus.textContent = "⚡ Initializing Scanner...";

            try {
                // Using a more compatible mobile method
                const result = await TESS.recognize(file, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const p = Math.round(m.progress * 100);
                            ocrProgress.style.width = p + '%';
                            ocrStatus.textContent = `Analyzing: ${p}%`;
                        } else {
                            ocrStatus.textContent = m.status + "...";
                        }
                    }
                });
                
                // Show form
                confirmCard.classList.remove('hidden');
                document.getElementById('itemName').value = result.data.text.split('\n')[0] || "";
                ocrStatus.textContent = "✅ Success!";
            } catch (err) {
                ocrStatus.textContent = "❌ Error: " + err.message;
            }
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const res = document.getElementById('result');
            res.textContent = "Saving...";
            const data = {
                itemName: document.getElementById('itemName').value,
                expirationDate: document.getElementById('expirationDate').value,
                location: document.getElementById('location').value
            };
            try {
                await fetch(`${API_URL}?key=${encodeURIComponent(API_SECRET)}`, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(data)
                });
                res.textContent = "✅ Saved!";
                form.reset();
            } catch (e) { res.textContent = "❌ Error."; }
        };
    }
});
