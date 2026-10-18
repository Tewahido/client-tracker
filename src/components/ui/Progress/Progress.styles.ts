export const progressStyles = {
  ring: {
    root: 'relative inline-flex shrink-0 items-center justify-center',
    svg: '-rotate-90',
    track: 'stroke-surface-2',
    value: 'transition-[stroke-dashoffset] duration-700 ease-out',
    label: 'absolute text-[11px] font-bold tabular',
  },
  bar: {
    track: 'h-2 w-full overflow-hidden rounded-full bg-surface-2',
    fill: 'h-full rounded-full transition-[width] duration-700 ease-out',
  },
}
