import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type InvoiceStatusSlice = {
  key: string;
  label: string;
  value: number;
};

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

type ChartInvoiceStatusProps = {
  data: InvoiceStatusSlice[];
  emptyLabel: string;
};

export function ChartInvoiceStatus({ data, emptyLabel }: ChartInvoiceStatusProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  if (total <= 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex h-56 flex-col items-center gap-3 sm:flex-row">
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={42} outerRadius={64} paddingAngle={2}>
              {data.map((slice, index) => (
                <Cell key={slice.key} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-1 flex-col gap-1.5 text-sm">
        {data.map((slice, index) => (
          <li key={slice.key} className="flex items-center justify-between gap-3 text-muted-foreground">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              {slice.label}
            </span>
            <span className="font-medium text-foreground">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
