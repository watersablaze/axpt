export default function WatchTimeGraph({ points }: { points: number[] }) {
  return (
    <div className="watchTimeGraph">
      <h2>Watch Time</h2>
      <svg viewBox="0 0 100 40">
        <path
          d={
            points
              .map((v, i) => {
                const x = (i / (points.length - 1)) * 100;
                const y = 40 - (v * 40) / Math.max(...points, 1);
                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
              })
              .join(' ')
          }
          stroke="#00ffc2"
          fill="none"
        />
      </svg>
    </div>
  );
}