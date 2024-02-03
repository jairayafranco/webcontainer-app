/* eslint-disable react-hooks/exhaustive-deps */
import { WebContainer } from '@webcontainer/api';
import { useEffect, useRef } from 'react';
import { files } from '../utils/files';
import { useEditorStore } from '../store/useEditorStore';
import { Terminal as EditorTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

export default function Output() {
    const { editorValue, setEditorValue } = useEditorStore();
    const webContainerInstance = useRef<WebContainer>();
    const terminalRef = useRef<EditorTerminal>();
    const iframeEl = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        startWebContainer();
    }, []);

    useEffect(() => {
        writeIndexJS(editorValue);
    }, [editorValue]);

    const startWebContainer = async () => {
        const indexJS = files['index.js'].file.contents;
        setEditorValue(indexJS);

        if (!webContainerInstance.current) {
            startTerminal();
            webContainerInstance.current = await WebContainer.boot();
            await webContainerInstance.current.mount(files);

            webContainerInstance.current?.on('server-ready', (_, url) => {
                iframeEl.current!.src = url;
            });

            startShell(terminalRef.current!);
        }
    }

    const startShell = async (terminal: EditorTerminal) => {
        const shellProcess = await webContainerInstance.current?.spawn('jsh', {
            terminal: {
                cols: terminal.cols,
                rows: terminal.rows,
            },
        });
        shellProcess?.output.pipeTo(new WritableStream({
            write(data) {
                terminalRef.current?.write(data);
            }
        }));

        const input = shellProcess?.input.getWriter();
        terminalRef.current?.onData((data) => {
            input?.write(data);
        });

        return shellProcess;
    }

    const writeIndexJS = async (content: string) => {
        await webContainerInstance.current?.fs.writeFile('index.js', content);
    }

    const startTerminal = () => {
        const fitAddon = new FitAddon();

        terminalRef.current = new EditorTerminal({
            convertEol: true,
        });
        terminalRef.current.loadAddon(fitAddon);
        terminalRef.current.open(document.querySelector('#terminal')!);

        fitAddon.fit();
    }

    return (
        <iframe
            ref={iframeEl}
            src={''}
            style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'white',
                color: 'black',
                textAlign: 'center'
            }}
        >
        </iframe>
    );
}
