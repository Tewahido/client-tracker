import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMoney } from '../../../../hooks/useMoney'
import { collectionsChartStyles as s } from './CollectionsChart.styles'

interface Point {
  key: string
  label: string
  fullLabel: string
  cents: number
}

/** Single-series bar chart of money collected per month, with a hover tooltip and a screen-reader table. */
export function CollectionsChart({ data }: { data: Point[] }) {
  const money = useMoney()

  return (
    <>
      <div className={s.wrap} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} className={s.grid} strokeDasharray="0" />
            <XAxis dataKey="label" interval={0} axisLine={false} tickLine={false} tick={{ className: s.axisTick }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={56}
              tick={{ className: s.axisTick }}
              tickFormatter={(v: number) => money(v, { compact: true })}
            />
            <Tooltip cursor={{ className: s.cursor }} content={({ active, payload }) => <ChartTooltip active={active} point={payload?.[0]?.payload as Point | undefined} format={money} />} />
            <Bar dataKey="cents" className={s.bar} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className={s.srOnly}>
        <caption>Money collected per month</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.fullLabel}</th>
              <td>{money(d.cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function ChartTooltip({ active, point, format }: { active?: boolean; point?: Point; format: (cents: number) => string }) {
  if (!active || !point) return null
  return (
    <div className={s.tooltip}>
      <div className={s.tooltipLabel}>{point.fullLabel}</div>
      <div className={s.tooltipValue}>{format(point.cents)}</div>
    </div>
  )
}
