"use client"

import { useEffect, useState } from "react"

export default function ActivityFeed() {

  const [events,setEvents] = useState<any[]>([])

  useEffect(()=>{

    fetch("/api/admin/activity")
      .then(r=>r.json())
      .then(setEvents)

  },[])

  return (

    <div className="activityFeed">

      <h2>Activity Feed</h2>

      {events.map(e=>(
        <div key={e.id} className="activityRow">

          <div>{e.type}</div>

          <div>{new Date(e.createdAt).toLocaleString()}</div>

        </div>
      ))}

    </div>

  )

}