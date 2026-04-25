export type ChartFrameProps = {
  title?: string;
  children?: React.ReactNode;
};

export function ChartFrame({ children }: ChartFrameProps) {
  return <div>{children}</div>;
}
