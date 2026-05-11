const APP_VERSION = '1.0.4';
const API_URL = 'https://google.com';
const API_SECRET = 'rCF+2qYvyis5ulxT)6n&xao(svfCNmv#(pfxGXY-CUGHX!XV';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('versionLabel').textContent = APP_VERSION;

    const takePicBtn = document.getElementById('takePicBtn');
    const scanBtn = document.getElementById('scanBtn');
    const photoInput = document.getElementById('photoInput');
    const ocrStatus = document.getElementById('ocrStatus');
    const ocrProgress = document.getElementById('ocrProgress');
    const imagePreview = document.getElementById('imagePreview');

    if (takePicBtn) takePicBtn.onclick = () => photoInput.click();

    if (scanBtn) {
        scanBtn.onclick = async () => {
            // SAFETY CATCH: Check if library loaded
            if (typeof Tesseract === 'undefined') {
                ocrStatus.textContent = "Library still downloading... Wait 10s.";
                return;
            }

            if (!photoInput.files.length) return alert("Take a photo first!");
            
            const file = photoInput.files[0];
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
            ocrStatus.textContent = "Connecting...";

            try {
                // Simplified Recognize call
                const { data: { text } } = await Tesseract.recognize(file, 'eng', {
                    logger: m => {
                        ocrStatus.textContent = m.status;
                        if (m.status === 'recognizing text') {
                            const p = Math.round(m.progress * 100);
                            ocrProgress.style.width = p + '%';
                            ocrStatus.textContent = `Analyzing: ${p}%`;
                        }
                    }
                });
                
                document.getElementById('confirmCard').classList.remove('hidden');
                document.getElementById('itemName').value = text.substring(0, 30).trim();
                ocrStatus.textContent = "Done!";
            } catch (err) {
                ocrStatus.textContent = "Error: " + err.message;
            }
        };
    }
});
