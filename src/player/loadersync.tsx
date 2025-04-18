"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import QrScanner from "qr-scanner"
import { usePassthroughMemo } from "@/util/react"
import path from "path"
import { clear_songs, put_song, Song } from "./Song"

export function SyncScanner({ on_text }: { on_text: (s: string) => void }) {
    const vid_ref = useRef<HTMLVideoElement>(null)
    const pass = usePassthroughMemo({ on_text })
    const prev = useMemo(() => ({ data: "" }), [])
    const [failed, set_failed] = useState(false)

    useEffect(() => {
        let scanner: QrScanner | null = null

        const id = setTimeout(() => {
            scanner = new QrScanner(
                vid_ref.current!,
                val => {
                    if (val.data != prev.data) {
                        prev.data = val.data
                        pass.on_text(val.data)
                    }
                },
                { preferredCamera: "environment" },
            )
            scanner.start().catch((e) => {
                console.warn("Error opening camera / qr-scanner: ", e)
                set_failed(true)
            }).then(() => {
                set_failed(false)
            })
        }, 100)
        return () => {
            clearTimeout(id)
            scanner?.destroy()
        }
    }, [pass, prev])

    return (<>
        {failed ? (<>
            failed to start camera
        </>) : <></>}
        <video autoPlay playsInline ref={vid_ref} />
    </>)
}


export async function sync(sync_code: string): Promise<boolean> {
    const [, s, loader_url] = /^\[PWAUDIO\]http(s?):\/\/(.*)$/.exec(sync_code) ?? [, null]
    const proto = `http${s}://`
    if (loader_url == null) return false
    if (await (await fetch(proto + path.join(loader_url, "manifest"))).text() !== "pwaudio_loader") return false

    await clear_songs()
    await Promise.all(
        ((await (await fetch(proto + loader_url)).json()) as ({ id: string, title: string })[])
            .map(async ({ id, title }) => ({ id, src: await (await fetch(proto + path.join(loader_url, "file", id))).blob(), title } satisfies Song))
            .map(async v => await put_song(await v))
    )
    return true
}