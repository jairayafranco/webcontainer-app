import { useState } from 'react'
import { cn } from '../utils/cn'

export default function SampleSplitter({
    id = 'drag-bar',
    dir,
    isDragging,
    ...props
}: any) {
    const [isFocused, setIsFocused] = useState(false)

    return (
        <div
            id={id}
            data-testid={id}
            tabIndex={0}
            className={cn(
                'sample-drag-bar',
                dir === 'horizontal' && 'sample-drag-bar--horizontal',
                (isDragging || isFocused) && 'sample-drag-bar--dragging'
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
        />
    )
}
