import SampleSplitter from "./SampleSplitter";
import { useResizable } from "react-resizable-layout";
import { cn } from "../utils/cn";
import Editor from "./Editor";
import Output from "./Output";
import Terminal from "./Terminal";
import 'xterm/css/xterm.css';

export default function Ide() {
    const {
        isDragging: isTerminalDragging,
        position: terminalH,
        separatorProps: terminalDragBarProps
    } = useResizable({
        axis: "y",
        initial: 380,
        min: 50,
        reverse: true,
    });
    const {
        isDragging: isOutputDragging,
        position: outputW,
        separatorProps: pluginDragBarProps
    } = useResizable({
        axis: "x",
        initial: 780,
        min: 50,
        reverse: true,
    });

    return (
        <div
            className={
                "flex flex-column h-screen bg-dark font-mono color-white overflow-hidden"
            }
        >
            <div className={"flex grow"}>
                <div className={"flex grow"}>
                    <div className={"grow contents bg-darker"}>
                        <Editor />
                    </div>
                    <SampleSplitter
                        isDragging={isOutputDragging}
                        {...pluginDragBarProps}
                    />
                    <div
                        className={cn("shrink-0 contents bg-darker", isOutputDragging && "dragging")}
                        style={{ width: outputW }}
                    >
                        <Output />
                    </div>
                </div>
            </div>
            <SampleSplitter
                dir={"horizontal"}
                isDragging={isTerminalDragging}
                {...terminalDragBarProps}
            />
            <div
                className={cn(
                    "shrink-0 bg-darker contents",
                    isTerminalDragging && "dragging"
                )}
                style={{ height: terminalH - 1 }}
            >
                <Terminal />
            </div>
        </div>
    );
}
