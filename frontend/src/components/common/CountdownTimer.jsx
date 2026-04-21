import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate, onEnd }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
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
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                <i className="fas fa-clock-rotate-left" /> Ended
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 sm:gap-4 bg-white/50 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white/50 shadow-sm">
            <div className="flex flex-col items-center">
                <span className="text-sm sm:text-base font-black text-slate-900 leading-none tabular-nums">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-1">Days</span>
            </div>
            <div className="text-slate-300 font-bold mb-3 animate-pulse">:</div>
            <div className="flex flex-col items-center">
                <span className="text-sm sm:text-base font-black text-slate-900 leading-none tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-1">Hrs</span>
            </div>
            <div className="text-slate-300 font-bold mb-3 animate-pulse">:</div>
            <div className="flex flex-col items-center">
                <span className="text-sm sm:text-base font-black text-slate-900 leading-none tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-1">Min</span>
            </div>
            <div className="text-slate-300 font-bold mb-3 animate-pulse">:</div>
            <div className="flex flex-col items-center">
                <span className="text-sm sm:text-base font-black text-cyan-600 leading-none animate-pulse tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[7px] font-black text-cyan-400/60 uppercase tracking-tighter mt-1">Sec</span>
            </div>
        </div>
    );
};

export default CountdownTimer;
