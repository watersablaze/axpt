/** Canonical publication content. No issuance, access or settlement side effects. */
export const frenchWardTransactionOverview = {
  "reference": "FW-TOV-2026-001",
  "referenceStatus": "French-Ward commercial paper reference",
  "version": 1,
  "issuer": "French-Ward, Inc.",
  "title": "Gold Supply & Transaction Overview",
  "classification": "Standing Commercial Procedure",
  "preparationDate": "20 October 2026",
  "status": "Approved for representative use",
  "orientation": "From qualified inquiry to refinery settlement. The standing procedure for gold doré transactions through French-Ward and Coopérative de Bafoula.",
  "sections": [
    {
      "id": "supply-commercial-standing",
      "title": "Supply & commercial standing",
      "paragraphs": [
        "French-Ward, Inc. supplies Malian gold doré through its documented reseller and custodial relationship with Coopérative de Bafoula. French-Ward contracts as commercial principal for transactions established in its name; the Cooperative retains its source-side rights and authority under the governing instruments.",
        "Gold doré bars · Mali · minimum 96% Au. Quantity, lot particulars and available preliminary assay records are confirmed per transaction. Payable gold is determined by final assay at the agreed receiving refinery.",
        "Source, origin, authority and applicable compliance and sanctions requirements are verified through transaction-specific review."
      ]
    },
    {
      "id": "commercial-pricing-representation",
      "title": "Commercial pricing & representation",
      "paragraphs": [
        "Price is calculated from an identified LBMA Gold Price benchmark, less the agreed transaction discount, on final-assay payable gold. The commercial schedule fixes the benchmark, currency, calculation and adjustments.",
        "Seller-side compensation is governed by separate French-Ward instruments. The Buyer bears its own facilitation costs unless French-Ward agrees otherwise in writing; these do not reduce the price payable to French-Ward. This overview provides no standing buyer-side allowance."
      ]
    },
    {
      "id": "standard-transaction-procedure",
      "title": "Standard transaction procedure",
      "paragraphs": [
        "01 | Proper inquiry. Buyer submits corporate identity, authorized contact, requested quantity (minimum 50 KG initial tranche), destination or receiving refinery, and commercial requirements through designated intake.",
        "02 | Qualification. French-Ward reviews buyer identity, authority, capacity and supporting evidence; source documentation and applicable compliance requirements are addressed before proceeding.",
        "03 | Documentary agreement. Parties execute the governing Sales and Purchase Agreement and commercial schedule establishing product, quantity, price, activation funding, delivery, assay, settlement and responsibilities.",
        "04 | Good-Faith TAP & activation. Following qualification and executed documents, Buyer provides a Good-Faith TAP, ordinarily 7.5% of agreed transaction reference value, for activation and authorized export preparation. French-Ward confirms activation only after payment verification and recognition.",
        "The agreement specifies the TAP reference-value basis, conditions, permitted uses, evidence, reconciliation and noncompletion treatment. The full recognized TAP is credited against the final settlement balance payable by Buyer upon completion of the transaction.",
        "05 | Export passage. Governmental and fiscal obligations, permits, records, custody and transport arrangements are completed. The Cooperative then prepares export release and international transit; Buyer receives progress updates.",
        "06 | Refinery receipt & final assay. After destination clearance, the shipment reaches the mutually accepted refinery for weighing, sampling and final assay. The agreement addresses assay discrepancies and below-specification results.",
        "07 | Settlement & release. Final invoice applies agreed price to assay-determined payable metal, credits the full recognized TAP and records adjustments and balance due. Payment recognition, title transfer and release follow the agreement and authenticated instructions."
      ]
    },
    {
      "id": "taxes-documentary-support",
      "title": "Taxes & documentary support",
      "paragraphs": [
        "Actual applicable taxes, duties, permits and export obligations must be met before lawful dispatch. Governing documents allocate responsibility, funding, timing and evidence. TAP is a commercial activation contribution—not a government tax rate.",
        "Supporting records include source/origin and authority evidence, invoice, export/fiscal documents, transport and customs records, assay and insurance evidence. TAP-funded charges are reconciled without duplicating Buyer obligations."
      ]
    },
    {
      "id": "complimentary-shipping-custody-risk",
      "title": "Complimentary shipping, custody & risk",
      "paragraphs": [
        "Complimentary shipping uses Bafoula’s established export/delivery process and Turkish Airlines on applicable routes, coordinated to the receiving refinery. Authorized representatives accompany the commodity under agreed custody arrangements.",
        "Transaction documents specify destination, insurance, clearance, handling and shipment schedule. Release for international transit is ordinarily anticipated approximately 3–5 business days after export and pre-dispatch conditions are met—not guaranteed refinery arrival.",
        "Default risk of loss transfers from Seller to Buyer on completion of agreed final assay at the designated refinery. The agreement defines that event and aligns insurance and delivery terms. Title transfer and release follow separate settlement provisions."
      ]
    },
    {
      "id": "governing-documents-instructions",
      "title": "Governing documents & instructions",
      "paragraphs": [
        "This standing overview does not reserve product or authorize payment. Quantity, discount, calculation, funding and any variation are established by the particular offer and executed agreement.",
        "Payment instructions use French-Ward’s authenticated channel. Representatives may circulate approved materials within written authority but may not alter terms, payment destinations or institutional commitments."
      ]
    }
  ]
} as const;
export type FrenchWardTransactionOverview = typeof frenchWardTransactionOverview;
