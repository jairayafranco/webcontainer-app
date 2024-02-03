import { create } from 'zustand'

type EditorStore = {
    editorValue: string
    setEditorValue: (value: string) => void
}

export const useEditorStore = create<EditorStore>()((set) => ({
    editorValue: "",
    setEditorValue: (value: string) => set({ editorValue: value })
}))
