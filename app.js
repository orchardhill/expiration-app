document.addEventListener('DOMContentLoaded', () => {
    const libStatus = document.getElementById('libStatus');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');
    const itemForm = document.getElementById('itemForm');
    const ocrProgress = document.getElementById('ocrProgress');

    // Your Specific Google Script URL
    const GOOGLE_SCRIPT_URL = 'https://google.com';

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
        if (typeof Tesseract === 'undefined') return alert("OCR Library still loading...");
        if (!photoInput.files.length) return alert("Please take a photo first!");

        const file = photoInput.files[0];
        document.getElementById('imagePreview').src = URL.createObjectURL(file);
        document.getElementById('imagePreview').style.display = 'block';
        
        ocrStatus.textContent = "⚡ Initializing Engine...";
        ocrProgress.style.width = '0%';

        try {
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        ocrStatus.textContent = "Scanning Text...";
                        ocrProgress.style.width = Math.round(m.progress * 100) + '%';
                    } else {
                        ocrStatus.textContent = m.status;
                    }
                }
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            // Cleanup text: Remove extra lines/spaces
            const cleanText = text.replace(/[\r\n]+/gm, " ").trim().substring(0, 50);
            
            document.getElementById('confirmCard').classList.remove('hidden');
            document.getElementById('itemName').value = cleanText;
            ocrStatus.textContent = "Scan Complete!";
        } catch (e) {
            console.error(e);
            ocrStatus.textContent = "OCR Error: " + e.message;
        }
    };

    // --- 4. SAVE TO GOOGLE SHEETS ---
    itemForm.onsubmit = async (e) => {
        e.preventDefault();
        const itemName = document.getElementById('itemName').value;
        const submitBtn = e.target.querySelector('button');
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        try {
            // Using 'no-cors' mode for Google Apps Script
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    itemName: itemName, 
                    timestamp: new Date().toLocaleString() 
                })
            });

            alert('✅ Saved to Google Sheets!');
            
            // Reset UI
            document.getElementById('confirmCard').classList.add('hidden');
            document.getElementById('imagePreview').style.display = 'none';
            ocrProgress.style.width = '0%';
            itemForm.reset();
            ocrStatus.textContent = "Ready...";
        } catch (err) {
            console.error(err);
            alert('Save failed: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Save to Sheet";
        }
    };
});
