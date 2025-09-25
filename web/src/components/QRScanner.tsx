"use client";
import { useEffect, useRef, useState } from "react";
/**
* QRScanner – uses the native BarcodeDetector when available, and gracefully
falls back.
* On success, calls onResult(text). Parent decides how to parse (uid/token/
etc.).
*/
export default function QRScanner({ onClose, onResult }: {
    onClose: () => void;
    onResult: (text: string) => void
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | undefined>();
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let stream: MediaStream | null = null;
        let raf: number | null = null;
        let detector: any = (globalThis as any).BarcodeDetector ? new (globalThis as any).BarcodeDetector({ formats: ['qr_code'] }) : null;
    async function start() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment'
                }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setReady(true);
            }
            if (!detector) {
                setError('BarcodeDetector not supported; please enter manually or install ZXing fallback.');
                return;
            }
            const tick = async () => {
                if (!videoRef.current) return;
                try {
                    const bit = await detector.detect(videoRef.current);
                    if (bit && bit[0]?.rawValue) {
                        onResult(bit[0].rawValue as string);
                        cleanup();
                        return;
                    }
                } catch { }
                raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        } catch (e: any) {
            setError(e?.message || 'Camera error');
        }
    }
    function cleanup() {
        if (raf) cancelAnimationFrame(raf);
        if (stream) stream.getTracks().forEach(t => t.stop());
    }
    start();
    return () => cleanup();
}, [onResult]);
return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Scan QR</h2>
                <button onClick={onClose} className="text-sm underline">Close</button>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="aspect-video bg-black rounded overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" muted
                    playsInline />
            </div>
            {!ready && <div className="text-sm text-neutral-600">Initializing
                camera…</div>}
            <p className="text-xs text-neutral-600">Tip: Have members open their QR
                from their dashboard, or scan printed badges.</p>
        </div>
    </div>
);
}