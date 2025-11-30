import { WebContainer } from '@webcontainer/api';
import { useEffect, useRef, useCallback } from 'react';
import { files } from '../utils/files';
import { useEditorStore } from '../store/useEditorStore';

// Singleton para WebContainer - solo una instancia permitida
export let webContainerSingleton: WebContainer | null = null;
let isInitializing = false;

export default function Output() {
    const { editorValue, setEditorValue } = useEditorStore();
    const iframeEl = useRef<HTMLIFrameElement>(null);
    const initializationRef = useRef(false);

    const writeIndexJS = useCallback(async (content: string) => {
        if (!webContainerSingleton) return;
        try {
            await webContainerSingleton.fs.writeFile('index.js', content);
        } catch (error) {
            console.error('Error writing index.js:', error);
        }
    }, []);

    // Inicialización única del WebContainer
    useEffect(() => {
        let isMounted = true;

        const initializeWebContainer = async () => {
            // Evitar múltiples inicializaciones
            if (webContainerSingleton || isInitializing || initializationRef.current) {
                return;
            }

            isInitializing = true;
            initializationRef.current = true;

            try {
                // Inicializar el valor del editor solo una vez
                const indexJS = files['index.js'].file.contents;
                setEditorValue(indexJS);

                // Inicializar WebContainer solo si no existe
                if (!webContainerSingleton) {
                    webContainerSingleton = await WebContainer.boot();
                    await webContainerSingleton.mount(files);

                    // Configurar listener para server-ready con verificación robusta
                    webContainerSingleton.on('server-ready', (_, url) => {
                        if (isMounted && iframeEl.current) {
                            iframeEl.current.src = url;
                        }
                    });
                }
            } catch (error) {
                console.error('Error initializing WebContainer:', error);
                initializationRef.current = false;
                isInitializing = false;
            } finally {
                isInitializing = false;
            }
        };

        initializeWebContainer();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo se ejecuta una vez al montar el componente

    // Escribir cambios en el editor
    useEffect(() => {
        if (editorValue && webContainerSingleton && initializationRef.current) {
            writeIndexJS(editorValue).catch((error) => {
                console.error('Error writing index.js:', error);
            });
        }
    }, [editorValue, writeIndexJS]);

    return (
        <iframe
            ref={iframeEl}
            src=""
            style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'white',
                color: 'black',
            }}
            title="WebContainer Output"
        />
    );
}
