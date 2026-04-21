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
            <div className="flex items-center gap-2 text-rose-500 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">
                <i className="fas fa-circle text-[6px]" /> Event Ended
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 sm:gap-3 select-none">
            <div className="flex flex-col items-center">
                <span className="text-base sm:text-xl font-black text-slate-900 leading-none tabular-nums tracking-tighter">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">days</span>
            </div>
            <div className="text-slate-200 font-light mb-4 text-lg">:</div>
            <div className="flex flex-col items-center">
                <span className="text-base sm:text-xl font-black text-slate-900 leading-none tabular-nums tracking-tighter">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">hrs</span>
            </div>
            <div className="text-slate-200 font-light mb-4 text-lg">:</div>
            <div className="flex flex-col items-center">
                <span className="text-base sm:text-xl font-black text-slate-900 leading-none tabular-nums tracking-tighter">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">min</span>
            </div>
            <div className="text-slate-200 font-light mb-4 text-lg">:</div>
            <div className="flex flex-col items-center">
                <span className="text-base sm:text-xl font-black text-cyan-600 leading-none animate-pulse tabular-nums tracking-tighter">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[7px] font-black text-cyan-500/50 uppercase tracking-widest mt-1">sec</span>
            </div>
        </div>
    );
};

export default CountdownTimer;
