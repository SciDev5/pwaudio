"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import QrScanner from "qr-scanner"


// type BarcodeFormat = "qr_code" | "data_matrix"
// interface DetectedBarcode {
//     boundingBox: DOMRectReadOnly,
//     cornerPoints: { x: number, y: number },
//     rawValue: string,
//     format: BarcodeFormat
// }
// declare class BarcodeDetector {
//     constructor(formats: BarcodeFormat[])
//     detect(image:
//         | HTMLImageElement
//         | SVGImageElement
//         | HTMLVideoElement
//         | HTMLCanvasElement
//         | ImageBitmap
//         | OffscreenCanvas
//         | VideoFrame
//         | ImageData
//     ): Promise<DetectedBarcode[]>
// }

export function SyncScanner({ on_text }: { on_text: (s: string) => void }) {
    //     // const [ok, set_ok] = useState(false)
    //     // useEffect(() => {
    //     //     alert(`
    //     //         a:${"BarcodeDetector" in globalThis};
    //     //         b':${("window" in globalThis)};
    //     //         b:${("window" in globalThis) && ("BarcodeDetector" in window)};
    //     //         c':${("navigator" in globalThis)};
    //     //         c:${("navigator" in globalThis) && ("BarcodeDetector" in navigator)};


    //     //         `)
    //     //     if ("BarcodeDetector" in globalThis) {
    //     //         set_ok(true)
    //     //     }
    //     // }, [])
    //     // return ok ? <SyncScannerInner /> : <>-</>
    //     return <SyncScannerInner />
    // }
    // export function SyncScannerInner() {
    // const [try_, set_try_] = useState(Symbol())
    // const [cam, set_cam] = useState<MediaStream | null>()
    // const [cam_rejected, set_cam_rejected] = useState(false)

    // useEffect(() => {
    //     let started: Promise<MediaStream> | null = null
    //     let cancel = false
    //     setTimeout(() => {
    //         if (cancel) { return }
    //         console.log("start");

    //         started = navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })
    //         started.then(v => set_cam(v)).catch(() => set_cam_rejected(true))
    //     }, 100)
    //     return () => {
    //         cancel = true;
    //         if (started != null) {
    //             console.log("kill");
    //             started.then(v => v.getTracks().forEach(t => v.removeTrack(t))).catch(() => { })
    //         }
    //     }
    // }, [try_])


    // QrScanner.createQrEngine().then(v => alert(v))


    return <QRScan cam={null as never} on_text={on_text} />

    // return cam_rejected ? <>rejected <button onClick={() => {
    //     set_cam_rejected(false)
    //     set_try_(Symbol())
    // }}>retry</button> </> : cam ? <QRScan cam={cam} on_text={on_text} /> : <></>
}
export function QRScan({ cam, on_text }: { cam: MediaStream, on_text: (s: string) => void }) {
    const vid_ref = useRef<HTMLVideoElement>(null)
    // const id = useId()
    // const detector = useMemo(() => new BarcodeDetector(["qr_code"]), [])
    // const detector = useMemo(() => , [])
    const [text, set_text] = useState("---")
    const [see, set_see] = useState(false)

    const [attempt_num, set_attempt_num] = useState(0)

    const qrEngine = useMemo(() => QrScanner.createQrEngine(), [])

    const text_prev = useMemo(() => ({ value: "---", n: 0 }), [])
    text_prev.value = text
    text_prev.n = attempt_num

    useEffect(() => {
        vid_ref.current!.srcObject = cam
    }, [cam])

    useEffect(() => {
        // if (detector == null) {
        //     set_see(false)
        //     set_text("BarcodeDetector not allowed")
        //     return
        // }
        // const id = setInterval(() => {

        //     qrEngine.then(qrEngine => QrScanner.scanImage(vid_ref.current!, { qrEngine })).then(res => {
        //         console.log(res);
        //         if (res.data === "") {
        //             return
        //         }

        //         if (text_prev.value !== res.data) {
        //             on_text(res.data)
        //         }
        //         set_text(res.data)
        //         set_see(true)
        //         set_attempt_num(text_prev.n + 1)
        //     }).catch(() => {
        //         set_see(false)
        //         set_attempt_num(text_prev.n + 1)
        //     })
        //     // const s = detector.getState()

        //     // detector.detect(vid_ref.current!)
        // }, 100)
        // return () => {
        //     clearInterval(id)
        // }
        const qr = new QrScanner(vid_ref.current!, v => {

            set_text(v.data)
            set_see(true)
            set_attempt_num(text_prev.n++)
        }, {
            onDecodeError: () => {
                set_see(false)
                set_attempt_num(text_prev.n++)
            }
        })
        qr.start()
        return () => {
            qr.destroy()
        }
    }, [text_prev, qrEngine, on_text])

    return <>
        {text}
        <br />
        {see ? "Y" : "N"} {attempt_num}
        <button onClick={() => {
            alert(vid_ref.current)

            // qrEngine.then(qrEngine => QrScanner.scanImage(vid_ref.current!, { qrEngine, })).then(res => {
            //     alert("t:" + res.data + ";c:" + res.cornerPoints)
            // }).catch((e: Error) => {
            //     alert("error " + (typeof e) + " " + e)
            //     alert(e.name)
            //     alert(e.message)
            //     alert(e.cause)
            //     alert(e.stack)
            // })
        }}>test</button>
        <br />
        {/* <img src="./image.png" ref={vid_ref as never} style={{ display: "none" }} /> */}
        {/* <img src="./image.png" ref={vid_ref as never} style={{ maxWidth: "80vw" }} /> */}
        {/* <video ref={vid_ref} muted autoPlay playsInline style={{ maxWidth: "80vw" }} /> */}
        <video ref={vid_ref} muted autoPlay playsInline />
    </>
}