"use client";

import { is_client } from "@/util/metautils";

function media_metadata(init?: MediaMetadataInit): MediaMetadata {
    return "MediaMetadata" in globalThis ? new MediaMetadata(init) : init as MediaMetadata
}


export interface Song {
    id: string,
    title: string,
    src: Blob,
}
export function meta_from_song({ title, src, id }: Song): { id: string, meta: MediaMetadata, src: string } {
    return {
        id,
        meta: media_metadata({
            title,
            artwork: [{
                src: "./icon-512x512.png", sizes: "512x512",
                type: "image/png",
            }],
        }),
        src: URL.createObjectURL(src),
    }
}



const KE = {
    DBID: "pwaudio",
    SONGS_STOREID: "songs",
    SONGS: {
        id: "id",
        title: "title",
        src: "src",
    } satisfies { [k in keyof Song]: { [v in k]: k } }[keyof Song],
} as const

const SONG_DB = new Promise<IDBDatabase | null>((res, rej) => {
    if (!is_client()) {
        res(null)
        return
    }
    const req = indexedDB.open(KE.DBID)
    req.onupgradeneeded = e => {
        const db = (e.target as never as { result: IDBDatabase }).result
        const song_store = db.createObjectStore(KE.SONGS_STOREID, { keyPath: KE.SONGS.id })
        song_store.createIndex(KE.SONGS.title, KE.SONGS.title)
        song_store.createIndex(KE.SONGS.src, KE.SONGS.src)
    }
    req.onsuccess = () => {
        res(req.result)
    }
    req.onerror = rej
})

async function song_db_txn<T>(handle: (store: IDBObjectStore) => T): Promise<T> {
    const db = (await SONG_DB)
    if (!db) { throw new Error("not client") }
    const txn = db.transaction([KE.SONGS_STOREID], "readwrite")
    const result = handle(txn.objectStore(KE.SONGS_STOREID))
    txn.commit()
    return new Promise((res, rej) => {
        txn.oncomplete = () => res(result)
        txn.onabort = rej
    })
}

export async function get_songs(): Promise<Song[]> {
    return await song_db_txn(s => s.getAll(null)).then(v => {
        // console.log(v)
        return v.result as Song[]
    })
}
export async function put_song(song: Song) {
    await song_db_txn(s => s.put(song))
}
export async function clear_songs() {
    await song_db_txn(s => s.clear())
}

