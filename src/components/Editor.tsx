import VsEditor from "@monaco-editor/react";
import { useEditorStore } from "../store/useEditorStore";

export default function Editor() {
    const { editorValue, setEditorValue } = useEditorStore();

    return (
        <VsEditor
            width={"98%"}
            height={"98%"}
            defaultLanguage={"javascript"}
            theme="vs-dark"
            defaultValue={editorValue}
            onChange={(value) => setEditorValue(value as string)}
        />
    );
}
