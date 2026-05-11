const APP_VERSION = '1.0.3';
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
            if (!photoInput.files.length) return alert("Take a photo first!");
            
            const file = photoInput.files[0];
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
            ocrStatus.textContent = "Starting Engine...";

            try {
                // Initialize Worker
                const worker = await Tesseract.createWorker('eng', 1, {
                    logger: m => {
                        ocrStatus.textContent = m.status;
                        if (m.progress !== undefined) {
                            const p = Math.round(m.progress * 100);
                            ocrProgress.style.width = p + '%';
                        }
                    }
                });

                const { data: { text } } = await worker.recognize(file);
                await worker.terminate();
                
                document.getElementById('confirmCard').classList.remove('hidden');
                document.getElementById('itemName').value = text.substring(0, 30).trim();
                ocrStatus.textContent = "Done!";
                
            } catch (err) {
                ocrStatus.textContent = "Error: " + err.message;
                console.error(err);
            }
        };
    }
});
