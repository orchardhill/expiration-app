document.addEventListener('DOMContentLoaded', () => {
    const libStatus = document.getElementById('libStatus');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');
    const itemForm = document.getElementById('itemForm');

    // --- 1. MONITOR LIBRARY ---
    const checkLibrary = setInterval(() => {
        if (typeof Tesseract !== 'undefined') {
            libStatus.textContent = "🟢 Ready";
            libStatus.className = "status-ready";
            clearInterval(checkLibrary);
        }
    }, 1000);

    // --- 2. CAMERA TRIGGER ---
    document.getElementById('takePicBtn').onclick = () => photoInput.click();

    // --- 3. RUN OCR SCAN ---
    scanBtn.onclick = async () => {
        if (typeof Tesseract === 'undefined') return alert("Tesseract library not loaded yet!");
        if (!photoInput.files.length) return alert("Take a photo first!");

        const file = photoInput.files[0];
        document.getElementById('imagePreview').src = URL.createObjectURL(file);
        document.getElementById('imagePreview').style.display = 'block';
        
        ocrStatus.textContent = "⚡ Initializing...";
        document.getElementById('ocrProgress').style.width = '0%';

        try {
            // Tesseract.js v5 Syntax
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        ocrStatus.textContent = "Scanning...";
                        document.getElementById('ocrProgress').style.width = Math.round(m.progress * 100) + '%';
                    } else {
                        ocrStatus.textContent = m.status;
                    }
                }
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            // Clean up text: remove newlines and shorten
            const cleanText = text.replace(/\n/g, ' ').trim().substring(0, 40);
            
            document.getElementById('confirmCard').classList.remove('hidden');
            document.getElementById('itemName').value = cleanText;
            ocrStatus.textContent = "Done!";
        } catch (e) {
            console.error(e);
            ocrStatus.textContent = "Error: " + e.message;
        }
    };

    // --- 4. SAVE TO GOOGLE SHEETS ---
    itemForm.onsubmit = async (e) => {
        e.preventDefault();
        const itemName = document.getElementById('itemName').value;
        const submitBtn = e.target.querySelector('button');
        
        // REPLACE THIS with your actual Google Apps Script Web App URL
        const GOOGLE_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        try {
            if (GOOGLE_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
                alert(`Dev Mode: Item "${itemName}" would be saved now.`);
            } else {
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({ itemName: itemName, date: new Date().toLocaleDateString() })
                });
                alert('Saved successfully!');
            }
            
            // Reset UI
            document.getElementById('confirmCard').classList.add('hidden');
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('ocrProgress').style.width = '0%';
            itemForm.reset();
        } catch (err) {
            alert('Save error: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Save to Sheet";
        }
    };
});
