document.addEventListener('DOMContentLoaded', () => {
    const libStatus = document.getElementById('libStatus');
    const log = document.getElementById('log');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');

    // 1. HEARTBEAT CHECK
    const checkLibrary = setInterval(() => {
        if (window.Tesseract) {
            libStatus.textContent = "🟢 Ready";
            libStatus.className = "status-ready";
            log.textContent = "Log: Tesseract loaded successfully.";
            clearInterval(checkLibrary);
        } else {
            log.textContent = "Log: Still waiting for library...";
        }
    }, 1000);

    // 2. CAMERA TRIGGER
    document.getElementById('takePicBtn').onclick = () => photoInput.click();

    // 3. SCAN LOGIC
    scanBtn.onclick = async () => {
        if (!window.Tesseract) {
            alert("Scanner not ready yet.");
            return;
        }
        if (!photoInput.files.length) return alert("Take a photo first!");
        
        const file = photoInput.files[0];
        document.getElementById('imagePreview').src = URL.createObjectURL(file);
        document.getElementById('imagePreview').style.display = 'block';
        ocrStatus.textContent = "Connecting to Engine...";

        try {
            const { data: { text } } = await Tesseract.recognize(file, 'eng', {
                logger: m => {
                    ocrStatus.textContent = m.status;
                    if (m.status === 'recognizing text') {
                        document.getElementById('ocrProgress').style.width = Math.round(m.progress * 100) + '%';
                    }
                }
            });
            
            document.getElementById('confirmCard').classList.remove('hidden');
            document.getElementById('itemName').value = text.substring(0, 30).trim();
            ocrStatus.textContent = "Scan Complete!";
        } catch (e) {
            ocrStatus.textContent = "Error: " + e.message;
            log.textContent = "Log Error: " + e.message;
        }
    };
});
