;; Rights Holder Verification Contract
;; This contract validates legitimate IP owners

(define-data-var admin principal tx-sender)

;; Data structure for rights holders
(define-map rights-holders
  { address: principal }
  {
    verified: bool,
    verification-date: uint,
    verification-method: (string-utf8 50)
  }
)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-VERIFIED (err u101))
(define-constant ERR-NOT-FOUND (err u102))

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Set a new admin
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (ok (var-set admin new-admin))
  )
)

;; Verify a rights holder
(define-public (verify-rights-holder
  (address principal)
  (verification-method (string-utf8 50)))
  (begin
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? rights-holders {address: address})) ERR-ALREADY-VERIFIED)
    (map-set rights-holders
      {address: address}
      {
        verified: true,
        verification-date: block-height,
        verification-method: verification-method
      }
    )
    (ok true)
  )
)

;; Revoke verification
(define-public (revoke-verification (address principal))
  (begin
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (asserts! (is-some (map-get? rights-holders {address: address})) ERR-NOT-FOUND)
    (map-delete rights-holders {address: address})
    (ok true)
  )
)

;; Check if an address is a verified rights holder
(define-read-only (is-verified-rights-holder (address principal))
  (match (map-get? rights-holders {address: address})
    holder (ok (get verified holder))
    (ok false)
  )
)

;; Get verification details
(define-read-only (get-verification-details (address principal))
  (map-get? rights-holders {address: address})
)
