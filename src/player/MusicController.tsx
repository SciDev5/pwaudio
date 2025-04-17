"use client"

import { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { meta_from_song, Song } from "./Song";


function bind_media_actions(actions: { [k in MediaSessionAction]?: MediaSessionActionHandler }) {
    for (const type of ["nexttrack", "pause", "play", "previoustrack", "seekbackward", "seekforward", "seekto", "skipad", "stop"] satisfies MediaSessionAction[]) {
        navigator.mediaSession.setActionHandler(type, actions[type] ?? null)
    }
}

class Var<T> {
    readonly on_change = new Set<(v: T) => void>()
    constructor(private _value: T) { }
    set value(v: T) {
        if (v === this._value) return
        this._value = v
        this.on_change.forEach(fn => fn(v))
    }
    get value() { return this._value }

    bind(fn: (v: T) => void): () => void {
        this.on_change.add(fn)
        return () => { this.on_change.delete(fn) }
    }

}
function useVar<T>(synced_var: Var<T>): [T, (v: T) => void] {
    const [inner, set_inner] = useState(synced_var.value)
    useEffect(() => {
        set_inner(synced_var.value)
        synced_var.on_change.add(set_inner)
        return () => {
            synced_var.on_change.delete(set_inner)
        }
    }, [synced_var])

    return [inner, useCallback((v: T) => {
        synced_var.value = v
    }, [synced_var])]
}

class Callbacks<T> {
    readonly on_change = new Set<(v: T) => void>()
    constructor(private prev: T) { }
    send(v: T) {
        this.prev = v
        this.on_change.forEach(fn => fn(v))
    }
    bind(fn: (v: T) => void): () => void {
        fn(this.prev)
        this.on_change.add(fn)
        return () => { this.on_change.delete(fn) }
    }
}

function useUpdateCallback<T>(synced_var: Var<T> | Callbacks<T>, callback: (v: T) => void) {
    useEffect(() => synced_var.bind(callback), [synced_var, callback])
}



export class Controls {
    readonly playing = new Var(false)
    readonly seek_to = new Callbacks(0)
    readonly duration = new Var(0)

    constructor() {
        if ("navigator" in globalThis) {
            bind_media_actions({
                play: () => this.playing.value = true,
                pause: () => this.playing.value = false,
                seekto: ({ seekTime }) => this.seek_to.send(seekTime!)
            })
        }
    }
    drop() {
        bind_media_actions({})
    }
}




export function AControls({ controls }: { controls: Controls }) {
    const [playing, set_playing] = useVar(controls.playing)
    const [duration] = useVar(controls.duration)

    return (<>
        <input
            type="checkbox"
            checked={playing}
            onChange={e => set_playing(e.currentTarget.checked)}
        />
        <input
            type="range"
            min={0}
            max={duration}
        // value={0}
        />
    </>)
}


export function ANavigatorControls({ controls }: { controls: Controls }) {
    useUpdateCallback(controls.playing, useCallback((v: boolean) => {
        navigator.mediaSession.playbackState = v ? "playing" : "paused"
    }, []))
    useEffect(() => {
        bind_media_actions({
            play: () => controls.playing.value = true,
            pause: () => controls.playing.value = false,
            seekto: ({ seekTime }) => controls.seek_to.send(seekTime!),
        })
        return () => {
            bind_media_actions({})
        }
    }, [controls])


    return <></>
}

const noop = () => { }
const dummy_controls = new Controls()

export function AudioThing({
    controls,
    current,
    next,
    on_end,
}: {
    controls: Controls,
    current: Song,
    next: Song | null,
    on_end: () => void,
}) {
    const meta_current = useMemo(() => meta_from_song(current), [current])
    const meta_next = useMemo(() => next && meta_from_song(next), [next])

    useEffect(() => {
        navigator.mediaSession.metadata = meta_current.meta
        return () => {
            navigator.mediaSession.metadata = null
        }
    }, [meta_current])

    return (<>{
        [{ ...meta_current, is_current: true }, ...meta_next && [{ ...meta_next, is_current: false }] || []]
            .map(({ id, src, is_current }) => (
                <AClip {...{
                    src,
                    controls: is_current ? controls : dummy_controls,
                    sync_position_state: is_current,
                    on_end: is_current ? on_end : noop
                }} key={id} />
            ))
    }</>)
}

function AClip({
    src,
    controls,
    sync_position_state,
    // on_load,
    on_end,
}: {
    src: string,
    controls: Controls,
    sync_position_state: boolean,
    // on_load: () => void,
    on_end: () => void,
}) {
    const ref = useRef<HTMLAudioElement | null>(null)

    const [playing] = useVar(controls.playing)
    useUpdateCallback(controls.playing, useCallback((t: boolean) => {

        console.log(t, ref.current,
            t ? ref.current?.play() : ref.current?.pause())

    }, []))
    useUpdateCallback(controls.seek_to, useCallback((t: number) => console.log("seeking", t, ref.current?.fastSeek(t)), []))

    const on_sync_position_state = useMemo(() =>
        sync_position_state
            ? (e: SyntheticEvent<HTMLAudioElement>) => {
                const ref = e.currentTarget
                navigator.mediaSession.setPositionState({ duration: ref.duration, position: ref.currentTime, playbackRate: ref.playbackRate })
            }
            : () => { },
        [sync_position_state],
    )

    return <audio
        ref={ref}
        autoPlay={playing}
        src={src}
        // onLoad={on_load}
        onPlay={on_sync_position_state}
        onPause={on_sync_position_state}
        onSeeked={on_sync_position_state}
        onEnded={useCallback(() => on_end(), [on_end])}
    />
}