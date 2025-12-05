
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

function SawtliLogoIcon({ className }: IconProps) {
    return (
        <svg 
            version="1.1" 
            xmlns="http://www.w3.org/2000/svg" 
            xmlnsXlink="http://www.w3.org/1999/xlink" 
            x="0px" 
            y="0px"
            viewBox="0 0 272.7 85.2" 
            xmlSpace="preserve"
            className={className}
        >
            <defs>
                <linearGradient id="sawtli_grad_1" gradientUnits="userSpaceOnUse" x1="216" y1="39.3621" x2="216" y2="56.172" gradientTransform="matrix(1 0 0 -1 0 85.2756)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_2" gradientUnits="userSpaceOnUse" x1="220.8" y1="39.5866" x2="220.8" y2="42.9506" gradientTransform="matrix(1 0 0 -1 0 85.2756)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_3" gradientUnits="userSpaceOnUse" x1="225.5699" y1="39.8054" x2="225.5699" y2="43.1694" gradientTransform="matrix(1 0 0 -1 0 85.2756)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_4" gradientUnits="userSpaceOnUse" x1="230.4" y1="25.6527" x2="230.4" y2="42.8008" gradientTransform="matrix(1 0 0 -1 0 85.2756)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_5" gradientUnits="userSpaceOnUse" x1="220.6021" y1="26.1666" x2="220.6021" y2="29.5306" gradientTransform="matrix(-1 0 0 1 446.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_6" gradientUnits="userSpaceOnUse" x1="225.4001" y1="26.1666" x2="225.4001" y2="29.5306" gradientTransform="matrix(-1 0 0 1 446.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_7" gradientUnits="userSpaceOnUse" x1="229.1558" y1="31.1011" x2="229.1558" y2="31.1744" gradientTransform="matrix(-1 0 0 1 446.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_8" gradientUnits="userSpaceOnUse" x1="230.2001" y1="26.2669" x2="230.2001" y2="29.583" gradientTransform="matrix(-1 0 0 1 446.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_9" gradientUnits="userSpaceOnUse" x1="215.8" y1="26.1666" x2="215.8" y2="29.5306" gradientTransform="matrix(-1 0 0 1 446.2001 29.5244)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_10" gradientUnits="userSpaceOnUse" x1="216.8309" y1="9.7749" x2="216.8309" y2="13.1389" gradientTransform="matrix(1 0 0 -1 3.9439 41.9922)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_11" gradientUnits="userSpaceOnUse" x1="221.6239" y1="9.7749" x2="221.6239" y2="13.1389" gradientTransform="matrix(1 0 0 -1 3.9439 41.9922)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_12" gradientUnits="userSpaceOnUse" x1="226.4512" y1="9.8751" x2="226.4512" y2="13.1913" gradientTransform="matrix(1 0 0 -1 3.9439 41.9922)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
                <linearGradient id="sawtli_grad_13" gradientUnits="userSpaceOnUse" x1="212.0082" y1="9.7749" x2="212.0082" y2="13.1389" gradientTransform="matrix(1 0 0 -1 3.9439 41.9922)">
                    <stop offset="0" style={{stopColor: '#308ECD'}}/>
                    <stop offset="1" style={{stopColor: '#6ACBDF'}}/>
                    <stop offset="1" style={{stopColor: '#58B847'}}/>
                </linearGradient>
            </defs>
            <path fill="#00ADEE" d="M216,59.2L216,59.2c-0.9,0-1.6-0.7-1.6-1.6V30.4c0-0.9,0.7-1.6,1.6-1.6h0.1c0.9,0,1.6,0.7,1.6,1.6v27.2 C217.6,58.5,216.9,59.2,216,59.2z"/>
            <path fill="#00ADEE" d="M220.8,59.2L220.8,59.2c-0.9,0-1.6-0.7-1.6-1.6V30.4c0-0.9,0.7-1.6,1.6-1.6h0.1c0.9,0,1.6,0.7,1.6,1.6v27.2 C222.4,58.5,221.7,59.2,220.8,59.2z"/>
            <path fill="#00ADEE" d="M225.6,59.2L225.6,59.2c-0.9,0-1.6-0.7-1.6-1.6V30.4c0-0.9,0.7-1.6,1.6-1.6h0.1c0.9,0,1.6,0.7,1.6,1.6v27.2 C227.2,58.5,226.5,59.2,225.6,59.2z"/>
            <path fill="#00ADEE" d="M230.4,59.2L230.4,59.2c-0.9,0-1.6-0.7-1.6-1.6V30.4c0-0.9,0.7-1.6,1.6-1.6h0.1c0.9,0,1.6,0.7,1.6,1.6v27.2 C232,58.5,231.3,59.2,230.4,59.2z"/>
            <g>
                <path fill="#00ADEE" d="M209.6,28.7c-0.9,0-1.7,0.8-1.7,1.7v27c0,0.9,0.8,1.7,1.7,1.7s1.7-0.8,1.7-1.7v-27 C211.3,29.4,210.6,28.7,209.6,28.7z"/>
                <path fill="#00ADEE" d="M202.9,25.3c-0.9,0-1.7,0.8-1.7,1.7v33.7c0,0.9,0.8,1.7,1.7,1.7s1.7-0.8,1.7-1.7V27 C204.6,26,203.8,25.3,202.9,25.3z"/>
                <path fill="#00ADEE" d="M196.1,28.7c-0.9,0-1.7,0.8-1.7,1.7v27c0,0.9,0.8,1.7,1.7,1.7s1.7-0.8,1.7-1.7v-27 C197.8,29.4,197.1,28.7,196.1,28.7z"/>
                <path fill="#00ADEE" d="M189.4,32c-0.9,0-1.7,0.8-1.7,1.7V54c0,0.9,0.8,1.7,1.7,1.7s1.7-0.8,1.7-1.7V33.7 C191.1,32.8,190.3,32,189.4,32z"/>
                <path fill="#00ADEE" d="M182.6,38.8c-0.9,0-1.7,0.8-1.7,1.7v6.7c0,0.9,0.8,1.7,1.7,1.7s1.7-0.8,1.7-1.7v-6.7 C184.3,39.5,183.6,38.8,182.6,38.8z"/>
                <g>
                    <path fill="#00ADEE" d="M207.9,30.4v27c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3v-27c0-0.9-0.8-1.7-1.7-1.7 c-0.1,0-0.3,0-0.4,0C208.2,29.4,207.9,29.8,207.9,30.4z"/>
                    <path fill="#00ADEE" d="M201.2,27v33.7c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3V27.3c0-0.9-0.8-1.7-1.7-1.7 c-0.1,0-0.3,0-0.4,0C201.4,26,201.2,26.5,201.2,27z"/>
                    <path fill="#00ADEE" d="M194.4,30.4v27c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3v-27c0-0.9-0.8-1.7-1.7-1.7 c-0.1,0-0.3,0-0.4,0C194.7,29.4,194.4,29.8,194.4,30.4z"/>
                    <path fill="#00ADEE" d="M187.7,33.7V54c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3V34.1c0-0.9-0.8-1.7-1.7-1.7 c-0.1,0-0.3,0-0.4,0C187.9,32.7,187.7,33.2,187.7,33.7z"/>
                    <path fill="#00ADEE" d="M180.9,40.5v6.7c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3v-6.7 c0-0.9-0.8-1.7-1.7-1.7c-0.1,0-0.3,0-0.4,0C181.2,39.5,180.9,39.9,180.9,40.5z"/>
                </g>
            </g>
            <g>
                <g>
                    <path fill="#00ADEE" d="M244.7,25.8c0-0.1-0.1-0.1-0.1-0.2c0,0,0,0-0.1,0c-0.3-0.2-0.6-0.3-0.9-0.3c-1,0-1.7,0.7-1.7,1.7v33.7 c0,0.7,0.5,1.3,1.1,1.6c0,0,0.1,0.1,0.1,0.1c0.1,0,0.3,0,0.4,0c0,0,0,0,0.1,0c0,0,0,0,0,0c0.9,0,1.7-0.8,1.7-1.7V27 C245.3,26.5,245.1,26.1,244.7,25.8z"/>
                    <path fill="#00ADEE" d="M257.1,32c-1,0-1.7,0.8-1.7,1.7V54c0,0.7,0.5,1.3,1.1,1.6c0,0,0.1,0.1,0.1,0.1c0.1,0,0.3,0,0.4,0 c0,0,0,0,0.1,0c0,0,0,0,0,0c0.9,0,1.7-0.8,1.7-1.7V33.7C258.8,32.8,258,32,257.1,32z"/>
                    <path fill="#00ADEE" d="M265.5,40.1c0-0.1,0-0.2-0.1-0.2c0,0,0,0,0-0.1c-0.1-0.3-0.3-0.5-0.5-0.6c0,0,0,0,0,0 c-0.3-0.2-0.7-0.4-1.1-0.4c-0.9,0-1.7,0.7-1.7,1.7v6.7c0,0.7,0.5,1.4,1.2,1.6c0,0,0.1,0.1,0.1,0.1c0.1,0,0.3,0,0.4,0 c0.9,0,1.7-0.8,1.7-1.7v-6.7C265.5,40.4,265.5,40.3,265.5,40.1z"/>
                    <path fill="#00ADEE" d="M237.9,29.1C237.9,29.1,237.9,29.1,237.9,29.1c-0.3-0.2-0.7-0.4-1.1-0.4c-0.9,0-1.7,0.7-1.7,1.7v27 c0,0.7,0.5,1.4,1.2,1.6c0,0,0.1,0.1,0.1,0.1c0.1,0,0.3,0,0.4,0c0.9,0,1.7-0.8,1.7-1.7v-27C238.5,29.8,238.3,29.4,237.9,29.1z"/>
                    <path fill="#00ADEE" d="M251.4,29.1C251.4,29.1,251.4,29.1,251.4,29.1c-0.3-0.2-0.7-0.4-1.1-0.4c-0.9,0-1.7,0.7-1.7,1.7v27 c0,0.7,0.5,1.4,1.2,1.6c0,0,0.1,0.1,0.1,0.1c0.1,0,0.3,0,0.4,0c0.9,0,1.7-0.8,1.7-1.7v-27C252,29.8,251.8,29.4,251.4,29.1z"/>
                </g>
            </g>
            <path fill="url(#sawtli_grad_1)" d="M217.1,29.1c0.4,0.3,0.6,0.8,0.6,1.3v15.2H216c-0.4,0-0.7-0.1-1-0.3c-0.4-0.3-0.7-0.8-0.7-1.4V30.4 c0-0.2,0-0.3,0.1-0.5c0-0.1,0.1-0.2,0.1-0.3c0.1-0.1,0.1-0.2,0.2-0.3c0.3-0.4,0.8-0.6,1.3-0.6C216.5,28.7,216.8,28.8,217.1,29.1z"/>
            <rect x="219.2" y="42.3" fill="url(#sawtli_grad_2)" width="3.2" height="3.4"/>
            <rect x="223.9" y="42.1" fill="url(#sawtli_grad_3)" width="3.3" height="3.4"/>
            <path fill="url(#sawtli_grad_4)" d="M232,43.7v13.8c0,0.9-0.8,1.7-1.6,1.7 c-0.1,0-0.3,0-0.4-0.1c-0.7-0.2-1.2-0.8-1.2-1.6V42.1h1.6C231.3,42.1,232,42.8,232,43.7z"/>
            <path fill="url(#sawtli_grad_5)" d="M224.6,58.7c-0.4-0.3-0.6-0.8-0.6-1.3v-1.6 h3.2v1.7c0,0.9-0.8,1.7-1.6,1.7C225.2,59.1,224.8,59,224.6,58.7z"/>
            <path fill="url(#sawtli_grad_6)" d="M219.8,58.7c-0.4-0.3-0.6-0.8-0.6-1.3v-1.6 h3.2v1.7c0,0.9-0.8,1.7-1.6,1.7C220.4,59.1,220,59,219.8,58.7z"/>
            <path fill="url(#sawtli_grad_7)" d="M217,60.7C217,60.7,217,60.7,217,60.7"/>
            <path fill="url(#sawtli_grad_8)" d="M216,59.2c0.8,0,1.6-0.8,1.6-1.7v-1.7 c0,0-1.6,0-1.6,0c-0.7,0-1.3,0.5-1.5,1.2c-0.1,0.4-0.1,0.8,0,1.2c0.1,0.3,0.2,0.5,0.4,0.7c0.3,0.2,0.5,0.3,0.9,0.3"/>
            <path fill="url(#sawtli_grad_9)" d="M229.4,58.7c-0.4-0.3-0.6-0.8-0.6-1.3v-1.6 h3.2v1.7c0,0.9-0.8,1.7-1.6,1.7C229.9,59.1,229.6,59,229.4,58.7z"/>
            <g>
                <g>
                    <path fill="#FFFFFF" d="M24.1,57.6c-1.1,0-2.3-0.1-3.5-0.2s-2.5-0.3-3.7-0.5s-2.2-0.3-3.1-0.5l0.4-4.6c0.9,0.1,1.9,0.2,3.1,0.4 c1.2,0.1,2.3,0.2,3.5,0.3s2.2,0.1,3,0.1c1.1,0,2-0.1,2.6-0.4c0.7-0.3,1.2-0.7,1.5-1.3s0.5-1.3,0.5-2.2c0-0.7-0.1-1.3-0.4-1.8 c-0.3-0.4-0.8-0.8-1.6-1.1c-0.8-0.3-1.8-0.5-3.2-0.8c-1.7-0.3-3.2-0.7-4.4-1.1c-1.2-0.4-2.2-1-3-1.6c-0.8-0.6-1.3-1.5-1.7-2.5 s-0.5-2.2-0.5-3.6c0-2.2,0.4-4,1.2-5.2c0.8-1.3,2-2.2,3.5-2.7s3.3-0.8,5.4-0.8c0.9,0,2,0.1,3.2,0.1c1.2,0.1,2.4,0.2,3.6,0.4 c1.2,0.1,2.2,0.3,3,0.5l-0.3,4.7c-0.9-0.1-1.8-0.2-3-0.3c-1.1-0.1-2.2-0.2-3.3-0.3c-1.1-0.1-2-0.1-2.8-0.1c-1.1,0-1.9,0.1-2.6,0.3 s-1.2,0.6-1.6,1.1c-0.3,0.5-0.5,1.1-0.5,1.8c0,0.9,0.2,1.5,0.5,2s0.9,0.8,1.7,1.1c0.8,0.3,1.9,0.6,3.3,0.9 c1.7,0.4,3.1,0.8,4.3,1.2c1.2,0.4,2.1,0.9,2.9,1.5c0.7,0.6,1.3,1.4,1.6,2.3c0.3,0.9,0.5,2.1,0.5,3.5c0,2.3-0.4,4.1-1.2,5.5 s-2,2.4-3.5,3C28,57.3,26.2,57.6,24.1,57.6z"/>
                    <path fill="#00ADEE" d="M39.2,57.1L46.6,28h10.3l7.4,29.1h-5.9l-1.6-5.9H46.6l-1.5,5.9H39.2z M47.5,46.5h8.4l-3.3-13.7h-1.8 L47.5,46.5z"/>
                    <path fill="#00ADEE" d="M72.8,57.1L67.9,28h5.9l3.6,23.4h1l4.4-23.1h6.6l4.5,23.1h1L98.3,28h6l-4.9,29.1h-9.3L86,34h0.2L82,57.1H72.8 z"/>
                    <path fill="#00ADEE" d="M116.9,57.1V33h-7.8v-5h21.3v5h-7.6v24.1H116.9z"/>
                    <path fill="#00ADEE" d="M137,57.1V28h5.9v24.1h11.5v5H137z"/>
                    <path fill="#00ADEE" d="M161,57.1V28h5.9v29.1H161z"/>
                </g>
            </g>
            <g>
                <path fill="#FFFFFF" d="M17.7,17.1l-1.2,3.6H15l3.9-11.5h1.8l3.9,11.5H23l-1.2-3.6H17.7z M21.5,15.9l-1.1-3.3 c-0.3-0.7-0.4-1.4-0.6-2.1l0,0c-0.2,0.7-0.4,1.4-0.6,2.1L18,15.9H21.5z"/>
                <path fill="#FFFFFF" d="M27.3,9.2V16c0,2.6,1.1,3.7,2.7,3.7c1.7,0,2.8-1.1,2.8-3.7V9.2h1.5v6.7c0,3.5-1.9,5-4.3,5 c-2.3,0-4.1-1.3-4.1-4.9V9.2H27.3z"/>
                <path fill="#FFFFFF" d="M36.8,9.4c0.9-0.1,2-0.2,3.2-0.2c2.1,0,3.6,0.5,4.6,1.4s1.6,2.3,1.6,4.1c0,1.9-0.6,3.4-1.7,4.5 c-1.1,1.1-2.8,1.7-5.1,1.7c-1.1,0-1.9-0.1-2.7-0.1V9.4H36.8z M38.3,19.5c0.4,0.1,0.9,0.1,1.5,0.1c3.2,0,4.9-1.8,4.9-4.9 c0-2.7-1.5-4.4-4.6-4.4c-0.8,0-1.3,0.1-1.7,0.2v9H38.3z"/>
                <path fill="#FFFFFF" d="M49.7,9.2v11.5h-1.5V9.2H49.7z"/>
                <path fill="#FFFFFF" d="M62.1,14.8c0,4-2.4,6-5.3,6c-3,0-5.2-2.4-5.2-5.8c0-3.6,2.3-6,5.3-6C60,9,62.1,11.4,62.1,14.8z M53.1,15 c0,2.5,1.3,4.6,3.7,4.6s3.7-2.2,3.7-4.8c0-2.3-1.2-4.7-3.7-4.7C54.4,10.2,53.1,12.5,53.1,15z"/>
                <path fill="#FFFFFF" d="M68.8,20.7L65.9,9.2h1.6l1.4,5.8c0.3,1.4,0.6,2.9,0.9,4l0,0c0.2-1.1,0.5-2.5,0.9-4l1.5-5.8h1.5l1.4,5.8 c0.3,1.4,0.6,2.7,0.8,3.9l0,0c0.2-1.3,0.6-2.5,0.9-4l1.5-5.8h1.5l-3.3,11.5H75l-1.4-6c-0.4-1.5-0.6-2.6-0.7-3.7l0,0 c-0.2,1.1-0.5,2.3-0.9,3.7l-1.6,6h-1.6V20.7z"/>
                <path fill="#FFFFFF" d="M91.2,14.8c0,4-2.4,6-5.3,6c-3,0-5.2-2.4-5.2-5.8c0-3.6,2.3-6,5.3-6C89.2,9,91.2,11.4,91.2,14.8z M82.3,15 c0,2.5,1.3,4.6,3.7,4.6c2.4,0,3.7-2.2,3.7-4.8c0-2.3-1.2-4.7-3.7-4.7C83.5,10.2,82.3,12.5,82.3,15z"/>
                <path fill="#FFFFFF" d="M93.1,9.4c0.7-0.2,1.8-0.2,2.8-0.2c1.6,0,2.6,0.3,3.3,0.9c0.6,0.5,0.9,1.3,0.9,2.2c0,1.5-1,2.5-2.2,2.9v0.1 c0.9,0.3,1.4,1.1,1.7,2.3c0.4,1.6,0.6,2.7,0.9,3.2H99c-0.2-0.3-0.4-1.3-0.8-2.7c-0.3-1.6-1-2.2-2.3-2.2h-1.4v5H93L93.1,9.4 L93.1,9.4z M94.6,14.6h1.5c1.6,0,2.6-0.9,2.6-2.2c0-1.5-1.1-2.1-2.6-2.1c-0.7,0-1.2,0.1-1.5,0.1V14.6z"/>
                <path fill="#FFFFFF" d="M102.3,9.2h1.5v5.5h0.1c0.3-0.4,0.6-0.9,0.9-1.2l3.5-4.3h1.8l-4.2,4.9l4.5,6.6h-1.8l-3.8-5.6l-1.1,1.3v4.4 h-1.5L102.3,9.2L102.3,9.2z"/>
                <path fill="#FFFFFF" d="M111.3,18.9c0.7,0.4,1.6,0.7,2.7,0.7c1.5,0,2.4-0.8,2.4-2c0-1.1-0.6-1.7-2.2-2.3c-1.9-0.7-3-1.6-3-3.3 c0-1.8,1.5-3.1,3.7-3.1c1.2,0,2,0.3,2.5,0.6l-0.4,1.2c-0.4-0.2-1.1-0.5-2.2-0.5c-1.6,0-2.2,0.9-2.2,1.7c0,1.1,0.7,1.6,2.3,2.2 c1.9,0.7,2.9,1.7,2.9,3.4c0,1.8-1.3,3.3-4,3.3c-1.1,0-2.3-0.3-2.9-0.7L111.3,18.9z"/>
                <path fill="#FFFFFF" d="M122.1,10.5h-3.5V9.2h8.5v1.3h-3.5v10.2h-1.5V10.5z"/>
                <path fill="#FFFFFF" d="M128.9,17.1l-1.2,3.6h-1.5l3.9-11.5h1.8l3.9,11.5h-1.6l-1.2-3.6H128.9z M132.7,15.9l-1.1-3.3 c-0.3-0.7-0.4-1.4-0.6-2.1l0,0c-0.2,0.7-0.4,1.4-0.6,2.1l-1.1,3.3C129.3,15.9,132.7,15.9,132.7,15.9z"/>
                <path fill="#FFFFFF" d="M138.4,10.5h-3.5V9.2h8.5v1.3h-3.5v10.2h-1.5V10.5z"/>
                <path fill="#FFFFFF" d="M146.1,9.2v11.5h-1.5V9.2H146.1z"/>
                <path fill="#FFFFFF" d="M158.5,14.8c0,4-2.4,6-5.3,6c-3,0-5.2-2.4-5.2-5.8c0-3.6,2.3-6,5.3-6C156.5,9,158.5,11.4,158.5,14.8z M149.6,15c0,2.5,1.3,4.6,3.7,4.6s3.7-2.2,3.7-4.8c0-2.3-1.2-4.7-3.7-4.7C150.8,10.2,149.6,12.5,149.6,15z"/>
                <path fill="#FFFFFF" d="M160.5,20.7V9.2h1.6l3.7,5.8c0.9,1.3,1.5,2.6,2.1,3.7l0,0c-0.1-1.5-0.2-2.9-0.2-4.7V9.2h1.4v11.5h-1.5 l-3.6-5.8c-0.8-1.3-1.6-2.6-2.1-3.8h-0.1c0.1,1.4,0.1,2.8,0.1,4.7v4.9H160.5z"/>
            </g>
            <path fill="url(#sawtli_grad_10)" d="M221.8,29.2c0.4,0.3,0.6,0.8,0.6,1.3v1.6 l-3.2,0v-1.7c0-0.9,0.7-1.7,1.6-1.7C221.1,28.8,221.5,28.9,221.8,29.2z"/>
            <path fill="url(#sawtli_grad_11)" d="M226.6,29.2c0.4,0.3,0.6,0.8,0.6,1.3v1.6 H224v-1.7c0-0.9,0.8-1.7,1.6-1.7C225.9,28.8,226.3,28.9,226.6,29.2z"/>
            <path fill="url(#sawtli_grad_12)" d="M230.4,28.7c-0.8,0-1.7,0.8-1.7,1.7v1.7 c0,0,1.6,0,1.6,0c0.7,0,1.3-0.5,1.5-1.2c0.1-0.4,0.1-0.8,0-1.2c-0.1-0.3-0.2-0.5-0.4-0.7c-0.3-0.2-0.5-0.3-0.9-0.3"/>
            <path fill="url(#sawtli_grad_13)" d="M217,29.2c0.4,0.3,0.6,0.8,0.6,1.3v1.6 h-3.3v-1.7c0-0.9,0.8-1.7,1.7-1.7C216.4,28.8,216.7,28.9,217,29.2z"/>
        </svg>
    );
}

function UserIcon({ className }: IconProps) {
    return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
    );
}

function WarningIcon({ className }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
}

function TrashIcon({ className }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function ReportIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SoundEnhanceIcon({ className }: IconProps) {
    return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={cn("h-6 w-6", className)} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={2} 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
        <path d="M12 6v12"></path>
        <path d="M15 9l-6 6"></path>
        <path d="M9 9l6 6"></path>
    </svg>
    );
}

function LockIcon({ className }: IconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("h-5 w-5", className)} 
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}

function SparklesIcon({ className }: IconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("h-5 w-5", className)} 
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-9a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0V6h-3a1 1 0 11-2 0V6h-3a1 1 0 110-2h3V3a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  );
}

function WandIcon({ className }: IconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("h-5 w-5", className)} 
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-9a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0V6h-3a1 1 0 110-2h3V3a1 1 0 011-1z" clipRule="evenodd" />
      <path d="M11.293 3.293a1 1 0 011.414 0l6 6 2 2a1 1 0 01-1.414 1.414l-8-8a1 1 0 010-1.414z" />
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
