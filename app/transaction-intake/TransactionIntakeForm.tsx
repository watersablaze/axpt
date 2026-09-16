"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "./transaction-intake.module.css";

type Props = {
  initialReferralCode?: string;
  initialRepresentativeName?: string;
  initialProgram?: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; reference: string }
  | { status: "error"; message: string };

const roleOptions = [
  "Buyer",
  "Buyer Representative",
  "Buyer Mandate",
  "Intermediary",
  "Consultant",
  "Other",
];

const programOptions = [
  "French-Ward Gold",
  "Bafoula Cooperative",
  "AXPT Strategic Intake",
  "General",
  "Other",
];

const transactionPurposeOptions = [
  "Trial Purchase",
  "Spot Purchase",
  "Initial Tranche / Continuing Supply",
  "Recurring Supply",
  "Other",
];

const deliveryPathwayOptions = [
  "CIF / Seller-coordinated delivery",
  "FOB / Buyer-coordinated export",
  "Local refinery delivery",
  "Local collection / handover",
  "To be determined with French-Ward",
  "Other",
];

const assayPostureOptions = [
  "Final assay at receiving refinery",
  "Independent assay before delivery",
  "Source assay with receiving verification",
  "To be determined",
  "Other",
];

const settlementPathwayOptions = [
  "Direct settlement",
  "Escrow-controlled settlement",
  "To be determined",
];

const settlementRailOptions = [
  "Bank transfer",
  "Digital asset",
  "Bank transfer + digital asset",
  "To be determined",
  "Other",
];

const financialCapacityOptions = [
  "Available upon request",
  "Subject to coordination",
  "Unavailable at present",
];

function inputValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export default function TransactionIntakeForm({
  initialReferralCode = "",
  initialRepresentativeName = "",
  initialProgram = "",
}: Props) {
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });

  const [buyerName, setBuyerName] = useState("");
  const [
    buyerRepresentativeName,
    setBuyerRepresentativeName,
  ] = useState("");

  const [
    continuingSupplyIntent,
    setContinuingSupplyIntent,
  ] = useState("");

  const [settlementRail, setSettlementRail] =
    useState("");

  const [
    additionalSettlementAuthorityRequired,
    setAdditionalSettlementAuthorityRequired,
  ] = useState("");

  const sourceUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const submittedBuyerName =
      inputValue(formData, "buyerName");

    const externalParticipantName = inputValue(
      formData,
      "externalParticipantName",
    );

    const externalParticipants = externalParticipantName
      ? [
          {
            name: externalParticipantName,
            organization: inputValue(
              formData,
              "externalParticipantOrganization",
            ),
            role: inputValue(formData, "externalParticipantRole"),
            email: inputValue(formData, "externalParticipantEmail"),
          },
        ]
      : [];

    const authorityLabels = [
      checked(formData, "authorityToRepresent")
        ? "Authorized to represent"
        : "",
      checked(formData, "authorityToNegotiate")
        ? "Authorized to negotiate"
        : "",
      checked(formData, "authorityToSign")
        ? "Authorized signatory"
        : "",
      inputValue(formData, "authorityOther"),
    ].filter(Boolean);

    const readinessLabels = [
      checked(formData, "incorporationRecordAvailable")
        ? "Certificate / incorporation record available"
        : "",
      checked(formData, "kybRecordAvailable")
        ? "KYB / corporate information available"
        : "",
      checked(formData, "representativeIdAvailable")
        ? "Representative identification available"
        : "",
      checked(formData, "authorityDocumentAvailable")
        ? "Mandate / authority documentation available"
        : "",
    ].filter(Boolean);

    const transactionPurpose = inputValue(
      formData,
      "transactionPurpose",
    );

    const deliveryPathway = inputValue(
      formData,
      "deliveryPathway",
    );

    const settlementPathway = inputValue(
      formData,
      "settlementPathway",
    );

    const settlementRail = inputValue(
      formData,
      "settlementRail",
    );

    const payload = {
      /* Existing canonical intake fields */

      submitterName: inputValue(formData, "submitterName"),
      submitterEmail: inputValue(formData, "submitterEmail"),
      submitterPhone: inputValue(formData, "submitterPhone"),
      submitterCompany: inputValue(formData, "submitterCompany"),
      submitterCountry: inputValue(formData, "submitterCountry"),
      submitterRole: inputValue(formData, "submitterRole"),

      representedPartyType: "Buyer",
      representedPartyName: submittedBuyerName,
      authorizationStatus: authorityLabels.join(", "),

      program: inputValue(formData, "program"),

      transactionType: transactionPurpose,
      commodity: inputValue(formData, "commodity"),
      quantity: inputValue(formData, "quantity"),
      trialQuantity: inputValue(formData, "trialQuantity"),
      monthlyQuantity: inputValue(formData, "recurringQuantity"),

      origin: inputValue(formData, "origin"),
      destination: inputValue(formData, "destination"),

      deliveryTerms: deliveryPathway,

      settlementMethod: [
        settlementPathway,
        settlementRail,
      ]
        .filter(Boolean)
        .join(" / "),

      expectedTimeline: inputValue(
        formData,
        "transactionWindow",
      ),

      buyerName: submittedBuyerName,
      sellerName: "",

      refineryPreference: inputValue(
        formData,
        "refineryPreference",
      ),

      financialReadiness: inputValue(
        formData,
        "financialCapacityStatus",
      ),

      documentsAvailable: readinessLabels.join(", "),

      supportingNotes: [
        inputValue(formData, "buyerRequirements"),
        inputValue(formData, "specialComplianceDetail"),
      ]
        .filter(Boolean)
        .join("\n\n"),

      referralCode: inputValue(formData, "referralCode"),

      referredByName:
        inputValue(formData, "referredByName") ||
        initialRepresentativeName,

      referredByCompany: inputValue(
        formData,
        "referredByCompany",
      ),

      referredByEmail: inputValue(
        formData,
        "referredByEmail",
      ),

      referredByPhone: "",

      referredByRole: inputValue(
        formData,
        "referredByRole",
      ),

      referralConfirmed: false,
      compensationExpectation: "",

      declarationAccuracy: checked(
        formData,
        "declarationAccuracy",
      ),

      declarationNoObligation: checked(
        formData,
        "declarationNoObligation",
      ),

      declarationNoCommission: checked(
        formData,
        "declarationNoCommission",
      ),

      sourceUrl,

      /* V4 — Counterparty Identity */

      buyerRegistrationNumber: inputValue(
        formData,
        "buyerRegistrationNumber",
      ),

      buyerCountryOfIncorporation: inputValue(
        formData,
        "buyerCountryOfIncorporation",
      ),

      buyerRegisteredAddress: inputValue(
        formData,
        "buyerRegisteredAddress",
      ),

      buyerBusinessAddress: inputValue(
        formData,
        "buyerBusinessAddress",
      ),

      buyerCorporateEmail: inputValue(
        formData,
        "buyerCorporateEmail",
      ),

      buyerCorporatePhone: inputValue(
        formData,
        "buyerCorporatePhone",
      ),

      buyerRepresentativeName: inputValue(
        formData,
        "buyerRepresentativeName",
      ),

      buyerRepresentativeTitle: inputValue(
        formData,
        "buyerRepresentativeTitle",
      ),

      buyerRepresentativeEntity: inputValue(
        formData,
        "buyerRepresentativeEntity",
      ),

      buyerRepresentativeEmail: inputValue(
        formData,
        "buyerRepresentativeEmail",
      ),

      buyerRepresentativePhone: inputValue(
        formData,
        "buyerRepresentativePhone",
      ),

      buyerRepresentativeRelationship: inputValue(
        formData,
        "buyerRepresentativeRelationship",
      ),

      authorityToRepresent: checked(
        formData,
        "authorityToRepresent",
      ),

      authorityToNegotiate: checked(
        formData,
        "authorityToNegotiate",
      ),

      authorityToSign: checked(
        formData,
        "authorityToSign",
      ),

      authorityOther: inputValue(
        formData,
        "authorityOther",
      ),

      externalParticipants,

      /* V4 — Transaction Profile */

      requestedPurity: inputValue(
        formData,
        "requestedPurity",
      ),

      transactionPurpose,

      transactionWindow: inputValue(
        formData,
        "transactionWindow",
      ),

      continuingSupplyIntent: inputValue(
        formData,
        "continuingSupplyIntent",
      ),

      recurringQuantity: inputValue(
        formData,
        "recurringQuantity",
      ),

      recurringFrequency: inputValue(
        formData,
        "recurringFrequency",
      ),

      desiredTerm: inputValue(
        formData,
        "desiredTerm",
      ),

      destinationStatus: inputValue(
        formData,
        "destinationStatus",
      ),

      buyerRequirements: inputValue(
        formData,
        "buyerRequirements",
      ),

      /* V4 — Delivery / Assay */

      deliveryPathway,

      deliveryPoint: inputValue(
        formData,
        "deliveryPoint",
      ),

      buyerRepresentativesPresent: inputValue(
        formData,
        "buyerRepresentativesPresent",
      ),

      buyerRepresentative1: inputValue(
        formData,
        "buyerRepresentative1",
      ),

      buyerRepresentative2: inputValue(
        formData,
        "buyerRepresentative2",
      ),

      refineryJurisdiction: inputValue(
        formData,
        "refineryJurisdiction",
      ),

      assayPosture: inputValue(
        formData,
        "assayPosture",
      ),

      additionalAssayRequirements: inputValue(
        formData,
        "additionalAssayRequirements",
      ),

      /* V4 — Settlement */

      settlementPathway,
      settlementRail,

      settlementCurrencyAsset: inputValue(
        formData,
        "settlementCurrencyAsset",
      ),

      settlementTimingRequirement: inputValue(
        formData,
        "settlementTimingRequirement",
      ),

      bankMessageFormat: inputValue(
        formData,
        "bankMessageFormat",
      ),

      digitalAsset: inputValue(
        formData,
        "digitalAsset",
      ),

      digitalAssetNetwork: inputValue(
        formData,
        "digitalAssetNetwork",
      ),

      additionalSettlementAuthorityRequired:
        inputValue(
          formData,
          "additionalSettlementAuthorityRequired",
        ),

      additionalSettlementAuthorityDetail:
        inputValue(
          formData,
          "additionalSettlementAuthorityDetail",
        ),

      financialCapacityStatus: inputValue(
        formData,
        "financialCapacityStatus",
      ),

      /* V4 — Readiness */

      incorporationRecordAvailable: checked(
        formData,
        "incorporationRecordAvailable",
      ),

      kybRecordAvailable: checked(
        formData,
        "kybRecordAvailable",
      ),

      representativeIdAvailable: checked(
        formData,
        "representativeIdAvailable",
      ),

      authorityDocumentAvailable: checked(
        formData,
        "authorityDocumentAvailable",
      ),

      specialComplianceRequirements: inputValue(
        formData,
        "specialComplianceRequirements",
      ),

      specialComplianceDetail: inputValue(
        formData,
        "specialComplianceDetail",
      ),

      /* V4 — Authorized Submission */

      authorizedSubmitterEntity: inputValue(
        formData,
        "authorizedSubmitterEntity",
      ),

      authorizedSubmitterRepresentative: inputValue(
        formData,
        "authorizedSubmitterRepresentative",
      ),

      authorizedSubmitterPosition: inputValue(
        formData,
        "authorizedSubmitterPosition",
      ),

      authorizedSubmissionDate: inputValue(
        formData,
        "authorizedSubmissionDate",
      ),
    };

    if (
      !payload.submitterName ||
      !payload.submitterEmail ||
      !payload.submitterRole
    ) {
      setSubmitState({
        status: "error",
        message:
          "Please provide the authorized submitter's name, email, and role.",
      });
      return;
    }

    if (!payload.buyerName) {
      setSubmitState({
        status: "error",
        message:
          "Please identify the principal purchasing entity.",
      });
      return;
    }

    if (
      !payload.declarationAccuracy ||
      !payload.declarationNoObligation ||
      !payload.declarationNoCommission
    ) {
      setSubmitState({
        status: "error",
        message:
          "Please confirm all required submission declarations.",
      });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch(
        "/api/transaction-intake",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.ok) {
        setSubmitState({
          status: "error",
          message:
            data?.error ||
            `Unable to submit transaction intake. Server returned ${response.status}.`,
        });
        return;
      }

      const reference = data?.intake?.reference;

      if (!reference) {
        setSubmitState({
          status: "error",
          message:
            "The intake was submitted but no reference was returned.",
        });
        return;
      }

      setSubmitState({
        status: "success",
        reference,
      });
    } catch (error) {
      console.error(
        "[transaction-intake:submit]",
        error,
      );

      setSubmitState({
        status: "error",
        message:
          "Unable to submit transaction intake. Please try again or contact French-Ward.",
      });
    }
  }

  if (submitState.status === "success") {
    return (
      <section className={styles.successCard}>
        <p className={styles.stageCode}>
          Submission Received
        </p>

        <h2>
          Transaction intake received for review.
        </h2>

        <p>
          Retain the following controlled intake
          reference:
        </p>

        <div className={styles.reference}>
          {submitState.reference}
        </div>

        <p className={styles.muted}>
          Status: Submitted for Review. Receipt does
          not constitute acceptance, allocation,
          contract formation, mandate recognition,
          commission recognition, or confirmation of
          supply.
        </p>
      </section>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={onSubmit}
    >
      {/* 01 — STATUS */}

      <section
        className={styles.section}
        id="status"
      >
        <header className={styles.sectionHeader}>
          <span>01</span>

          <div>
            <p className={styles.stageCode}>
              Instrument Status
            </p>
            <h2>
              Controlled Commercial Intake
            </h2>
          </div>
        </header>

        <div className={styles.instrumentNotice}>
          <p>
            This instrument records preliminary
            commercial intent for internal review and
            transaction qualification.
          </p>

          <p>
            Submission does not reserve commodity,
            establish allocation, confirm commercial
            terms, create agency or mandate authority,
            recognize compensation rights, guarantee
            supply, or constitute a definitive
            agreement.
          </p>
        </div>

        <div className={styles.progression}>
          <span>Submission</span>
          <i>→</i>
          <span>Review</span>
          <i>→</i>
          <span>Qualification</span>
          <i>→</i>
          <span>Dossier</span>
          <i>→</i>
          <span>Execution</span>
        </div>

        <div className={styles.grid}>
          <label>
            Program
            <select
              name="program"
              defaultValue={initialProgram}
            >
              <option value="">
                Select program
              </option>

              {programOptions.map((program) => (
                <option
                  key={program}
                  value={program}
                >
                  {program}
                </option>
              ))}
            </select>
          </label>

          <label>
            Referral code
            <input
              name="referralCode"
              defaultValue={initialReferralCode}
            />
          </label>

          <label>
            Issuing / referring representative
            <input
              name="referredByName"
              defaultValue={
                initialRepresentativeName
              }
            />
          </label>

          <label>
            Representative organization
            <input name="referredByCompany" />
          </label>

          <label>
            Representative email
            <input
              name="referredByEmail"
              type="email"
            />
          </label>

          <label>
            Representative capacity
            <input
              name="referredByRole"
              placeholder="Introducer, mandate, coordinator..."
            />
          </label>
        </div>
      </section>

      {/* 02 — COUNTERPARTY */}

      <section
        className={styles.section}
        id="counterparty"
      >
        <header className={styles.sectionHeader}>
          <span>02</span>

          <div>
            <p className={styles.stageCode}>
              Counterparty
            </p>
            <h2>
              Identity & Authority
            </h2>
          </div>
        </header>

        <h3 className={styles.subheading}>
          Principal Purchasing Entity
        </h3>

        <div className={styles.grid}>
          <label className={styles.wide}>
            Full legal name *
            <input
              name="buyerName"
              required
              value={buyerName}
              onChange={(event) =>
                setBuyerName(event.target.value)
              }
            />
            <span className={styles.fieldHelp}>
              Enter the purchasing entity exactly as it
              appears in its corporate or registration
              records.
            </span>
          </label>

          <label>
            Registration / incorporation number
            <input name="buyerRegistrationNumber" />
          </label>

          <label>
            Country of incorporation
            <input name="buyerCountryOfIncorporation" />
          </label>

          <label className={styles.wide}>
            Registered address
            <input name="buyerRegisteredAddress" />
          </label>

          <label className={styles.wide}>
            Principal business address
            <input name="buyerBusinessAddress" />
          </label>

          <label>
            Corporate email
            <input
              name="buyerCorporateEmail"
              type="email"
            />
          </label>

          <label>
            Corporate telephone
            <input name="buyerCorporatePhone" />
          </label>
        </div>

        <h3 className={styles.subheading}>
          Authorized Buyer Representative
        </h3>

        <div className={styles.grid}>
          <label>
            Full legal name
            <input
              name="buyerRepresentativeName"
              value={buyerRepresentativeName}
              onChange={(event) =>
                setBuyerRepresentativeName(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Position / title
            <input name="buyerRepresentativeTitle" />
          </label>

          <label>
            Represented entity
            <input name="buyerRepresentativeEntity" />
          </label>

          <label>
            Relationship to transaction
            <input name="buyerRepresentativeRelationship" />
          </label>

          <label>
            Email
            <input
              name="buyerRepresentativeEmail"
              type="email"
            />
          </label>

          <label>
            Telephone / WhatsApp
            <input name="buyerRepresentativePhone" />
          </label>
        </div>

        <div className={styles.choiceBlock}>
          <p className={styles.choiceLabel}>
            Authority / Capacity
          </p>

          <p className={styles.choiceHelp}>
            Identify what the representative is actually
            empowered to do on behalf of the purchasing
            entity. Representation, negotiation, and
            signature authority are separate capacities.
          </p>

          <div className={styles.checkboxGrid}>
            <label className={styles.checkbox}>
              <input
                name="authorityToRepresent"
                type="checkbox"
              />
              Authorized to represent purchasing
              entity
            </label>

            <label className={styles.checkbox}>
              <input
                name="authorityToNegotiate"
                type="checkbox"
              />
              Authorized to negotiate commercial
              terms
            </label>

            <label className={styles.checkbox}>
              <input
                name="authorityToSign"
                type="checkbox"
              />
              Authorized signatory
            </label>
          </div>

          <label>
            Other authority / limitation
            <input name="authorityOther" />
          </label>
        </div>

        <h3 className={styles.subheading}>
          External Participant
        </h3>

        <p className={styles.helper}>
          Identify a mandate, introducer, advisor,
          consultant, external coordinator, or other
          material participant if applicable.
        </p>

        <div className={styles.grid}>
          <label>
            Full name
            <input name="externalParticipantName" />
          </label>

          <label>
            Organization
            <input name="externalParticipantOrganization" />
          </label>

          <label>
            Role / capacity
            <input name="externalParticipantRole" />
          </label>

          <label>
            Email
            <input
              name="externalParticipantEmail"
              type="email"
            />
          </label>
        </div>
      </section>

      {/* 03 — TRANSACTION */}

      <section
        className={styles.section}
        id="transaction"
      >
        <header className={styles.sectionHeader}>
          <span>03</span>

          <div>
            <p className={styles.stageCode}>
              Proposed Transaction
            </p>
            <h2>
              Commercial Profile
            </h2>
          </div>
        </header>

        <div className={styles.grid}>
          <label>
            Commodity
            <input
              name="commodity"
              defaultValue="Gold Doré Bars"
            />
          </label>

          <label>
            Requested purity / fineness
            <input
              name="requestedPurity"
              placeholder="Example: 96%+ / 960 fineness"
            />
          </label>

          <label>
            Initial / total quantity
            <input
              name="quantity"
              placeholder="Example: 500 KG"
            />
          </label>

          <label>
            Trial / initial tranche
            <input
              name="trialQuantity"
              placeholder="Example: 50 KG"
            />
          </label>

          <label>
            Transaction purpose
            <select
              name="transactionPurpose"
              defaultValue=""
            >
              <option value="">
                Select purpose
              </option>

              {transactionPurposeOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Transaction window
            <input
              name="transactionWindow"
              placeholder="Immediate, 7 days, 30 days..."
            />
            <span className={styles.fieldHelp}>
              State the buyer's realistic intended
              timing for initial execution or progression.
            </span>
          </label>

          <label>
            Origin / source jurisdiction
            <input name="origin" />
          </label>

          <label>
            Destination
            <input name="destination" />
          </label>

          <label>
            Destination status
            <input
              name="destinationStatus"
              placeholder="Confirmed, proposed, TBD..."
            />
            <span className={styles.fieldHelp}>
              Indicate whether the receiving destination
              or facility is confirmed, proposed, or
              still under evaluation.
            </span>
          </label>

          <label>
            Continuing supply
            <select
              name="continuingSupplyIntent"
              value={continuingSupplyIntent}
              onChange={(event) =>
                setContinuingSupplyIntent(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select status
              </option>
              <option value="Yes">
                Yes
              </option>
              <option value="No">
                No
              </option>
              <option value="Under consideration">
                Under consideration
              </option>
            </select>
            <span className={styles.fieldHelp}>
              Select Yes or Under consideration if the
              proposed relationship may continue beyond
              the initial transaction.
            </span>
          </label>

          {(continuingSupplyIntent === "Yes" ||
            continuingSupplyIntent ===
              "Under consideration") && (
            <div className={styles.conditionalGroup}>
              <p className={styles.conditionalLabel}>
                Continuing Supply Profile
              </p>

              <div className={styles.conditionalGrid}>
                <label>
                  Recurring quantity
                  <input
                    name="recurringQuantity"
                    placeholder="Example: 100 KG"
                  />
                </label>

                <label>
                  Frequency
                  <input
                    name="recurringFrequency"
                    placeholder="Monthly, quarterly..."
                  />
                </label>

                <label>
                  Desired term
                  <input
                    name="desiredTerm"
                    placeholder="Example: 12 months"
                  />
                </label>
              </div>
            </div>
          )}

          <label className={styles.wide}>
            Buyer-specific requirements
            <textarea
              name="buyerRequirements"
              rows={4}
            />
          </label>
        </div>
      </section>

      {/* 04 — DELIVERY */}

      <section
        className={styles.section}
        id="delivery"
      >
        <header className={styles.sectionHeader}>
          <span>04</span>

          <div>
            <p className={styles.stageCode}>
              Delivery
            </p>
            <h2>
              Logistics & Assay Architecture
            </h2>
          </div>
        </header>

        <p className={styles.helper}>
          Delivery and assay describe different
          conditions. Identify both how the commodity
          is expected to move or be handed over and how
          final quality will be established.
        </p>

        <div className={styles.grid}>
          <label className={styles.wide}>
            Preferred delivery pathway
            <select
              name="deliveryPathway"
              defaultValue=""
            >
              <option value="">
                Select pathway
              </option>

              {deliveryPathwayOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className={styles.wide}>
            Delivery point / port / facility
            <input name="deliveryPoint" />
          </label>

          <label>
            Buyer representatives present
            <select
              name="buyerRepresentativesPresent"
              defaultValue=""
            >
              <option value="">
                Select
              </option>
              <option value="Yes">
                Yes
              </option>
              <option value="No">
                No
              </option>
              <option value="To be confirmed">
                To be confirmed
              </option>
            </select>
          </label>

          <label>
            Representative 1
            <input name="buyerRepresentative1" />
          </label>

          <label>
            Representative 2
            <input name="buyerRepresentative2" />
          </label>

          <label>
            Preferred refinery / assay facility
            <input name="refineryPreference" />
          </label>

          <label>
            Refinery jurisdiction
            <input name="refineryJurisdiction" />
          </label>

          <label className={styles.wide}>
            Assay posture
            <select
              name="assayPosture"
              defaultValue=""
            >
              <option value="">
                Select assay posture
              </option>

              {assayPostureOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className={styles.wide}>
            Additional assay / refinery requirements
            <textarea
              name="additionalAssayRequirements"
              rows={4}
            />
          </label>
        </div>
      </section>

      {/* 05 — SETTLEMENT */}

      <section
        className={styles.section}
        id="settlement"
      >
        <header className={styles.sectionHeader}>
          <span>05</span>

          <div>
            <p className={styles.stageCode}>
              Settlement
            </p>
            <h2>
              Financial Capacity & Settlement
            </h2>
          </div>
        </header>

        <p className={styles.helper}>
          Record the buyer's proposed settlement
          architecture. Selection of a pathway, rail,
          currency, or asset does not constitute
          acceptance of that method by French-Ward.
        </p>

        <div className={styles.grid}>
          <label>
            Settlement pathway
            <select
              name="settlementPathway"
              defaultValue=""
            >
              <option value="">
                Select pathway
              </option>

              {settlementPathwayOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Settlement rail
            <select
              name="settlementRail"
              value={settlementRail}
              onChange={(event) =>
                setSettlementRail(event.target.value)
              }
            >
              <option value="">
                Select rail
              </option>

              {settlementRailOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ),
              )}
            </select>
            <span className={styles.fieldHelp}>
              The rail is the mechanism through which
              settlement is expected to move, distinct
              from the commercial settlement pathway.
            </span>
          </label>

          <label>
            Settlement currency / asset
            <input
              name="settlementCurrencyAsset"
              placeholder="USD, USDT..."
            />
          </label>

          <label>
            Settlement timing / requirement
            <input name="settlementTimingRequirement" />
          </label>

          <label>
            Bank message / payment format
            <input
              name="bankMessageFormat"
              placeholder="MT103, ISO 20022 pacs.008..."
            />
          </label>

          {(settlementRail === "Digital asset" ||
            settlementRail ===
              "Bank transfer + digital asset") && (
            <div className={styles.conditionalGroup}>
              <p className={styles.conditionalLabel}>
                Digital Settlement Coordinates
              </p>

              <div className={styles.conditionalGrid}>
                <label>
                  Digital asset
                  <input
                    name="digitalAsset"
                    placeholder="USDT, USDC..."
                  />
                </label>

                <label>
                  Blockchain / network
                  <input
                    name="digitalAssetNetwork"
                    placeholder="Ethereum, Tron..."
                  />
                </label>
              </div>
            </div>
          )}

          <label>
            Additional settlement authority required?
            <select
              name="additionalSettlementAuthorityRequired"
              value={
                additionalSettlementAuthorityRequired
              }
              onChange={(event) =>
                setAdditionalSettlementAuthorityRequired(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select
              </option>
              <option value="Yes">
                Yes
              </option>
              <option value="No">
                No
              </option>
              <option value="Unknown">
                Unknown
              </option>
            </select>
            <span className={styles.fieldHelp}>
              Examples include a bank, escrow manager,
              custodian, refinery, treasury authority,
              or other required approver.
            </span>
          </label>

          {additionalSettlementAuthorityRequired ===
            "Yes" && (
            <label className={styles.wide}>
              Additional settlement authority /
              institution
              <input
                name="additionalSettlementAuthorityDetail"
              />
            </label>
          )}

          <label className={styles.wide}>
            Financial capacity
            <select
              name="financialCapacityStatus"
              defaultValue=""
            >
              <option value="">
                Select status
              </option>

              {financialCapacityOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ),
              )}
            </select>
            <span className={styles.fieldHelp}>
              This records whether evidence of financial
              capacity can be made available during
              review. It does not request transfer of
              funds through this form.
            </span>
          </label>
        </div>
      </section>

      {/* 06 — READINESS */}

      <section
        className={styles.section}
        id="readiness"
      >
        <header className={styles.sectionHeader}>
          <span>06</span>

          <div>
            <p className={styles.stageCode}>
              Readiness
            </p>
            <h2>
              Compliance & Documentary Readiness
            </h2>
          </div>
        </header>

        <p className={styles.helper}>
          Indicate materials presently available.
          Mark a record available only if it can be
          produced during review. Availability does
          not mean that French-Ward has verified or
          approved the record. Additional KYC, KYB,
          banking, authority, regulatory, refinery,
          customs, or import records may be requested.
        </p>

        <div className={styles.checkboxGrid}>
          <label className={styles.checkbox}>
            <input
              name="incorporationRecordAvailable"
              type="checkbox"
            />
            Certificate / incorporation record
            available
          </label>

          <label className={styles.checkbox}>
            <input
              name="kybRecordAvailable"
              type="checkbox"
            />
            Corporate information / KYB available
          </label>

          <label className={styles.checkbox}>
            <input
              name="representativeIdAvailable"
              type="checkbox"
            />
            Authorized representative ID available
          </label>

          <label className={styles.checkbox}>
            <input
              name="authorityDocumentAvailable"
              type="checkbox"
            />
            Mandate / authority documentation
            available
          </label>
        </div>

        <div className={styles.grid}>
          <label>
            Special compliance requirements
            <input
              name="specialComplianceRequirements"
              placeholder="Banking, customs, import, refinery..."
            />
          </label>

          <label className={styles.wide}>
            Compliance / documentary detail
            <textarea
              name="specialComplianceDetail"
              rows={5}
            />
          </label>
        </div>
      </section>

      {/* 07 — SUBMISSION */}

      <section
        className={styles.section}
        id="submission"
      >
        <header className={styles.sectionHeader}>
          <span>07</span>

          <div>
            <p className={styles.stageCode}>
              Submission
            </p>
            <h2>
              Declaration & Authorization
            </h2>
          </div>
        </header>

        <div className={styles.grid}>
          <label>
            Authorized submitter full name *
            <input
              name="submitterName"
              required
            />
          </label>

          <label>
            Position / title
            <input name="authorizedSubmitterPosition" />
          </label>

          <label>
            Submitter email *
            <input
              name="submitterEmail"
              type="email"
              required
            />
          </label>

          <label>
            Telephone / WhatsApp
            <input name="submitterPhone" />
          </label>

          <label>
            Submitter role *
            <select
              name="submitterRole"
              required
              defaultValue=""
            >
              <option
                value=""
                disabled
              >
                Select role
              </option>

              {roleOptions.map((role) => (
                <option
                  key={role}
                  value={role}
                >
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label>
            Submitter company
            <input name="submitterCompany" />
          </label>

          <label>
            Country / jurisdiction
            <input name="submitterCountry" />
          </label>

          <label>
            Purchasing entity
            <input
              name="authorizedSubmitterEntity"
              value={buyerName}
              readOnly
            />
            <span className={styles.fieldHelp}>
              Carried forward automatically from the
              Principal Purchasing Entity above.
            </span>
          </label>

          <label>
            Authorized representative
            <input
              name="authorizedSubmitterRepresentative"
              value={buyerRepresentativeName}
              readOnly
            />
            <span className={styles.fieldHelp}>
              Carried forward automatically from the
              Authorized Buyer Representative above.
            </span>
          </label>

          <label>
            Submission date
            <input
              name="authorizedSubmissionDate"
              type="date"
            />
          </label>
        </div>

        <div className={styles.declarations}>
          <label className={styles.checkbox}>
            <input
              name="declarationAccuracy"
              type="checkbox"
              required
            />
            I confirm that the information supplied
            through this instrument is accurate to the
            best of my knowledge and that my authority
            or relationship to the proposed transaction
            has been accurately represented.
          </label>

          <label className={styles.checkbox}>
            <input
              name="declarationNoObligation"
              type="checkbox"
              required
            />
            I understand that this submission is a
            preliminary commercial intake only and
            does not create acceptance, allocation,
            contract formation, mandate recognition,
            agency authority, confirmation of supply,
            or obligation by French-Ward, Inc.
          </label>

          <label className={styles.checkbox}>
            <input
              name="declarationNoCommission"
              type="checkbox"
              required
            />
            I understand that disclosure of referral,
            mandate, representative, or external-party
            information does not itself establish or
            guarantee compensation, commission, or
            mandate rights.
          </label>
        </div>
      </section>

      {submitState.status === "error" && (
        <div className={styles.error}>
          {submitState.message}
        </div>
      )}

      <div className={styles.submitArea}>
        <div>
          <p className={styles.stageCode}>
            Controlled Intake / V4
          </p>
          <p className={styles.submitNote}>
            Submission places this instrument into
            French-Ward preliminary commercial review.
          </p>
        </div>

        <button
          className={styles.submit}
          type="submit"
          disabled={
            submitState.status === "submitting"
          }
        >
          {submitState.status === "submitting"
            ? "Submitting..."
            : "Submit for Review"}
        </button>
      </div>
    </form>
  );
}
