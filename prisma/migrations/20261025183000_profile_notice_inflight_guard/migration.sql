-- Only one unresolved delivery attempt may exist per Profile grant.
-- ACCEPTED and FAILED records remain available as immutable history.
-- DELIVERY_UNKNOWN remains blocked until explicitly reconciled.

CREATE UNIQUE INDEX
  "ProfileAccessNoticeDelivery_one_unresolved_per_grant"
ON "ProfileAccessNoticeDelivery" ("grantId")
WHERE "status" IN ('SENDING', 'DELIVERY_UNKNOWN');
