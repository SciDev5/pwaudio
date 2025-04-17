"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AControls, ANavigatorControls, AudioThing, Controls } from "./MusicController"
import { clear_songs, get_songs, put_song, Song } from "./Song"
import { SyncScanner } from "./SyncScanner"
import path from "path"

export function TEST() {
    const controls = useMemo(() => new Controls(), [])
    const [songs, set_songs] = useState<Song[]>([])
    useEffect(() => {
        get_songs().then(set_songs)
    }, [])

    const r = useCallback(async (input: string) => {
        const [, s, loader_url] = /^\[PWAUDIO\]http(s?):\/\/(.*)$/.exec(input) ?? [, null]
        const proto = `http${s}://`
        if (
            loader_url == null
            || await (await fetch(proto + path.join(loader_url, "manifest"))).text() !== "pwaudio_loader"
        ) {
            alert("invalid")
            return
        }
        await clear_songs()
        await Promise.all(
            ((await (await fetch(proto + loader_url)).json()) as ({ id: string, title: string })[])
                .map(async ({ id, title }) => ({ id, src: await (await fetch(proto + path.join(loader_url, "file", id))).blob(), title } satisfies Song))
                .map(async v => await put_song(await v))
        )
        set_songs(await get_songs())
        // await clear_songs()
        // await Promise.all(([
        //     async () => ({ id: "0", title: "zero", src: await (await fetch("./0.wav")).blob() }),
        //     async () => ({ id: "1", title: "one", src: await (await fetch("./1.wav")).blob() }),
        // ] satisfies (() => Promise<Song>)[]).map(async v => await put_song(await v())))
        // set_songs(await get_songs())
    }, [])

    return (<>
        <button
            onClick={() => r(prompt() ?? "")}
        >
            load_songs
        </button>
        <div>
            {songs.map(v => (
                <div key={v.id}>song: {v.title}</div>
            )) || <>no songs</>}
        </div>
        {songs.length > 0 && <AudioThing controls={controls}
            current={songs[0]}
            next={songs[1] ?? null}
            on_end={() => {
                console.log("ended")
            }}
        />}
        <ANavigatorControls controls={controls} />
        <AControls controls={controls} />
        <SyncScanner on_text={v => { r(v) }} />
    </>)
}