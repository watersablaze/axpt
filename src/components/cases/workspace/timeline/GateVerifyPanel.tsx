import React from "react"

type Props = {
  gateId: string
  onVerify: (gateId:string)=>void
  onReject: (gateId:string)=>void
}

export default function GateVerifyPanel({gateId,onVerify,onReject}:Props){

  return (
    <div className="gateVerifyPanel">

      <h3>Gate Verification</h3>

      <div className="actions">

        <button
          onClick={()=>onVerify(gateId)}
        >
          Approve Gate
        </button>

        <button
          onClick={()=>onReject(gateId)}
        >
          Reject Gate
        </button>

      </div>

    </div>
  )
}