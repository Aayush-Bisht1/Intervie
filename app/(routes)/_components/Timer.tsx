"use client"
import React, { useEffect, useState } from 'react'

type State = {
    seconds: number,
}

const t: number = Number(process.env.TIMER ?? 0);

function Timer() {
    const [timer, setTimer] = useState<State>({
        seconds: t
    })
    useEffect(() => {
        setTimeout(() => {
            let newTime = timer
            newTime.seconds = timer.seconds - 1;
            setTimer(newTime)
        }, 1000)
    }, [timer])
    return (
        <div>
            {
                timer.seconds == 0 ? <h2>Time Ended</h2> : <h2>{Math.floor(timer.seconds / 60)} : {timer.seconds % 60}</h2>
            }
        </div>
    )
}

export default Timer