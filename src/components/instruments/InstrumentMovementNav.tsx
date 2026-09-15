import styles from "./InstrumentMovementNav.module.css";

type Movement = {
  index: string;
  label: string;
  active?: boolean;
};

export function InstrumentMovementNav({
  movements,
}: {
  movements: Movement[];
}) {
  return (
    <nav className={styles.nav} aria-label="Instrument movements">
      {movements.map((movement) => (
        <div
          key={movement.index}
          className={movement.active ? styles.active : undefined}
        >
          <span>{movement.index}</span>
          <strong>{movement.label}</strong>
        </div>
      ))}
    </nav>
  );
}
