import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate, onEnd }) => {
    const calculateTimeLeft = () => {
        // targetDate is passed as "YYYY-MM-DDTHH:mm:ss"
        // We need to parse it carefully to avoid timezone shifts
        const [datePart, timePart] = (targetDate || "").split('T');
        if (!datePart || !timePart) return {};

        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);

        // Create target in LOCAL time because that's what the user expects when they enter "17:50"
        const target = new Date(year, month - 1, day, hour, minute, second || 0);
        const difference = +target - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const updatedTime = calculateTimeLeft();
            setTimeLeft(updatedTime);

            if (Object.keys(updatedTime).length === 0) {
                clearInterval(timer);
                if (onEnd) onEnd();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const isEnded = Object.keys(timeLeft).length === 0;

    if (isEnded) {
        return (
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                Ended
            </span>
        );
    }

    return (
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] sm:text-xs tracking-tight">
            <span className="opacity-60">Ends in:</span>
            <div className="flex items-center gap-1 text-slate-700 font-bold tabular-nums">
                {timeLeft.days > 0 && (
                    <span>{timeLeft.days}d</span>
                )}
                <span>{timeLeft.hours}h</span>
                <span>{timeLeft.minutes}m</span>
                <span className="text-cyan-500 w-6">{timeLeft.seconds}s</span>
            </div>
        </div>
    );
};

export default CountdownTimer;
