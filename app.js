const API_URL = 'https://google.com';
const API_SECRET = 'rCF+2qYvyis5ulxT)6n&xao(svfCNmv#(pfxGXY-CUGHX!XV';

document.addEventListener('DOMContentLoaded', () => {
    const libStatus = document.getElementById('libStatus');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');
    const ocrProgress = document.getElementById('ocrProgress');
    const imagePreview = document.getElementById('imagePreview');
    const confirmCard = document.getElementById('confirmCard');
    const form = document.getElementById('itemForm');
    const resultEl = document.getElementById('result');

    // 1. MONITOR CONNECTION STATUS (THE HEARTBEAT)
    const checkLibrary = setInterval(() => {
        if (typeof Tesseract !== 'undefined') {
            libStatus.textContent = "🟢 Ready to Scan";
            libStatus.className = "status-ready";
            ocrStatus.textContent = "Scanner ready.";
            clearInterval(checkLibrary); 
        }
    }, 1000);

    // 2. CAMERA TRIGGER
    document.getElementById('takePicBtn').onclick = () => {
        photoInput.click();
    };

    // 3. SCAN LOGIC
    scanBtn.onclick = async () => {
        // Safety check for the "Brain"
        if (typeof Tesseract === 'undefined') {
            alert("The scanner 'brain' hasn't arrived yet. Please wait for the green light at the bottom.");
            return;
        }

        if (!photoInput.files.length) {
            alert("Please take a photo first!");
            return;
        }
        
        const file = photoInput.files[0];
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = 'block';
        ocrStatus.textContent = "Processing image...";
        ocrProgress.style.width = '0%';

        try {
            // Recognize call using Tesseract v2.x method
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => {
                    ocrStatus.textContent = m.status;
                    if (m.status === 'recognizing text') {
                        ocrProgress.style.width = Math.round(m.progress * 100) + '%';
                    }
                }
            });
            
            // Populate form and unhide
            confirmCard.classList.remove('hidden');
            const itemNameInput = document.getElementById('itemName');
            
            // Clean up text for the name field
            const cleanName = result.data.text.split('\n')[0] || "Scanned Item";
            itemNameInput.value = cleanName.trim();
            
            ocrStatus.textContent = "Success!";
            confirmCard.scrollIntoView({ behavior: 'smooth' });

        } catch (err) {
            console.error(err);
            ocrStatus.textContent = "Scan Error. Please try again.";
        }
    };

    // 4. SAVE TO GOOGLE SHEETS
    form.onsubmit = async (e) => {
        e.preventDefault();
        resultEl.textContent = "⌛ Saving to Sheet...";
        resultEl.style.color = "blue";

        const payload = {
            itemName: document.getElementById('itemName').value,
            expirationDate: document.getElementById('expirationDate').value,
            location: 'Pantry', // Default since selector was removed for speed
            createdBy: 'pwa-v1.0.6'
        };

        try {
            // Google Apps Script requires 'no-cors' for simple POSTs
            await fetch(`${API_URL}?key=${encodeURIComponent(API_SECRET)}`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });

            resultEl.textContent = "✅ Saved Successfully!";
            resultEl.style.color = "green";
            
            setTimeout(() => {
                form.reset();
                confirmCard.classList.add('hidden');
                imagePreview.style.display = 'none';
                ocrStatus.textContent = "Ready to scan...";
                resultEl.textContent = "";
                ocrProgress.style.width = '0%';
            }, 2500);

        } catch (err) {
            resultEl.textContent = "❌ Network Error.";
            resultEl.style.color = "red";
        }
    };
});
