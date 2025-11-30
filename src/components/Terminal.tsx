import { useEffect, useRef, useCallback } from 'react';
import { Terminal as EditorTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebContainer } from '@webcontainer/api';
import { webContainerSingleton } from './Output';
import 'xterm/css/xterm.css';

export default function Terminal() {
    const terminalContainerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<EditorTerminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const shellProcessRef = useRef<Awaited<ReturnType<WebContainer['spawn']>> | null>(null);

    const startTerminal = useCallback(() => {
        if (!terminalContainerRef.current || terminalRef.current) {
            return;
        }

        try {
            const fitAddon = new FitAddon();
            fitAddonRef.current = fitAddon;

            terminalRef.current = new EditorTerminal({
                convertEol: true,
            });
            terminalRef.current.loadAddon(fitAddon);
            terminalRef.current.open(terminalContainerRef.current);

            // Esperar un momento para que el terminal se renderice antes de hacer fit
            setTimeout(() => {
                try {
                    if (fitAddonRef.current) {
                        fitAddonRef.current.fit();
                    }
                } catch (error) {
                    console.error('Error fitting terminal:', error);
                }
            }, 100);
        } catch (error) {
            console.error('Error starting terminal:', error);
        }
    }, []);

    const startShell = useCallback(async (terminal: EditorTerminal) => {
        if (!webContainerSingleton) {
            // Esperar a que el WebContainer esté listo
            const checkInterval = setInterval(() => {
                if (webContainerSingleton && terminalRef.current) {
                    clearInterval(checkInterval);
                    startShell(terminalRef.current);
                }
            }, 100);
            // Limpiar después de 10 segundos si no se inicializa
            setTimeout(() => clearInterval(checkInterval), 10000);
            return;
        }

        // Limpiar shell anterior si existe
        if (shellProcessRef.current) {
            try {
                shellProcessRef.current.kill();
            } catch {
                // Ignorar errores al matar proceso anterior
            }
            shellProcessRef.current = null;
        }

        try {
            // Esperar a que el terminal esté listo
            if (terminal.rows === 0 || terminal.cols === 0) {
                // Esperar a que el terminal tenga dimensiones válidas
                await new Promise(resolve => setTimeout(resolve, 200));
                if (terminal.rows === 0 || terminal.cols === 0) {
                    console.warn('Terminal not ready, using default dimensions');
                    // Usar dimensiones por defecto
                    const shellProcess = await webContainerSingleton.spawn('jsh', {
                        terminal: {
                            cols: 80,
                            rows: 24,
                        },
                    });
                    shellProcessRef.current = shellProcess;
                    setupShellIO(shellProcess, terminal);
                    return;
                }
            }

            const shellProcess = await webContainerSingleton.spawn('jsh', {
                terminal: {
                    cols: terminal.cols || 80,
                    rows: terminal.rows || 24,
                },
            });

            shellProcessRef.current = shellProcess;
            setupShellIO(shellProcess, terminal);
        } catch (error) {
            console.error('Error starting shell:', error);
        }
    }, []);

    const setupShellIO = (shellProcess: Awaited<ReturnType<WebContainer['spawn']>>, terminal: EditorTerminal) => {
        shellProcess.output.pipeTo(new WritableStream({
            write(data) {
                if (terminalRef.current) {
                    terminalRef.current.write(data);
                }
            }
        }));

        const input = shellProcess.input.getWriter();
        terminal.onData((data) => {
            input.write(data);
        });
    };

    // Inicializar terminal cuando el componente se monte
    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            // Iniciar terminal
            startTerminal();

            // Esperar a que el terminal esté listo y el WebContainer esté disponible
            const waitForReady = async () => {
                let attempts = 0;
                while (attempts < 50) { // Esperar hasta 5 segundos
                    if (webContainerSingleton && terminalRef.current && isMounted) {
                        // Esperar un poco más para que el terminal se renderice completamente
                        await new Promise(resolve => setTimeout(resolve, 300));
                        if (terminalRef.current && isMounted) {
                            await startShell(terminalRef.current);
                            break;
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
            };

            await waitForReady();
        };

        initialize();

        return () => {
            isMounted = false;
            // Limpiar terminal
            if (terminalRef.current) {
                try {
                    terminalRef.current.dispose();
                } catch {
                    // Ignorar errores de cleanup
                }
                terminalRef.current = null;
            }
            // Limpiar shell process
            if (shellProcessRef.current) {
                try {
                    shellProcessRef.current.kill();
                } catch {
                    // Ignorar errores
                }
                shellProcessRef.current = null;
            }
        };
    }, [startTerminal, startShell]);

    return (
        <div
            ref={terminalContainerRef}
            id="terminal"
            style={{
                width: '100%',
                height: '100%',
                padding: '8px',
            }}
        />
    );
}
