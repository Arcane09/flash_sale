import { useEffect, useState } from 'react';

function getRemainingSeconds(target) {
  const now = Date.now();
  const end = typeof target === 'string' ? Date.parse(target) : target;
  return Math.max(0, Math.floor((end - now) / 1000));
}

export default function Countdown({ to, onExpire }) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(to));

  useEffect(() => {
    setRemaining(getRemainingSeconds(to));
    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(id);
          if (onExpire) onExpire();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [to, onExpire]);

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  let display = '';

  if (days >= 1) {
    // More than a day left: show Dd HH:MM:SS
    display = `${days}d ${String(hours).padStart(2, '0')}:${String(
      minutes
    ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (hours >= 1) {
    // More than an hour but less than a day: show HH:MM
    display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}`;
  } else {
    // Under an hour: show MM:SS
    display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}`;
  }

  return (
    <span className={remaining === 0 ? 'text-red-400' : 'text-emerald-400'}>
      {display}
    </span>
  );
}


