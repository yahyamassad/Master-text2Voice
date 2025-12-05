
import React from 'react';

// A helper type for icons that can be styled with a className.
interface IconProps {
  className?: string;
  animate?: boolean;
}

// A helper function to safely combine class names.
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function SpeakerIcon({ className }: IconProps) {
  return (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-6 w-6", className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
    />
  </svg>
  );
}

function SoundWaveIcon({ className, animate = false }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)} 
        viewBox="0 0 24 24" 
        fill="currentColor"
    >
        <style>{`
            .wave-bar { 
                transform: scaleY(0.4);
            }
            .animating .wave-bar { 
                animation: wave 1.2s infinite ease-in-out; 
            }
            .animating .wave-bar:nth-child(2) { animation-delay: -1.0s; }
            .animating .wave-bar:nth-child(3) { animation-delay: -0.8s; }
            .animating .wave-bar:nth-child(4) { animation-delay: -0.6s; }
            @keyframes wave {
                0%, 40%, 100% { transform: scaleY(0.4); }
                20% { transform: scaleY(1.0); }
            }
        `}</style>
        <g className={animate ? "animating" : ""}>
            <rect className="wave-bar" x="4" y="4" width="2" height="16" rx="1" transform-origin="center" />
            <rect className="wave-bar" x="9" y="4" width="2" height="16" rx="1" transform-origin="center" />
            <rect className="wave-bar" x="14" y="4" width="2" height="16" rx="1" transform-origin="center" />
            <rect className="wave-bar" x="19" y="4" width="2" height="16" rx="1" transform-origin="center" />
        </g>
    </svg>
    );
}


function LoaderIcon({ className }: IconProps) {
  return (
  <svg
    className={cn("animate-spin h-6 w-6 text-white", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
  );
}

function DownloadIcon({ className }: IconProps) {
  return (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={cn("h-6 w-6", className)}
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
    />
  </svg>
  );
}

function TranslateIcon({ className }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M3 5h12M9 3v2m4 13-4-4m0 0-4 4m4-4v12M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
    </svg>
    );
}

function StopIcon({ className }: IconProps) {
  return (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-6 w-6", className)}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h9a3 3 0 003-3v-9a3 3 0 00-3-3h-9z"
      clipRule="evenodd"
    />
  </svg>
  );
}

function PauseIcon({ className }: IconProps) {
    return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
    );
}

const StarIcon: React.FC<IconProps> = ({ className }) => {
  return (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={cn('h-5 w-5', className)}
    viewBox="0 0 24 24" 
    fill="currentColor" 
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
  );
};

function CopyIcon({ className }: IconProps) {
  return (
  <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
  <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
  );
}

function ExternalLinkIcon({ className }: IconProps) {
  return (
  <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-4 w-4 inline-block mx-1', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
  );
}

function ChevronDownIcon({ className }: IconProps) {
  return (
  <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
  );
}

function GlobeIcon({ className }: IconProps) {
  return (
  <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m0 0a9 9 0 019-9m-9 9a9 9 0 009 9" />
  </svg>
  );
}

function ReplayIcon({ className }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" 
        />
    </svg>
    );
}

function SwapIcon({ className }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
        />
    </svg>
    );
}

function MicrophoneIcon({ className }: IconProps) {
  return (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
    <path d="M17 11h-1c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92z" />
  </svg>
  );
}

function GearIcon({ className }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
        />
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
        />
    </svg>
    );
}

function HistoryIcon({ className }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
    </svg>
    );
}

function LinkIcon({ className }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
        />
    </svg>
    );
}

function ShareIcon({ className }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" 
        />
    </svg>
    );
}

function InfoIcon({ className }: IconProps) {
    return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    );
}

function PlayCircleIcon({ className }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)} 
        viewBox="0 0 24 24" 
        fill="currentColor"
    >
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v8a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z" clipRule="evenodd" />
    </svg>
    );
}

function VideoCameraIcon({ className }: IconProps) {
    return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function WarningIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function TrashIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function SoundEnhanceIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

function ReportIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function LockIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function SparklesIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function WandIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function SawtliLogoIcon({ className }: IconProps) {
    return (
        <svg 
            version="1.1" 
            xmlns="http://www.w3.org/2000/svg" 
            xmlnsXlink="http://www.w3.org/1999/xlink" 
            x="0px" 
            y="0px"
            viewBox="0 0 287.7 100.1" 
            xmlSpace="preserve"
            className={className}
        >
            <defs>
                <linearGradient id="sawtli_grad_new_1" gradientUnits="userSpaceOnUse" x1="14.3098" y1="-156.7323" x2="14.3098" y2="-113.1182" gradientTransform="matrix(1 0 0 -1 0 -103.5533)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_2" gradientUnits="userSpaceOnUse" x1="27.6883" y1="-156.1498" x2="27.6883" y2="-147.4218" gradientTransform="matrix(1 0 0 -1 0 -103.5533)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_3" gradientUnits="userSpaceOnUse" x1="41.061" y1="-155.582" x2="41.061" y2="-146.854" gradientTransform="matrix(1 0 0 -1 0 -103.5533)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_4" gradientUnits="userSpaceOnUse" x1="54.4453" y1="-192.3019" x2="54.4453" y2="-147.8104" gradientTransform="matrix(1 0 0 -1 0 -103.5533)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_5" gradientUnits="userSpaceOnUse" x1="435.1391" y1="49.0229" x2="435.1391" y2="57.751" gradientTransform="matrix(-1 0 0 1 476.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_6" gradientUnits="userSpaceOnUse" x1="448.5117" y1="49.0229" x2="448.5117" y2="57.751" gradientTransform="matrix(-1 0 0 1 476.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_7" gradientUnits="userSpaceOnUse" x1="458.9798" y1="61.8256" x2="458.9798" y2="62.0159" gradientTransform="matrix(-1 0 0 1 476.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_8" gradientUnits="userSpaceOnUse" x1="461.8877" y1="49.4084" x2="461.8877" y2="58.0293" gradientTransform="matrix(-1 0 0 1 476.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_9" gradientUnits="userSpaceOnUse" x1="421.7548" y1="49.0229" x2="421.7548" y2="57.751" gradientTransform="matrix(-1 0 0 1 476.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_10" gradientUnits="userSpaceOnUse" x1="23.7444" y1="-164.4803" x2="23.7444" y2="-155.7522" gradientTransform="matrix(1 0 0 -1 3.9439 -146.8367)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_11" gradientUnits="userSpaceOnUse" x1="37.0907" y1="-164.4803" x2="37.0907" y2="-155.7522" gradientTransform="matrix(1 0 0 -1 3.9439 -146.8367)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_12" gradientUnits="userSpaceOnUse" x1="50.4877" y1="-164.2202" x2="50.4877" y2="-155.6162" gradientTransform="matrix(1 0 0 -1 3.9439 -146.8367)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_new_13" gradientUnits="userSpaceOnUse" x1="10.3659" y1="-164.4803" x2="10.3659" y2="-155.7522" gradientTransform="matrix(1 0 0 -1 3.9439 -146.8367)">
                    <stop offset="0" style={{stopColor: '#328CCB'}}/>
                    <stop offset="1" style={{stopColor: '#68C9DD'}}/>
                    <stop offset="1" style={{stopColor: '#58B647'}}/>
                </linearGradient>
            </defs>
            <path fill="#C8C8C8" d="M140.5,75.9c0.5-0.1,1.4-0.2,2.3-0.2c1.2,0,2,0.2,2.7,0.7c0.5,0.4,0.8,1,0.8,1.7c0,1-0.6,1.8-1.7,2.1l0,0 c0.9,0.3,2,1,2,2.5c0,0.8-0.4,1.5-0.8,1.9c-0.7,0.6-1.8,0.9-3.4,0.9c-0.9,0-1.5-0.1-1.9-0.1C140.5,85.5,140.5,75.9,140.5,75.9z M141.8,79.9h1.2c1.3,0,2.1-0.7,2.1-1.6c0-1.2-0.9-1.6-2.1-1.6c-0.6,0-0.9,0-1.2,0.1V79.9z M141.8,84.6c0.3,0,0.6,0.1,1.1,0.1 c1.3,0,2.5-0.4,2.5-1.9c0-1.3-1.2-1.9-2.5-1.9h-1.1V84.6z"/>
            <path fill="#C8C8C8" d="M149.1,82.3c0,1.7,1.2,2.4,2.4,2.4c0.9,0,1.4-0.2,1.9-0.4l0.2,0.9c-0.4,0.2-1.2,0.4-2.3,0.4 c-2.1,0-3.5-1.4-3.5-3.5c0-2.1,1.2-3.8,3.3-3.8c2.3,0,2.9,2,2.9,3.3c0,0.3,0,0.4,0,0.6L149.1,82.3L149.1,82.3z M152.8,81.4 c0-0.8-0.4-2-1.8-2c-1.3,0-1.9,1.2-1.9,2H152.8z"/>
            <path fill="#C8C8C8" d="M156.1,78.6l1.5,4.2c0.2,0.4,0.4,1,0.4,1.4l0,0c0.1-0.4,0.3-1,0.4-1.4l1.4-4.1h1.3l-1.9,5 c-0.9,2.4-1.5,3.6-2.4,4.3c-0.6,0.5-1.2,0.8-1.6,0.8l-0.4-1.1c0.4-0.1,0.7-0.3,1.2-0.6c0.4-0.3,0.8-0.8,1.1-1.4 c0.1-0.1,0.1-0.3,0.1-0.3c0-0.1,0-0.2-0.1-0.4l-2.5-6.5H156.1z"/>
            <path fill="#C8C8C8" d="M168.6,82c0,2.6-1.8,3.7-3.5,3.7c-1.9,0-3.4-1.4-3.4-3.6c0-2.3,1.5-3.7,3.5-3.7C167.3,78.4,168.6,79.9,168.6,82 z M163.1,82.1c0,1.5,0.9,2.7,2.1,2.7c1.2,0,2.1-1.2,2.1-2.7c0-1.2-0.6-2.7-2.1-2.7C163.7,79.4,163.1,80.8,163.1,82.1z"/>
            <path fill="#C8C8C8" d="M170.3,80.4c0-0.7,0-1.3-0.1-1.9h1.2l0.1,1.2l0,0c0.4-0.7,1.2-1.3,2.3-1.3c1,0,2.5,0.6,2.5,3v4.2H175v-4.1 c0-1.2-0.4-2-1.6-2c-0.8,0-1.5,0.6-1.7,1.3c-0.2,0.2-0.2,0.4-0.2,0.5v4.2h-1.2V80.4z"/>
            <path fill="#C8C8C8" d="M184.3,75.3v8.4c0,0.6,0,1.3,0.1,1.8h-1.2l-0.1-1.2l0,0c-0.4,0.8-1.2,1.3-2.4,1.3c-1.7,0-3-1.4-3-3.5 c0-2.3,1.4-3.7,3.1-3.7c1.1,0,1.8,0.5,2.1,1.1l0,0v-4.2L184.3,75.3L184.3,75.3z M183.1,81.4c0-0.2,0-0.4-0.1-0.5 c-0.2-0.8-0.9-1.5-1.9-1.5c-1.3,0-2.1,1.2-2.1,2.7c0,1.4,0.7,2.6,2,2.6c0.9,0,1.6-0.5,1.9-1.5c0-0.2,0.1-0.4,0.1-0.5L183.1,81.4 L183.1,81.4z"/>
            <path fill="#C8C8C8" d="M190.8,76.9h-2.9v-1.1h7.2v1.1h-3v8.7h-1.2C190.8,85.6,190.8,76.9,190.8,76.9z"/>
            <path fill="#C8C8C8" d="M195.8,82.3c0,1.7,1.2,2.4,2.4,2.4c0.9,0,1.4-0.2,1.9-0.4l0.2,0.9c-0.4,0.2-1.2,0.4-2.3,0.4 c-2.1,0-3.5-1.4-3.5-3.5c0-2.1,1.2-3.8,3.3-3.8c2.3,0,2.9,2,2.9,3.3c0,0.3,0,0.4,0,0.6L195.8,82.3L195.8,82.3z M199.5,81.4 c0-0.8-0.4-2-1.8-2c-1.3,0-1.9,1.2-1.9,2H199.5z"/>
            <path fill="#C8C8C8" d="M202.8,78.6l1,1.5c0.3,0.4,0.4,0.7,0.7,1.2l0,0c0.3-0.4,0.4-0.8,0.7-1.2l1-1.5h1.3l-2.2,3.4l2.5,3.6h-1.4 l-1.1-1.6c-0.3-0.4-0.5-0.8-0.7-1.2l0,0c-0.3,0.4-0.4,0.8-0.7,1.2l-1,1.6h-1.4L204,82l-2.4-3.5H202.8z"/>
            <path fill="#C8C8C8" d="M210.7,76.5v2h1.9v1h-1.9v3.8c0,0.9,0.3,1.3,1,1.3c0.4,0,0.6,0,0.7-0.1l0.1,1c-0.3,0.1-0.6,0.2-1.2,0.2 c-0.6,0-1.1-0.2-1.3-0.5c-0.4-0.4-0.5-1-0.5-1.9v-3.8h-1.1v-1h1.1v-1.7L210.7,76.5z"/>
            <path fill="#C8C8C8" d="M216.8,81.2v1h-3.5v-1H216.8z"/>
            <path fill="#C8C8C8" d="M219.8,76.5v2h1.9v1h-1.9v3.8c0,0.9,0.3,1.3,1,1.3c0.4,0,0.6,0,0.7-0.1l0.1,1c-0.3,0.1-0.6,0.2-1.2,0.2 c-0.6,0-1.1-0.2-1.3-0.5c-0.4-0.4-0.5-1-0.5-1.9v-3.8h-1.1v-1h1.1v-1.7L219.8,76.5z"/>
            <path fill="#C8C8C8" d="M229.3,82c0,2.6-1.8,3.7-3.5,3.7c-1.9,0-3.4-1.4-3.4-3.6c0-2.3,1.5-3.7,3.5-3.7C228,78.4,229.3,79.9,229.3,82z M223.8,82.1c0,1.5,0.9,2.7,2.1,2.7c1.2,0,2.1-1.2,2.1-2.7c0-1.2-0.6-2.7-2.1-2.7S223.8,80.8,223.8,82.1z"/>
            <path fill="#C8C8C8" d="M234.1,81.2v1h-3.5v-1H234.1z"/>
            <path fill="#C8C8C8" d="M235.4,84.1c0.5,0.4,1.4,0.6,2.2,0.6c1.3,0,2-0.7,2-1.7c0-0.9-0.5-1.4-1.9-1.9c-1.6-0.5-2.6-1.4-2.6-2.7 c0-1.5,1.2-2.7,3.2-2.7c1,0,1.7,0.3,2.1,0.4l-0.4,1.1c-0.4-0.2-1-0.4-1.9-0.4c-1.3,0-1.9,0.8-1.9,1.4c0,0.9,0.6,1.3,1.9,1.9 c1.7,0.6,2.5,1.4,2.5,2.8c0,1.5-1.2,2.8-3.4,2.8c-1,0-1.9-0.3-2.5-0.6L235.4,84.1z"/>
            <path fill="#C8C8C8" d="M242.7,80.9c0-0.9,0-1.6-0.1-2.3h1.2l0.1,1.2l0,0c0.5-0.9,1.3-1.3,2.5-1.3c1.7,0,2.9,1.4,2.9,3.5 c0,2.5-1.5,3.7-3.2,3.7c-0.9,0-1.8-0.4-2.1-1.1l0,0v3.8h-1.2L242.7,80.9L242.7,80.9z M243.9,82.7c0,0.2,0,0.4,0.1,0.5 c0.3,0.9,1,1.5,1.9,1.5c1.3,0,2.1-1.1,2.1-2.7c0-1.4-0.7-2.6-2-2.6c-0.9,0-1.7,0.6-1.9,1.6c0,0.2-0.1,0.4-0.1,0.5L243.9,82.7 L243.9,82.7z"/>
            <path fill="#C8C8C8" d="M251.6,82.3c0,1.7,1.2,2.4,2.4,2.4c0.9,0,1.4-0.2,1.9-0.4l0.2,0.9c-0.4,0.2-1.2,0.4-2.3,0.4 c-2.1,0-3.5-1.4-3.5-3.5c0-2.1,1.2-3.8,3.3-3.8c2.3,0,2.9,2,2.9,3.3c0,0.3,0,0.4,0,0.6L251.6,82.3L251.6,82.3z M255.4,81.4 c0-0.8-0.4-2-1.8-2c-1.3,0-1.9,1.2-1.9,2H255.4z"/>
            <path fill="#C8C8C8" d="M258.9,82.3c0,1.7,1.2,2.4,2.4,2.4c0.9,0,1.4-0.2,1.9-0.4l0.2,0.9c-0.4,0.2-1.2,0.4-2.3,0.4 c-2.1,0-3.5-1.4-3.5-3.5c0-2.1,1.2-3.8,3.3-3.8c2.3,0,2.9,2,2.9,3.3c0,0.3,0,0.4,0,0.6L258.9,82.3L258.9,82.3z M262.6,81.4 c0-0.8-0.4-2-1.8-2c-1.3,0-1.9,1.2-1.9,2H262.6z"/>
            <path fill="#C8C8C8" d="M270.4,85.3c-0.4,0.2-1.1,0.4-2,0.4c-2.1,0-3.5-1.4-3.5-3.5c0-2.1,1.5-3.7,3.7-3.7c0.7,0,1.4,0.2,1.8,0.4 l-0.3,1c-0.3-0.2-0.8-0.4-1.5-0.4c-1.6,0-2.5,1.2-2.5,2.7c0,1.6,1.1,2.7,2.4,2.7c0.7,0,1.2-0.2,1.6-0.4L270.4,85.3z"/>
            <path fill="#C8C8C8" d="M271.9,75.3h1.2v4.3l0,0c0.2-0.4,0.5-0.7,0.9-0.9c0.4-0.2,0.8-0.4,1.3-0.4c1,0,2.5,0.6,2.5,3v4.2h-1.2v-4 c0-1.2-0.4-2-1.6-2c-0.8,0-1.5,0.6-1.7,1.2c-0.1,0.2-0.1,0.4-0.1,0.6v4.3H272L271.9,75.3L271.9,75.3z"/>
            <g>
                <g>
                    <path fill="#0CABEC" d="M87.3,48.6c-1.5,0-3.1-0.1-4.7-0.3c-1.6-0.1-3.3-0.4-4.9-0.7c-1.6-0.3-2.9-0.4-4.1-0.7l0.5-6.1 c1.2,0.1,2.5,0.3,4.1,0.5c1.6,0.1,3.1,0.3,4.7,0.4s2.9,0.1,4,0.1c1.5,0,2.7-0.1,3.5-0.5c0.9-0.4,1.6-0.9,2-1.7s0.7-1.7,0.7-2.9 c0-0.9-0.1-1.7-0.5-2.4c-0.4-0.5-1.1-1.1-2.1-1.5s-2.4-0.7-4.3-1.1c-2.3-0.4-4.3-0.9-5.9-1.5c-1.6-0.5-2.9-1.3-4-2.1 c-1.1-0.8-1.7-2-2.3-3.3c-0.5-1.3-0.7-2.9-0.7-4.8c0-2.9,0.5-5.3,1.6-6.9c1.1-1.7,2.7-2.9,4.7-3.6s4.4-1.1,7.2-1.1 c1.2,0,2.7,0.1,4.3,0.1c1.6,0.1,3.2,0.3,4.8,0.5c1.6,0.1,2.9,0.4,4,0.7l-0.4,6.3c-1.2-0.1-2.4-0.3-4-0.4c-1.5-0.1-2.9-0.3-4.4-0.4 s-2.7-0.1-3.7-0.1c-1.5,0-2.5,0.1-3.5,0.4c-0.9,0.3-1.6,0.8-2.1,1.5c-0.4,0.7-0.7,1.5-0.7,2.4c0,1.2,0.3,2,0.7,2.7 c0.4,0.7,1.2,1.1,2.3,1.5c1.1,0.4,2.5,0.8,4.4,1.2c2.3,0.5,4.1,1.1,5.7,1.6c1.6,0.5,2.8,1.2,3.9,2c0.9,0.8,1.7,1.9,2.1,3.1 c0.4,1.2,0.7,2.8,0.7,4.7c0,3.1-0.5,5.5-1.6,7.3c-1.1,1.9-2.7,3.2-4.7,4C92.5,48.2,90.1,48.6,87.3,48.6z"/>
                    <path fill="#0CABEC" d="M107.4,47.9l9.8-38.7h13.7l9.8,38.7h-7.9l-2.1-7.9h-13.6l-2,7.9H107.4z M118.4,33.8h11.2l-4.4-18.2h-2.4 L118.4,33.8z"/>
                    <path fill="#0CABEC" d="M152.1,47.9l-6.5-38.7h7.9l4.8,31.1h1.3l5.9-30.7h8.8l6,30.7h1.3L186,9.2h8l-6.5,38.7h-12.4l-5.5-30.7h0.3 l-5.6,30.7H152.1z"/>
                    <path fill="#0CABEC" d="M210.8,47.9V15.8h-10.4V9.2h28.3v6.7h-10.1v32.1H210.8z"/>
                    <path fill="#0CABEC" d="M237.5,47.9V9.2h7.9v32.1h15.3v6.7H237.5z"/>
                    <path fill="#0CABEC" d="M269.5,47.9V9.2h7.9v38.7H269.5z"/>
                </g>
            </g>
            <g>
                <path fill="#C8C8C8" d="M76.4,65.9l-1.6,4.8h-2L78,55.4h2.4l5.2,15.3h-2.1l-1.6-4.8H76.4z M81.4,64.3L80,59.9 c-0.4-0.9-0.5-1.9-0.8-2.8l0,0c-0.3,0.9-0.5,1.9-0.8,2.8l-1.6,4.4H81.4z"/>
                <path fill="#C8C8C8" d="M89.2,55.4v9c0,3.5,1.5,4.9,3.6,4.9c2.3,0,3.7-1.5,3.7-4.9v-9h2v8.9c0,4.7-2.5,6.7-5.7,6.7 c-3.1,0-5.5-1.7-5.5-6.5v-9H89.2z"/>
                <path fill="#C8C8C8" d="M101.8,55.6c1.2-0.1,2.7-0.3,4.3-0.3c2.8,0,4.8,0.7,6.1,1.9c1.3,1.2,2.1,3.1,2.1,5.5c0,2.5-0.8,4.5-2.3,6 c-1.5,1.5-3.7,2.3-6.8,2.3c-1.5,0-2.5-0.1-3.6-0.1V55.6H101.8z M103.8,69.1c0.5,0.1,1.2,0.1,2,0.1c4.3,0,6.5-2.4,6.5-6.5 c0-3.6-2-5.9-6.1-5.9c-1.1,0-1.7,0.1-2.3,0.3v12H103.8z"/>
                <path fill="#C8C8C8" d="M119,55.4v15.3h-2V55.4H119z"/>
                <path fill="#C8C8C8" d="M135.5,62.8c0,5.3-3.2,8-7.1,8c-4,0-6.9-3.2-6.9-7.7c0-4.8,3.1-8,7.1-8C132.7,55.1,135.5,58.3,135.5,62.8z M123.5,63.1c0,3.3,1.7,6.1,4.9,6.1c3.2,0,4.9-2.9,4.9-6.4c0-3.1-1.6-6.3-4.9-6.3C125.2,56.7,123.5,59.8,123.5,63.1z"/>
                <path fill="#C8C8C8" d="M144.4,70.7l-3.9-15.3h2.1l1.9,7.7c0.4,1.9,0.8,3.9,1.2,5.3l0,0c0.3-1.5,0.7-3.3,1.2-5.3l2-7.7h2l1.9,7.7 c0.4,1.9,0.8,3.6,1.1,5.2l0,0c0.3-1.7,0.8-3.3,1.2-5.3l2-7.7h2l-4.4,15.3h-2l-1.9-8c-0.5-2-0.8-3.5-0.9-4.9l0,0 c-0.3,1.5-0.7,3.1-1.2,4.9l-2.1,8h-2.1V70.7z"/>
                <path fill="#C8C8C8" d="M174.2,62.8c0,5.3-3.2,8-7.1,8c-4,0-6.9-3.2-6.9-7.7c0-4.8,3.1-8,7.1-8C171.5,55.1,174.2,58.3,174.2,62.8z M162.3,63.1c0,3.3,1.7,6.1,4.9,6.1c3.2,0,4.9-2.9,4.9-6.4c0-3.1-1.6-6.3-4.9-6.3C163.9,56.7,162.3,59.8,162.3,63.1z"/>
                <path fill="#C8C8C8" d="M176.7,55.6c0.9-0.3,2.4-0.3,3.7-0.3c2.1,0,3.5,0.4,4.4,1.2c0.8,0.7,1.2,1.7,1.2,2.9c0,2-1.3,3.3-2.9,3.9v0.1 c1.2,0.4,1.9,1.5,2.3,3.1c0.5,2.1,0.8,3.6,1.2,4.3h-2c-0.3-0.4-0.5-1.7-1.1-3.6c-0.4-2.1-1.3-2.9-3.1-2.9h-1.9v6.7h-2V55.6H176.7z M178.7,62.5h2c2.1,0,3.5-1.2,3.5-2.9c0-2-1.5-2.8-3.5-2.8c-0.9,0-1.6,0.1-2,0.1V62.5z"/>
                <path fill="#C8C8C8" d="M189,55.4h2v7.3h0.1c0.4-0.5,0.8-1.2,1.2-1.6l4.7-5.7h2.4l-5.6,6.5l6,8.8h-2.4l-5.1-7.5l-1.5,1.7v5.9h-2V55.4 H189z"/>
                <path fill="#C8C8C8" d="M200.9,68.3c0.9,0.5,2.1,0.9,3.6,0.9c2,0,3.2-1.1,3.2-2.7c0-1.5-0.8-2.3-2.9-3.1c-2.5-0.9-4-2.1-4-4.4 c0-2.4,2-4.1,4.9-4.1c1.6,0,2.7,0.4,3.3,0.8l-0.5,1.6c-0.5-0.3-1.5-0.7-2.9-0.7c-2.1,0-2.9,1.2-2.9,2.3c0,1.5,0.9,2.1,3.1,2.9 c2.5,0.9,3.9,2.3,3.9,4.5c0,2.4-1.7,4.4-5.3,4.4c-1.5,0-3.1-0.4-3.9-0.9L200.9,68.3z"/>
                <path fill="#C8C8C8" d="M215.3,57.1h-4.7v-1.7H222v1.7h-4.7v13.6h-2V57.1z"/>
                <path fill="#C8C8C8" d="M224.4,65.9l-1.6,4.8h-2l5.2-15.3h2.4l5.2,15.3h-2.1l-1.6-4.8H224.4z M229.4,64.3l-1.5-4.4 c-0.4-0.9-0.5-1.9-0.8-2.8l0,0c-0.3,0.9-0.5,1.9-0.8,2.8l-1.5,4.4C224.9,64.3,229.4,64.3,229.4,64.3z"/>
                <path fill="#C8C8C8" d="M237,57.1h-4.7v-1.7h11.3v1.7H239v13.6h-2V57.1z"/>
                <path fill="#C8C8C8" d="M247.3,55.4v15.3h-2V55.4H247.3z"/>
                <path fill="#C8C8C8" d="M263.8,62.8c0,5.3-3.2,8-7.1,8c-4,0-6.9-3.2-6.9-7.7c0-4.8,3.1-8,7.1-8C261.1,55.1,263.8,58.3,263.8,62.8z M251.9,63.1c0,3.3,1.7,6.1,4.9,6.1s4.9-2.9,4.9-6.4c0-3.1-1.6-6.3-4.9-6.3C253.5,56.7,251.9,59.8,251.9,63.1z"/>
                <path fill="#C8C8C8" d="M266.4,70.7V55.4h2.1l4.9,7.7c1.2,1.7,2,3.5,2.8,4.9l0,0c-0.1-2-0.3-3.9-0.3-6.3v-6.4h1.9v15.3h-2l-4.8-7.7 c-1.1-1.7-2.1-3.5-2.8-5.1h-0.1c0.1,1.9,0.1,3.7,0.1,6.3v6.5H266.4z"/>
            </g>
            <g>
                <path fill="#0CABEC" d="M14.5,87.7h-0.5c-2.3,0-4.2-1.9-4.2-4.2V13c0-2.3,1.9-4.2,4.2-4.2h0.5c2.3,0,4.2,1.9,4.2,4.2v70.4 C18.8,85.8,16.9,87.7,14.5,87.7z"/>
                <path fill="#0CABEC" d="M27.9,87.7h-0.5c-2.3,0-4.2-1.9-4.2-4.2V13c0-2.3,1.9-4.2,4.2-4.2h0.5c2.3,0,4.2,1.9,4.2,4.2v70.4 C32.2,85.8,30.3,87.7,27.9,87.7z"/>
                <path fill="#0CABEC" d="M41.3,87.7h-0.5c-2.3,0-4.2-1.9-4.2-4.2V13c0-2.3,1.9-4.2,4.2-4.2h0.5c2.3,0,4.2,1.9,4.2,4.2v70.4 C45.5,85.8,43.6,87.7,41.3,87.7z"/>
                <path fill="#0CABEC" d="M54.7,87.7h-0.5c-2.3,0-4.2-1.9-4.2-4.2V13c0-2.3,1.9-4.2,4.2-4.2h0.5c2.3,0,4.2,1.9,4.2,4.2v70.4 C58.9,85.8,57,87.7,54.7,87.7z"/>
                
                <path fill="url(#sawtli_grad_new_1)" d="M17.2,9.6c1.1,0.8,1.6,2.1,1.6,3.4v39.4h-4.5c-1.1,0-1.8-0.3-2.6-0.8c-1.1-0.8-1.8-2.1-1.8-3.6v-35 c0-0.5,0-0.8,0.3-1.3c0-0.3,0.3-0.5,0.3-0.8c0.3-0.3,0.3-0.5,0.5-0.8c0.8-1,2.1-1.6,3.4-1.6C15.6,8.5,16.4,8.8,17.2,9.6z"/>
                <rect x="23.2" y="43.7" fill="url(#sawtli_grad_new_2)" width="8.9" height="8.8"/>
                <rect x="36.6" y="43.2" fill="url(#sawtli_grad_new_3)" width="8.9" height="8.8"/>
                <path fill="url(#sawtli_grad_new_4)" d="M58.9,47.4v35.8c0,2.4-2.1,4.5-4.5,4.5 c-0.3,0-0.8,0-1.1-0.3c-1.8-0.5-3.4-2.1-3.4-4.2v-40h4.5C57.1,43.2,58.9,45,58.9,47.4z"/>
                <path fill="url(#sawtli_grad_new_5)" d="M38.2,86.4c-1.1-0.8-1.6-2.1-1.6-3.4v-4.2 h8.9v4.4c0,2.3-2.1,4.4-4.5,4.4C40,87.4,39,87.2,38.2,86.4z"/>
                <path fill="url(#sawtli_grad_new_6)" d="M24.8,86.4c-1.1-0.8-1.6-2.1-1.6-3.4v-4.2 h8.9v4.4c0,2.3-2.1,4.4-4.5,4.4C26.6,87.4,25.6,87.2,24.8,86.4z"/>
                <path fill="url(#sawtli_grad_new_7)" d="M17.2,91.5c0-0.1,0-0.1,0-0.2"/>
                <path fill="url(#sawtli_grad_new_8)" d="M14.2,87.7c2.5,0.2,4.7-1.8,4.6-4.4V79 c0,0-4.4,0-4.4,0c-1.9,0-3.7,1.4-4.3,3.1c-0.3,1-0.2,2.1,0.1,3.1c0.2,0.7,0.6,1.3,1.2,1.8c0.8,0.6,1.5,0.7,2.5,0.7"/>
                <path fill="url(#sawtli_grad_new_9)" d="M51.6,86.4C50.5,85.6,50,84.3,50,83v-4.2 h8.9v4.4c0,2.3-2.1,4.4-4.5,4.4C53.1,87.4,52.3,87.2,51.6,86.4z"/>
                <path fill="url(#sawtli_grad_new_10)" d="M30.6,9.8c1.1,0.8,1.6,2.1,1.6,3.4v4.2 l-8.9,0l0-4.4c0-2.3,2.1-4.4,4.5-4.4C28.7,8.8,29.8,9,30.6,9.8z"/>
                <path fill="url(#sawtli_grad_new_11)" d="M43.9,9.8c1,0.8,1.6,2.1,1.6,3.4l0,4.2 l-8.9,0v-4.4c0-2.3,2.1-4.4,4.4-4.4C42.1,8.8,43.1,9,43.9,9.8z"/>
                <path fill="url(#sawtli_grad_new_12)" d="M54.6,8.6c-2.4,0-4.6,2.1-4.6,4.4l0,4.3 c0,0,4.5,0,4.5,0c1.9,0,3.7-1.4,4.3-3.1c0.3-1,0.2-2.1-0.1-3.1c-0.2-0.7-0.6-1.3-1.2-1.8c-0.8-0.6-1.5-0.7-2.5-0.7"/>
                <path fill="url(#sawtli_grad_new_13)" d="M17.2,9.8c1.1,0.8,1.6,2.1,1.6,3.4v4.2 l-8.9,0l0-4.4c0-2.3,2.1-4.4,4.5-4.4C15.6,8.8,16.4,9,17.2,9.8z"/>
            </g>
            <g>
                <polygon fill="#C8C8C8" points="75.9,77 77.3,79.8 80.5,80.3 78.2,82.6 78.8,85.8 75.9,84.3 73.1,85.8 73.6,82.6 71.3,80.3 74.5,79.8"/>
                <polygon fill="#C8C8C8" points="89.5,77 90.9,79.8 94.1,80.3 91.8,82.6 92.3,85.8 89.5,84.3 86.6,85.8 87.2,82.6 84.9,80.3 88.1,79.8"/>
                <polygon fill="#C8C8C8" points="103.1,77 104.5,79.8 107.7,80.3 105.4,82.6 105.9,85.8 103.1,84.3 100.2,85.8 100.7,82.6 98.4,80.3 101.6,79.8"/>
                <polygon fill="#C8C8C8" points="116.6,77 118.1,79.8 121.3,80.3 118.9,82.6 119.5,85.8 116.6,84.3 113.8,85.8 114.3,82.6 112,80.3 115.2,79.8"/>
                <polygon fill="#C8C8C8" points="130.2,77 131.6,79.8 134.8,80.3 132.5,82.6 133.1,85.8 130.2,84.3 127.3,85.8 127.9,82.6 125.6,80.3 128.8,79.8"/>
            </g>
        </svg>
    );
}

export {
  SpeakerIcon,
  SoundWaveIcon,
  LoaderIcon,
  DownloadIcon,
  TranslateIcon,
  StopIcon,
  PauseIcon,
  StarIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  GlobeIcon,
  ReplayIcon,
  SwapIcon,
  MicrophoneIcon,
  GearIcon,
  HistoryIcon,
  LinkIcon,
  ShareIcon,
  InfoIcon,
  PlayCircleIcon,
  SawtliLogoIcon,
  UserIcon,
  WarningIcon,
  TrashIcon,
  SoundEnhanceIcon,
  ReportIcon,
  VideoCameraIcon,
  LockIcon,
  SparklesIcon,
  WandIcon
};
