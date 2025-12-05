
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
        className={className} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 400 120" 
        fill="none"
    >
        {/* Abstract Sound Wave / Frequency Bars - Left Side */}
        <g transform="translate(10, 20)">
            <rect x="0" y="25" width="6" height="30" rx="3" fill="#22D3EE" opacity="0.8"/>
            <rect x="10" y="15" width="6" height="50" rx="3" fill="#3B82F6" opacity="0.9"/>
            <rect x="20" y="5" width="6" height="70" rx="3" fill="#22D3EE"/>
            <rect x="30" y="15" width="6" height="50" rx="3" fill="#3B82F6" opacity="0.9"/>
            <rect x="40" y="25" width="6" height="30" rx="3" fill="#22D3EE" opacity="0.8"/>
        </g>

        {/* Text Group */}
        <g transform="translate(60, 0)">
            {/* Top Text: AUDIO WORK STATION */}
            <text x="5" y="30" fontFamily="sans-serif" fontSize="12" fontWeight="bold" letterSpacing="0.2em" fill="#94A3B8">AUDIO WORK STATION</text>
            
            {/* Main Text: SAWTLI */}
            <text x="0" y="75" fontFamily="sans-serif" fontSize="48" fontWeight="900" letterSpacing="0.05em" fill="url(#mainGradient)">SAWTLI</text>
            
            {/* Bottom Text: Beyond */}
            <text x="180" y="95" fontFamily="sans-serif" fontSize="14" fontStyle="italic" fontWeight="500" fill="#22D3EE">Beyond</text>
        </g>

        {/* Gradients */}
        <defs>
            <linearGradient id="mainGradient" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
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
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-9a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0V6h-3a1 1 0 110-2h3V3a1 1 0 011-1z" clipRule="evenodd" />
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
