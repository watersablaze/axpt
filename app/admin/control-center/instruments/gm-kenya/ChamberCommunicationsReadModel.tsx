import type { GlobalMotherChamberCommunicationReadModel } from "@/domains/instruments/global-mother/loadGlobalMotherChamberCommunicationReadModel";

import styles from "./ChamberCommunicationsReadModel.module.css";

function label(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function ChamberCommunicationsReadModel({
  model,
}: {
  model: GlobalMotherChamberCommunicationReadModel;
}) {
  return (
    <section
      id="gm-chamber-communications"
      className={styles.surface}
      aria-labelledby="gm-chamber-communications-heading"
    >
      <header className={styles.heading}>
        <div>
          <span>02 / Communications</span>
          <h2 id="gm-chamber-communications-heading">Institutional Communications</h2>
        </div>

        <strong>
          {model.standing === "ESTABLISHED"
            ? "SITUATED"
            : model.standing === "AMBIGUOUS"
              ? "REVIEW REQUIRED"
              : "NOT YET SITUATED"}
        </strong>
      </header>

      <p className={styles.boundary}>
        Correspondence, formal Chamber record, and governed institutional
        outcome remain distinct. Formal record entry establishes provenance and
        institutional significance; it does not itself create authority,
        approval, obligation, execution, or state transition.
      </p>

      {model.standing === "NOT_ESTABLISHED" ? (
        <div className={styles.emptyState}>
          <span>Planned communications field</span>
          <h3>No Chamber communications room has been established.</h3>
          <p>
            Chamber V2 has a reserved communications identity. No
            correspondence, formal record, or institutional reflection is
            implied by preparation.
          </p>

          <dl>
            <div>
              <dt>Room identity</dt>
              <dd>{model.plannedClientRoomId}</dd>
            </div>
            <div>
              <dt>Room class</dt>
              <dd>{label(model.plannedRoomClass)}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {model.standing === "AMBIGUOUS" ? (
        <div className={styles.emptyState}>
          <span>Operator review required</span>
          <h3>The Chamber communications binding requires review.</h3>
          <p>
            The durable Chamber binding does not currently resolve to the exact
            planned active room topology. Communications remain withheld until
            the canonical binding is reconciled.
          </p>
        </div>
      ) : null}

      {model.standing === "ESTABLISHED" ? (
        <>
          <div className={styles.roomStrip}>
            <div>
              <span>Room</span>
              <strong>
                {model.room.title || "Global Mother · Chamber V2"}
              </strong>
            </div>
            <div>
              <span>Correspondence</span>
              <strong>{model.correspondenceCount}</strong>
            </div>
            <div>
              <span>Formal record</span>
              <strong>{model.formalRecordCount}</strong>
            </div>
            <div>
              <span>Reflections</span>
              <strong>{model.reflectionCount}</strong>
            </div>
          </div>

          {model.messages.length === 0 && model.reflections.length === 0 ? (
            <div className={styles.emptyState}>
              <span>Situated · no activity</span>
              <h3>The Chamber communications field is open but empty.</h3>
              <p>
                No correspondence, formal Chamber record, or institutional
                reflection has yet been recorded.
              </p>
            </div>
          ) : (
            <div className={styles.timeline}>
              {model.messages.map((message) =>
                message.chamberRecord ? (
                  <article
                    className={`${styles.entry} ${styles.formalEntry}`}
                    key={`record:${message.chamberRecord.id}`}
                  >
                    <header>
                      <div>
                        <span>
                          Chamber record ·{" "}
                          {label(message.chamberRecord.communicationClass)}
                        </span>
                        <h4>{message.chamberRecord.subject}</h4>
                      </div>

                      <time
                        dateTime={message.chamberRecord.enteredIntoRecordAt.toISOString()}
                      >
                        {formatDate(message.chamberRecord.enteredIntoRecordAt)}
                      </time>
                    </header>

                    <div className={styles.recordPosture}>
                      <strong>
                        {message.chamberRecord.authorCapacityLabel}
                      </strong>
                      <span>
                        To · {label(message.chamberRecord.addresseeType)}
                      </span>
                    </div>

                    <p>{message.body}</p>

                    <footer>
                      <span>Record {message.chamberRecord.id}</span>
                      {message.chamberRecord.respondsToRecordId ? (
                        <span>
                          Responds to {message.chamberRecord.respondsToRecordId}
                        </span>
                      ) : null}
                      {message.chamberRecord.supersedesRecordId ? (
                        <span>
                          Supersedes {message.chamberRecord.supersedesRecordId}
                        </span>
                      ) : null}
                    </footer>
                  </article>
                ) : (
                  <article
                    className={styles.entry}
                    key={`message:${message.id}`}
                  >
                    <header>
                      <div>
                        <span>Correspondence</span>
                        <h4>{label(message.kind)}</h4>
                      </div>

                      <time dateTime={message.createdAt.toISOString()}>
                        {formatDate(message.createdAt)}
                      </time>
                    </header>

                    <p>{message.body}</p>

                    <footer>
                      <span>Sender {message.senderUserId}</span>
                    </footer>
                  </article>
                ),
              )}

              {model.reflections.map((reflection) => (
                <article
                  className={`${styles.entry} ${styles.reflectionEntry}`}
                  key={`reflection:${reflection.id}`}
                >
                  <header>
                    <div>
                      <span>Institutional reflection</span>
                      <h4>{label(reflection.reflectionCode)}</h4>
                    </div>

                    <time dateTime={reflection.sourceOccurredAt.toISOString()}>
                      {formatDate(reflection.sourceOccurredAt)}
                    </time>
                  </header>

                  <p>
                    {label(reflection.sourceEventType)} ·{" "}
                    {label(reflection.sourceAggregateType)}
                  </p>

                  <footer>
                    <span>{label(reflection.sourceSystem)}</span>
                    <span>
                      {label(reflection.targetType)} ·{" "}
                      {label(reflection.targetSubtype)}
                    </span>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
