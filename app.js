document.addEventListener('DOMContentLoaded', () => {
    const libStatus = document.getElementById('libStatus');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');

    // 1. MONITOR LIBRARY
    const checkLibrary = setInterval(() => {
        if (typeof Tesseract !== 'undefined') {
            libStatus.textContent = "🟢 Ready";
            libStatus.className = "status-ready";
            clearInterval(checkLibrary);
        }
    }, 1000);

    // 2. CAMERA
    document.getElementById('takePicBtn').onclick = () => photoInput.click();

    // 3. SCAN
    scanBtn.onclick = async () => {
        if (typeof Tesseract === 'undefined') return alert("Still loading...");
        if (!photoInput.files.length) return alert("Take a photo first!");
        
        const file = photoInput.files[0];
        document.getElementById('imagePreview').src = URL.createObjectURL(file);
        document.getElementById('imagePreview').style.display = 'block';
        ocrStatus.textContent = "⚡ Starting...";

        try {
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    ocrStatus.textContent = m.status;
                    if (m.status === 'recognizing text') {
                        document.getElementById('ocrProgress').style.width = Math.round(m.progress * 100) + '%';
                    }
                }
            });
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            document.getElementById('confirmCard').classList.remove('hidden');
            document.getElementById('itemName').value = text.substring(0, 30).trim();
            ocrStatus.textContent = "Done!";
        } catch (e) {
            ocrStatus.textContent = "Error: " + e.message;
        }
    };
});
