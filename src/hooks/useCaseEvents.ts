import { useEffect } from "react"

export function useCaseEvents(onEvent: (event:any)=>void) {

  useEffect(()=>{

    const es = new EventSource("/api/cases/events")

    es.onmessage = (msg)=>{
      const data = JSON.parse(msg.data)
      onEvent(data)
    }

    return ()=> es.close()

  },[])

}