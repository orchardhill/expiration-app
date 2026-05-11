document.addEventListener('DOMContentLoaded', () => {
    const APP_VERSION = "1.1.2";
    
    const libStatus = document.getElementById('libStatus');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');
    const itemForm = document.getElementById('itemForm');
    const ocrProgress = document.getElementById('ocrProgress');

    const GOOGLE_SCRIPT_URL = 'https://google.com';

    document.getElementById('appVersion').textContent = APP_VERSION;

    // --- 1. MONITOR LIBRARY ---
    const checkLibrary = setInterval(() => {
        if (typeof Tesseract !== 'undefined') {
            libStatus.textContent = "🟢 Ready";
            libStatus.className = "status-ready";
            clearInterval(checkLibrary);
        }
    }, 500);

    // --- 2. CAMERA TRIGGER ---
    document.getElementById('takePicBtn').onclick = () => photoInput.click();

    // --- 3. RUN OCR SCAN ---
    scanBtn.onclick = async () => {
        if (typeof Tesseract === 'undefined') return alert(`[v${APP_VERSION}] Scanner not loaded!`);
        if (!photoInput.files.length) return alert("Take a photo first!");

        const file = photoInput.files[0];
        document.getElementById('imagePreview').src = URL.createObjectURL(file);
        document.getElementById('imagePreview').style.display = 'block';
        
        ocrStatus.textContent = "⚡ Starting...";
        ocrProgress.style.width = '0%';

        try {
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        ocrStatus.textContent = "Scanning...";
                        ocrProgress.style.width = Math.round(m.progress * 100) + '%';
                    }
                }
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const cleanText = text.replace(/[\r\n]+/gm, " ").trim().substring(0, 40);
            
            document.getElementById('confirmCard').classList.remove('hidden');
            document.getElementById('itemName').value = cleanText;
            ocrStatus.textContent = "Done!";
        } catch (e) {
            ocrStatus.textContent = "Error: " + e.message;
            console.error(e);
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
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ 
                    itemName: itemName, 
                    version: APP_VERSION,
                    timestamp: new Date().toLocaleString() 
                })
            });

            alert(`✅ Saved (Build ${APP_VERSION})`);
            document.getElementById('confirmCard').classList.add('hidden');
            document.getElementById('imagePreview').style.display = 'none';
            itemForm.reset();
            ocrStatus.textContent = "Ready...";
        } catch (err) {
            alert(`[v${APP_VERSION}] Save Error: ${err.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Save to Sheet";
        }
    };
});
