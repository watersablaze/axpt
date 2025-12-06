export default function ChatHeatmap({ data }: { data: number[] }) {
  return (
    <div className="heatmap">
      <h2>Chat Activity Heatmap</h2>

      <div className="heatgrid">
        {data.map((v, i) => (
          <div
            key={i}
            className="heatcell"
            style={{
              background: `rgba(0,255,180,${Math.min(v / 10, 1)})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}