document.addEventListener('DOMContentLoaded', () => {
    const libStatus = document.getElementById('libStatus');
    const netStatus = document.getElementById('netStatus');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');

    // 1. CHECK NETWORK TYPE
    function updateNetStatus() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const type = conn ? conn.effectiveType || conn.type : "unknown";
        netStatus.textContent = navigator.onLine ? `Online (${type})` : "OFFLINE";
    }
    updateNetStatus();
    window.addEventListener('online', updateNetStatus);
    window.addEventListener('offline', updateNetStatus);

    // 2. MONITOR LIBRARY STATUS
    const checkLibrary = setInterval(() => {
        if (typeof Tesseract !== 'undefined') {
            libStatus.textContent = "🟢 Ready";
            libStatus.className = "status-ready";
            ocrStatus.textContent = "Scanner ready.";
            clearInterval(checkLibrary);
        }
    }, 1000);

    // 3. UI HANDLERS
    document.getElementById('takePicBtn').onclick = () => photoInput.click();

    scanBtn.onclick = async () => {
        if (typeof Tesseract === 'undefined') {
            alert("Still loading the scanner brain. Please wait for the Green 'Ready' status.");
            return;
        }
        if (!photoInput.files.length) return alert("Take a photo first!");
        
        const file = photoInput.files[0];
        document.getElementById('imagePreview').src = URL.createObjectURL(file);
        document.getElementById('imagePreview').style.display = 'block';
        ocrStatus.textContent = "Initializing...";

        try {
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => {
                    ocrStatus.textContent = m.status;
                    if (m.status === 'recognizing text') {
                        document.getElementById('ocrProgress').style.width = Math.round(m.progress * 100) + '%';
                    }
                }
            });
            document.getElementById('confirmCard').classList.remove('hidden');
            document.getElementById('itemName').value = result.data.text.substring(0, 30).trim();
            ocrStatus.textContent = "Success!";
        } catch (e) {
            ocrStatus.textContent = "Error. Try again.";
        }
    };
});
