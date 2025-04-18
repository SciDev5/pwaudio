"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AControls, ANavigatorControls, AudioThing, Controls } from "./MusicController"
import { get_songs, Song } from "./Song"
import { sync, SyncScanner } from "./loadersync"

export function TEST() {
    const controls = useMemo(() => new Controls(), [])
    const [songs, set_songs] = useState<Song[]>([])
    useEffect(() => {
        get_songs().then(set_songs)
    }, [])

    const r = useCallback(async (input: string) => {
        if (await sync(input)) set_songs(await get_songs())
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
        <SyncScanner on_text={v => {
            alert(v)
            r(v)
        }} />
    </>)
}