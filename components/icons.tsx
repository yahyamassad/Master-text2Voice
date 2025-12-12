
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
viewBox="0 0 278.4 87.4" className={className} xmlSpace="preserve">
<defs>
<linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="9.6167" y1="748.4139" x2="9.6167" y2="704.8726" gradientTransform="matrix(1 0 0 1 0 -698.8289)">
	<stop  offset="0" style={{stopColor:"#68C9DD"}}/>
	<stop  offset="1" style={{stopColor:"#2C80FF"}}/>
</linearGradient>
<linearGradient id="SVGID_00000132801438154875939080000012763262335541508280_" gradientUnits="userSpaceOnUse" x1="22.9167" y1="747.506" x2="22.9167" y2="738.7779" gradientTransform="matrix(1 0 0 1 0 -698.8289)">
	<stop  offset="0" style={{stopColor:"#2C80FF"}}/>
	<stop  offset="1" style={{stopColor:"#68C9DD"}}/>
</linearGradient>
<linearGradient id="SVGID_00000170255423437337590060000011633768316140447418_" gradientUnits="userSpaceOnUse" x1="36.3167" y1="747.006" x2="36.3167" y2="738.2779" gradientTransform="matrix(1 0 0 1 0 -698.8289)">
	<stop  offset="0" style={{stopColor:"#2C80FF"}}/>
	<stop  offset="1" style={{stopColor:"#68C9DD"}}/>
</linearGradient>
<linearGradient id="SVGID_00000101788829074467254220000002782531614010507403_" gradientUnits="userSpaceOnUse" x1="49.7167" y1="783.7311" x2="49.7167" y2="739.5948" gradientTransform="matrix(1 0 0 1 0 -698.8289)">
	<stop  offset="0" style={{stopColor:"#2C80FF"}}/>
	<stop  offset="1" style={{stopColor:"#68C9DD"}}/>
</linearGradient>
<linearGradient id="SVGID_00000152956287756691625540000004335489815057901731_" gradientUnits="userSpaceOnUse" x1="-121.5832" y1="47.5771" x2="-121.5832" y2="38.849" gradientTransform="matrix(-1 0 0 -1 -85.2666 122.6488)">
	<stop  offset="0" style={{stopColor:"#68C9DD"}}/>
	<stop  offset="1" style={{stopColor:"#2C80FF"}}/>
</linearGradient>
<linearGradient id="SVGID_00000062909227711662476030000016160204564959929483_" gradientUnits="userSpaceOnUse" x1="-108.1832" y1="47.5771" x2="-108.1832" y2="38.849" gradientTransform="matrix(-1 0 0 -1 -85.2666 122.6488)">
	<stop  offset="0" style={{stopColor:"#68C9DD"}}/>
	<stop  offset="1" style={{stopColor:"#2C80FF"}}/>
</linearGradient>
<linearGradient id="SVGID_00000047029759993910045290000002072777723328029612_" gradientUnits="userSpaceOnUse" x1="-94.7754" y1="47.4884" x2="-94.7754" y2="38.8458" gradientTransform="matrix(-1 0 0 -1 -85.2666 122.6488)">
	<stop  offset="0" style={{stopColor:"#68C9DD"}}/>
	<stop  offset="1" style={{stopColor:"#2C80FF"}}/>
</linearGradient>
<linearGradient id="SVGID_00000180355445767071120970000009208885286820676227_" gradientUnits="userSpaceOnUse" x1="-134.9832" y1="47.5771" x2="-134.9832" y2="38.849" gradientTransform="matrix(-1 0 0 -1 -85.2666 122.6488)">
	<stop  offset="0" style={{stopColor:"#68C9DD"}}/>
	<stop  offset="1" style={{stopColor:"#2C80FF"}}/>
</linearGradient>
<linearGradient id="SVGID_00000101821524496699047990000017419954920444546709_" gradientUnits="userSpaceOnUse" x1="18.9747" y1="755.6826" x2="18.9747" y2="746.9545" gradientTransform="matrix(1 0 0 1 3.9439 -742.1123)">
	<stop  offset="0" style={{stopColor:"#68C9DD"}}/>
	<stop  offset="1" style={{stopColor:"#2C80FF"}}/>
</linearGradient>
<linearGradient id="SVGID_00000048465117449460467440000008941030966867379614_" gradientUnits="userSpaceOnUse" x1="32.3728" y1="755.6826" x2="32.3728" y2="746.9545" gradientTransform="matrix(1 0 0 1 3.9439 -742.1123)">
	<stop  offset="0" style={{stopColor:"#68C9DD"}}/>
	<stop  offset="1" style={{stopColor:"#2C80FF"}}/>
</linearGradient>
<linearGradient id="SVGID_00000031200461035235781590000008563464468900265637_" gradientUnits="userSpaceOnUse" x1="45.8133" y1="755.6797" x2="45.8133" y2="747.0508" gradientTransform="matrix(1 0 0 1 3.9439 -742.1123)">
	<stop  offset="0" style={{stopColor:"#68C9DD"}}/>
	<stop  offset="1" style={{stopColor:"#2C80FF"}}/>
</linearGradient>
<linearGradient id="SVGID_00000118361904043097128620000003911284907815127487_" gradientUnits="userSpaceOnUse" x1="5.6871" y1="755.6826" x2="5.6871" y2="746.9545" gradientTransform="matrix(1 0 0 1 3.9439 -742.1123)">
	<stop  offset="0" style={{stopColor:"#68C9DD"}}/>
	<stop  offset="1" style={{stopColor:"#2C80FF"}}/>
</linearGradient>
</defs>
<g>
	<path fill="#0CABEC" d="M83.1,44.5c-1.4,0-3-0.1-4.5-0.3c-1.5-0.1-3.2-0.4-4.7-0.7c-1.5-0.3-2.8-0.4-3.9-0.7l0.5-5.9
		c1.2,0.1,2.4,0.3,3.9,0.5c1.5,0.1,3,0.3,4.5,0.4s2.8,0.1,3.9,0.1c1.4,0,2.6-0.1,3.4-0.5c0.9-0.4,1.5-0.9,1.9-1.6
		c0.4-0.8,0.7-1.6,0.7-2.8c0-0.9-0.1-1.6-0.5-2.3c-0.4-0.5-1.1-1.1-2-1.4c-1-0.4-2.3-0.7-4.1-1.1c-2.2-0.4-4.1-0.9-5.7-1.4
		c-1.5-0.5-2.8-1.3-3.9-2c-1.1-0.8-1.6-1.9-2.2-3.2c-0.5-1.3-0.7-2.8-0.7-4.6c0-2.8,0.5-5.1,1.5-6.6c1.1-1.6,2.6-2.8,4.5-3.5
		c1.9-0.7,4.2-1.1,6.9-1.1c1.2,0,2.6,0.1,4.1,0.1c1.5,0.1,3.1,0.3,4.6,0.5c1.5,0.1,2.8,0.4,3.9,0.7l-0.4,6.1
		c-1.2-0.1-2.3-0.3-3.9-0.4c-1.4-0.1-2.8-0.3-4.2-0.4c-1.4-0.1-2.6-0.1-3.6-0.1c-1.4,0-2.4,0.1-3.4,0.4c-0.9,0.3-1.5,0.8-2,1.4
		c-0.4,0.7-0.7,1.4-0.7,2.3c0,1.2,0.3,1.9,0.7,2.6c0.4,0.7,1.2,1.1,2.2,1.4c1.1,0.4,2.4,0.8,4.2,1.2c2.2,0.5,3.9,1.1,5.5,1.5
		c1.5,0.5,2.7,1.2,3.8,1.9c0.9,0.8,1.6,1.8,2,3c0.4,1.2,0.7,2.7,0.7,4.5c0,3-0.5,5.3-1.5,7c-1.1,1.8-2.6,3.1-4.5,3.9
		C88.1,44.1,85.8,44.5,83.1,44.5z"/>
	<path fill="#0CABEC" d="M102.7,44.5l9.8-38.7h13.7l9.8,38.7h-7.9l-2.1-7.9h-13.6l-2,7.9H102.7z M113.7,30.4h11.2l-4.4-18.2h-2.4
		L113.7,30.4z"/>
	<path fill="#0CABEC" d="M147.4,44.5l-6.5-38.7h7.9l4.8,31.1h1.3l5.9-30.7h8.8l6,30.7h1.3l4.4-31.1h8l-6.5,38.7h-12.4l-5.5-30.7h0.3
		l-5.6,30.7H147.4z"/>
	<path fill="#0CABEC" d="M206.1,44.4V12.3h-10.4V5.7H224v6.7h-10.1v32.1L206.1,44.4L206.1,44.4z"/>
	<path fill="#0CABEC" d="M232.8,44.4V5.7h7.9v32.1H256v6.7L232.8,44.4L232.8,44.4z"/>
	<path fill="#0CABEC" d="M264.8,44.5V5.8h7.9v38.7H264.8z"/>
</g>
<g>
	<path fill="#C8C8C8" d="M73.2,61.8l-1.6,4.8h-2l5.2-15.2h2.4l5.2,15.2h-2.1l-1.6-4.8H73.2z M78.1,60.2l-1.4-4.4
		c-0.4-0.9-0.5-1.9-0.8-2.8l0,0c-0.3,0.9-0.5,1.9-0.8,2.8l-1.6,4.4H78.1z"/>
	<path fill="#C8C8C8" d="M85.8,51.4v8.9c0,3.5,1.5,4.9,3.6,4.9c2.3,0,3.7-1.5,3.7-4.9v-8.9h2v8.8c0,4.7-2.5,6.6-5.6,6.6
		c-3.1,0-5.4-1.7-5.4-6.4v-8.9L85.8,51.4L85.8,51.4z"/>
	<path fill="#C8C8C8" d="M98.3,51.5c1.2-0.1,2.7-0.3,4.3-0.3c2.8,0,4.8,0.7,6,1.9c1.3,1.2,2.1,3.1,2.1,5.4c0,2.5-0.8,4.5-2.3,5.9
		s-3.7,2.3-6.7,2.3c-1.5,0-2.5-0.1-3.6-0.1V51.5H98.3z M100.3,64.9c0.5,0.1,1.2,0.1,2,0.1c4.3,0,6.4-2.4,6.4-6.4c0-3.6-2-5.8-6-5.8
		c-1.1,0-1.7,0.1-2.3,0.3L100.3,64.9C100.4,64.9,100.3,64.9,100.3,64.9z"/>
	<path fill="#C8C8C8" d="M115.4,51.4v15.2h-2V51.4H115.4z"/>
	<path fill="#C8C8C8" d="M131.7,58.7c0,5.3-3.2,7.9-7,7.9c-4,0-6.8-3.2-6.8-7.6c0-4.8,3.1-7.9,7-7.9C128.9,51.1,131.7,54.2,131.7,58.7z
		 M119.8,59c0,3.3,1.7,6,4.9,6c3.2,0,4.9-2.9,4.9-6.3c0-3.1-1.6-6.2-4.9-6.2C121.5,52.6,119.8,55.7,119.8,59z"/>
	<path fill="#C8C8C8" d="M140.5,66.5l-3.9-15.2h2.1l1.9,7.6c0.4,1.9,0.8,3.9,1.2,5.3l0,0c0.3-1.5,0.7-3.3,1.2-5.3l2-7.6h2l1.9,7.6
		c0.4,1.9,0.8,3.6,1.1,5.2l0,0c0.3-1.7,0.8-3.3,1.2-5.3l2-7.6h2l-4.4,15.2h-2l-1.9-7.9c-0.5-2-0.8-3.5-0.9-4.9l0,0
		c-0.3,1.5-0.7,3.1-1.2,4.9l-2.1,7.9L140.5,66.5L140.5,66.5L140.5,66.5z"/>
	<path fill="#C8C8C8" d="M170,58.7c0,5.3-3.2,7.9-7,7.9c-4,0-6.8-3.2-6.8-7.6c0-4.8,3.1-7.9,7-7.9C167.4,51.1,170,54.2,170,58.7z
		 M158.3,59c0,3.3,1.7,6,4.9,6c3.2,0,4.9-2.9,4.9-6.3c0-3.1-1.6-6.2-4.9-6.2C159.8,52.6,158.3,55.7,158.3,59z"/>
	<path fill="#C8C8C8" d="M172.5,51.5c0.9-0.3,2.4-0.3,3.7-0.3c2.1,0,3.5,0.4,4.4,1.2c0.8,0.7,1.2,1.7,1.2,2.9c0,2-1.3,3.3-2.9,3.9v0.1
		c1.2,0.4,1.9,1.5,2.3,3.1c0.5,2.1,0.8,3.6,1.2,4.3h-2c-0.3-0.4-0.5-1.7-1.1-3.6c-0.4-2.1-1.3-2.9-3.1-2.9h-1.9v6.6h-2V51.5H172.5z
		 M174.5,58.4h2c2.1,0,3.5-1.2,3.5-2.9c0-2-1.5-2.8-3.5-2.8c-0.9,0-1.6,0.1-2,0.1V58.4z"/>
	<path fill="#C8C8C8" d="M184.7,51.4h2v7.2h0.1c0.4-0.5,0.8-1.2,1.2-1.6l4.7-5.6h2.4l-5.5,6.4l5.9,8.7H193l-5.1-7.4l-1.5,1.7v5.8h-2
		V51.4H184.7z"/>
	<path fill="#C8C8C8" d="M196.5,64.1c0.9,0.5,2.1,0.9,3.6,0.9c2,0,3.2-1.1,3.2-2.7c0-1.5-0.8-2.3-2.9-3.1c-2.5-0.9-4-2.1-4-4.4
		c0-2.4,2-4.1,4.9-4.1c1.6,0,2.7,0.4,3.3,0.8l-0.5,1.6c-0.5-0.3-1.5-0.7-2.9-0.7c-2.1,0-2.9,1.2-2.9,2.3c0,1.5,0.9,2.1,3.1,2.9
		c2.5,0.9,3.9,2.3,3.9,4.5c0,2.4-1.7,4.4-5.3,4.4c-1.5,0-3.1-0.4-3.9-0.9L196.5,64.1z"/>
	<path fill="#C8C8C8" d="M210.8,53h-4.7v-1.7h11.3V53h-4.7v13.5h-2V53z"/>
	<path fill="#C8C8C8" d="M219.8,61.8l-1.6,4.8h-2l5.2-15.2h2.4l5.2,15.2h-2.1l-1.6-4.8H219.8z M224.7,60.2l-1.5-4.4
		c-0.4-0.9-0.5-1.9-0.8-2.8l0,0c-0.3,0.9-0.5,1.9-0.8,2.8l-1.5,4.4C220.3,60.2,224.7,60.2,224.7,60.2z"/>
	<path fill="#C8C8C8" d="M232.3,53h-4.7v-1.7h11.2V53h-4.6v13.5h-2V53z"/>
	<path fill="#C8C8C8" d="M242.5,51.4v15.2h-2V51.4H242.5z"/>
	<path fill="#C8C8C8" d="M258.8,58.7c0,5.3-3.2,7.9-7,7.9c-4,0-6.8-3.2-6.8-7.6c0-4.8,3.1-7.9,7-7.9C256.1,51.1,258.8,54.2,258.8,58.7z
		 M247,59c0,3.3,1.7,6,4.9,6c3.2,0,4.9-2.9,4.9-6.3c0-3.1-1.6-6.2-4.9-6.2C248.6,52.6,247,55.7,247,59z"/>
	<path fill="#C8C8C8" d="M261.4,66.5V51.4h2.1l4.9,7.6c1.2,1.7,2,3.5,2.8,4.9l0,0c-0.1-2-0.3-3.9-0.3-6.2v-6.3h1.9v15.2h-2l-4.8-7.6
		c-1.1-1.7-2.1-3.5-2.8-5.1h-0.1c0.1,1.9,0.1,3.7,0.1,6.2v6.4L261.4,66.5L261.4,66.5z"/>
</g>
<g>
	<path fill="#0CABEC" d="M9.8,83.6H9.3c-2.3,0-4.2-1.9-4.2-4.2V8.9c0-2.3,1.9-4.2,4.2-4.2h0.5c2.3,0,4.2,1.9,4.2,4.2v70.4
		C14.1,81.7,12.2,83.6,9.8,83.6z"/>
	<path fill="#0CABEC" d="M23.2,83.6h-0.5c-2.3,0-4.2-1.9-4.2-4.2V8.9c0-2.3,1.9-4.2,4.2-4.2h0.5c2.3,0,4.2,1.9,4.2,4.2v70.4
		C27.5,81.7,25.6,83.6,23.2,83.6z"/>
	<path fill="#0CABEC" d="M36.6,83.6h-0.5c-2.3,0-4.2-1.9-4.2-4.2V8.9c0-2.3,1.9-4.2,4.2-4.2h0.5c2.3,0,4.2,1.9,4.2,4.2v70.4
		C40.8,81.7,38.9,83.6,36.6,83.6z"/>
	<path fill="#0CABEC" d="M50,83.6h-0.5c-2.3,0-4.2-1.9-4.2-4.2V8.9c0-2.3,1.9-4.2,4.2-4.2H50c2.3,0,4.2,1.9,4.2,4.2v70.4
		C54.2,81.7,52.3,83.6,50,83.6z"/>
	<path fill="url(#SVGID_1_)" d="M12.5,5.5c1.1,0.8,1.6,2.1,1.6,3.4v39.4H9.6c-1.1,0-1.8-0.3-2.6-0.8c-1.1-0.8-1.8-2.1-1.8-3.6v-35
		c0-0.5,0-0.8,0.3-1.3c0-0.3,0.3-0.5,0.3-0.8C6.1,6.5,6.1,6.3,6.3,6c0.8-1,2.1-1.6,3.4-1.6C10.9,4.4,11.7,4.7,12.5,5.5z"/>
	<rect x="18.5" y="39.6" fill="url(#SVGID_00000132801438154875939080000012763262335541508280_)" width="8.9" height="8.8"/>
	<rect x="31.9" y="39.1" fill="url(#SVGID_00000170255423437337590060000011633768316140447418_)" width="8.9" height="8.8"/>
	<path fill="url(#SVGID_00000101788829074467254220000002782531614010507403_)" d="M54.2,43.3v35.8c0,2.4-2.1,4.5-4.5,4.5
		c-0.3,0-0.8,0-1.1-0.3c-1.8-0.5-3.4-2.1-3.4-4.2v-40h4.5C52.4,39.1,54.2,40.9,54.2,43.3z"/>
	<path fill="url(#SVGID_00000152956287756691625540000004335489815057901731_)" d="M33.5,82.9c-1.1-0.8-1.6-2.1-1.6-3.4v-4.2
		h8.9v4.4c0,2.3-2.1,4.4-4.5,4.4C35.3,83.9,34.3,83.7,33.5,82.9z"/>
	<path fill="url(#SVGID_00000062909227711662476030000016160204564959929483_)" d="M20.1,82.9c-1.1-0.8-1.6-2.1-1.6-3.4v-4.2
		h8.9v4.4c0,2.3-2.1,4.4-4.5,4.4C21.9,83.9,20.9,83.7,20.1,82.9z"/>
	<path fill="url(#SVGID_00000047029759993910045290000002072777723328029612_)" d="M9.3,84.1c2.5,0.2,4.7-1.8,4.6-4.4v-4.3
		H9.5c-1.9,0-3.7,1.4-4.3,3.1c-0.3,1-0.2,2.1,0.1,3.1c0.2,0.7,0.6,1.3,1.2,1.8C7.3,84,8,84.1,9,84.1"/>
	<path fill="url(#SVGID_00000180355445767071120970000009208885286820676227_)" d="M46.9,82.9c-1.1-0.8-1.6-2.1-1.6-3.4v-4.2
		h8.9v4.4c0,2.3-2.1,4.4-4.5,4.4C48.4,83.9,47.6,83.7,46.9,82.9z"/>
	<path fill="url(#SVGID_00000101821524496699047990000017419954920444546709_)" d="M25.8,5.7c1.1,0.8,1.6,2.1,1.6,3.4v4.2
		h-8.9V8.9c0-2.3,2.1-4.4,4.5-4.4C23.9,4.7,25,4.9,25.8,5.7z"/>
	<path fill="url(#SVGID_00000048465117449460467440000008941030966867379614_)" d="M39.2,5.7c1,0.8,1.6,2.1,1.6,3.4v4.2h-8.9
		V8.9c0-2.3,2.1-4.4,4.4-4.4C37.4,4.7,38.4,4.9,39.2,5.7z"/>
	<path fill="url(#SVGID_00000031200461035235781590000008563464468900265637_)" d="M49.9,4.6c-2.4,0-4.6,2.1-4.6,4.4v4.3h4.5
		c1.9,0,3.7-1.4,4.3-3.1c0.3-1,0.2-2.1-0.1-3.1c-0.2-0.7-0.6-1.3-1.2-1.8c-0.8-0.6-1.5-0.7-2.5-0.7"/>
	<path fill="url(#SVGID_00000118361904043097128620000003911284907815127487_)" d="M12.5,5.7c1.1,0.8,1.6,2.1,1.6,3.4v4.2h-9
		V8.9c0-2.3,2.1-4.4,4.5-4.4C10.9,4.7,11.7,4.9,12.5,5.7z"/>
</g>
<g>
	<path fill="#C8C8C8" d="M137.6,71.8c0.5-0.1,1.4-0.2,2.3-0.2c1.2,0,2,0.2,2.7,0.7c0.5,0.4,0.8,1,0.8,1.7c0,1-0.6,1.8-1.7,2.1l0,0
		c0.9,0.3,2,1,2,2.5c0,0.8-0.4,1.5-0.8,1.9c-0.7,0.6-1.8,0.9-3.3,0.9c-0.9,0-1.5-0.1-1.9-0.1C137.6,81.3,137.6,71.8,137.6,71.8z
		 M138.9,75.7h1.2c1.3,0,2.1-0.7,2.1-1.6c0-1.2-0.9-1.6-2.1-1.6c-0.6,0-0.9,0-1.2,0.1V75.7z M138.9,80.4c0.3,0,0.6,0.1,1.1,0.1
		c1.3,0,2.5-0.4,2.5-1.9c0-1.3-1.2-1.9-2.5-1.9h-1.1V80.4z"/>
	<path fill="#C8C8C8" d="M146.1,78.1c0,1.7,1.2,2.4,2.4,2.4c0.9,0,1.4-0.2,1.9-0.4l0.2,0.9c-0.4,0.2-1.2,0.4-2.3,0.4
		c-2.1,0-3.4-1.4-3.4-3.4c0-2.1,1.2-3.7,3.2-3.7c2.3,0,2.9,2,2.9,3.2c0,0.3,0,0.4,0,0.6L146.1,78.1L146.1,78.1z M149.7,77.2
		c0-0.8-0.4-2-1.8-2c-1.3,0-1.9,1.2-1.9,2H149.7z"/>
	<path fill="#C8C8C8" d="M153,74.5l1.5,4.1c0.2,0.4,0.4,1,0.4,1.4l0,0c0.1-0.4,0.3-1,0.4-1.4l1.4-4h1.3l-1.9,4.9
		c-0.9,2.4-1.5,3.5-2.4,4.2c-0.6,0.5-1.2,0.8-1.6,0.8l-0.4-1.1c0.4-0.1,0.7-0.3,1.2-0.6c0.4-0.3,0.8-0.8,1.1-1.4
		c0.1-0.1,0.1-0.3,0.1-0.3c0-0.1,0-0.2-0.1-0.4l-2.5-6.4L153,74.5L153,74.5z"/>
	<path fill="#C8C8C8" d="M165.3,77.8c0,2.6-1.8,3.6-3.4,3.6c-1.9,0-3.3-1.4-3.3-3.5c0-2.3,1.5-3.6,3.4-3.6
		C164,74.3,165.3,75.7,165.3,77.8z M159.9,77.9c0,1.5,0.9,2.7,2.1,2.7c1.2,0,2.1-1.2,2.1-2.7c0-1.2-0.6-2.7-2.1-2.7
		C160.5,75.3,159.9,76.6,159.9,77.9z"/>
	<path fill="#C8C8C8" d="M167,76.2c0-0.7,0-1.3-0.1-1.9h1.2l0.1,1.2l0,0c0.4-0.7,1.2-1.3,2.3-1.3c1,0,2.5,0.6,2.5,3v4.1h-1.3v-4
		c0-1.2-0.4-2-1.6-2c-0.8,0-1.5,0.6-1.7,1.3c-0.2,0.2-0.2,0.4-0.2,0.5v4.1H167V76.2z"/>
	<path fill="#C8C8C8" d="M180.7,71.2v8.3c0,0.6,0,1.3,0.1,1.8h-1.2l-0.1-1.2l0,0c-0.4,0.8-1.2,1.3-2.4,1.3c-1.7,0-3-1.4-3-3.4
		c0-2.3,1.4-3.6,3-3.6c1.1,0,1.8,0.5,2.1,1.1l0,0v-4.1L180.7,71.2L180.7,71.2z M179.5,77.2c0-0.2,0-0.4-0.1-0.5
		c0.2-0.8-0.9-1.5-1.9-1.5c-1.3,0-2.1,1.2-2.1,2.7c0,1.4,0.7-2.6,2,2.6c0.9,0,1.6-0.5,1.9-1.5c0-0.2,0.1-0.4,0.1-0.5L179.5,77.2
		L179.5,77.2z"/>
	<path fill="#C8C8C8" d="M187.1,72.8h-2.9v-1.1h7.1v1.1h-3v8.6h-1.2C187.1,81.4,187.1,72.8,187.1,72.8z"/>
	<path fill="#C8C8C8" d="M192,78.1c0,1.7,1.2,2.4,2.4,2.4c0.9,0,1.4-0.2,1.9-0.4l0.2,0.9c-0.4,0.2-1.2,0.4-2.3,0.4
		c-2.1,0-3.4-1.4-3.4-3.4c0-2.1,1.2-3.7,3.2-3.7c2.3,0,2.9,2,2.9,3.2c0,0.3,0,0.4,0,0.6L192,78.1L192,78.1z M195.7,77.2
		c0-0.8-0.4-2-1.8-2c-1.3,0-1.9,1.2-1.9,2H195.7z"/>
	<path fill="#C8C8C8" d="M198.9,74.5l1,1.5c0.3,0.4,0.4,0.7,0.7,1.2l0,0c0.3-0.4,0.4-0.8,0.7-1.2l1-1.5h1.3l-2.2,3.3l2.5,3.5h-1.4
		l-1.1-1.6c-0.3-0.4-0.5-0.8-0.7-1.2l0,0c-0.3,0.4-0.4,0.8-0.7,1.2l-1,1.6h-1.4l2.5-3.5l-2.4-3.4L198.9,74.5L198.9,74.5z"/>
	<path fill="#C8C8C8" d="M206.7,72.4v2h1.9v1h-1.9v3.7c0,0.9,0.3,1.3,1,1.3c0.4,0,0.6,0,0.7-0.1l0.1,1c-0.3,0.1-0.6,0.2-1.2,0.2
		c-0.6,0-1.1-0.2-1.3-0.5c-0.4-0.4-0.5-1-0.5-1.9v-3.7h-1.1v-1h1.1v-1.7L206.7,72.4z"/>
	<path fill="#C8C8C8" d="M212.7,77v1h-3.4v-1H212.7z"/>
	<path fill="#C8C8C8" d="M215.6,72.4v2h1.9v1h-1.9v3.7c0,0.9,0.3,1.3,1,1.3c0.4,0,0.6,0,0.7-0.1l0.1,1c-0.3,0.1-0.6,0.2-1.2,0.2
		c-0.6,0-1.1-0.2-1.3-0.5c-0.4-0.4-0.5-1-0.5-1.9v-3.7h-1.1v-1h1.1v-1.7L215.6,72.4z"/>
	<path fill="#C8C8C8" d="M225,77.8c0,2.6-1.8,3.6-3.4,3.6c-1.9,0-3.3-1.4-3.3-3.5c0-2.3,1.5-3.6,3.4-3.6C223.7,74.3,225,75.7,225,77.8z
		 M219.6,77.9c0,1.5,0.9,2.7,2.1,2.7c1.2,0,2.1-1.2,2.1-2.7c0-1.2-0.6-2.7-2.1-2.7S219.6,76.6,219.6,77.9z"/>
	<path fill="#C8C8C8" d="M229.7,77v1h-3.4v-1H229.7z"/>
	<path fill="#C8C8C8" d="M231,79.9c0.5,0.4,1.4,0.6,2.2,0.6c1.3,0,2-0.7,2-1.7c0-0.9-0.5-1.4-1.9-1.9c-1.6-0.5-2.6-1.4-2.6-2.7
		c0-1.5,1.2-2.7,3.1-2.7c1,0,1.7,0.3,2.1,0.4l-0.4,1.1c-0.4-0.2-1-0.4-1.9-0.4c-1.3,0-1.9,0.8-1.9,1.4c0,0.9,0.6,1.3,1.9,1.9
		c1.7,0.6,2.5,1.4,2.5,2.8c0,1.5-1.2,2.8-3.3,2.8c-1,0-1.9-0.3-2.5-0.6L231,79.9z"/>
	<path fill="#C8C8C8" d="M238.1,76.7c0-0.9,0-1.6-0.1-2.3h1.2l0.1,1.2l0,0c0.5-0.9,1.3-1.3,2.5-1.3c1.7,0,2.9,1.4,2.9,3.4
		c0,2.5-1.5,3.6-3.1,3.6c-0.9,0-1.8-0.4-2.1-1.1l0,0v3.7h-1.2L238.1,76.7L238.1,76.7z M239.3,78.5c0,0.2,0,0.4,0.1,0.5
		c0.3,0.9,1,1.5,1.9,1.5c1.3,0,2.1-1.1,2.1-2.7c0-1.4-0.7-2.6-2-2.6c-0.9,0-1.7,0.6-1.9,1.6c0,0.2-0.1,0.4-0.1,0.5L239.3,78.5
		L239.3,78.5z"/>
	<path fill="#C8C8C8" d="M246.9,78.1c0,1.7,1.2,2.4,2.4,2.4c0.9,0,1.4-0.2,1.9-0.4l0.2,0.9c-0.4,0.2-1.2,0.4-2.3,0.4
		c-2.1,0-3.4-1.4-3.4-3.4c0-2.1,1.2-3.7,3.2-3.7c2.3,0,2.9,2,2.9,3.2c0,0.3,0,0.4,0,0.6L246.9,78.1L246.9,78.1z M250.6,77.2
		c0-0.8-0.4-2-1.8-2c-1.3,0-1.9,1.2-1.9,2H250.6z"/>
	<path fill="#C8C8C8" d="M254.1,78.1c0,1.7,1.2,2.4,2.4,2.4c0.9,0,1.4-0.2,1.9-0.4l0.2,0.9c-0.4,0.2-1.2,0.4-2.3,0.4
		c-2.1,0-3.4-1.4-3.4-3.4c0-2.1,1.2-3.7,3.2-3.7c2.3,0,2.9,2,2.9,3.2c0,0.3,0,0.4,0,0.6L254.1,78.1L254.1,78.1z M257.7,77.2
		c0-0.8-0.4-2-1.8-2c-1.3,0-1.9,1.2-1.9,2H257.7z"/>
	<path fill="#C8C8C8" d="M265.4,81.1c-0.4,0.2-1.1,0.4-2,0.4c-2.1,0-3.4-1.4-3.4-3.4s1.5-3.6,3.6-3.6c0.7,0,1.4,0.2,1.8,0.4l-0.3,1
		c-0.3-0.2-0.8-0.4-1.5-0.4c-1.6,0-2.5,1.2-2.5,2.7c0,1.6,1.1,2.7,2.4,2.7c0.7,0,1.2-0.2,1.6-0.4L265.4,81.1z"/>
	<path fill="#C8C8C8" d="M266.9,71.2h1.2v4.2l0,0c0.2-0.4,0.5-0.7,0.9-0.9c0.4-0.2,0.8-0.4,1.3-0.4c1,0,2.5,0.6,2.5,3v4.1h-1.2v-3.9
		c0-1.2-0.4-2-1.6-2c-0.8,0-1.5,0.6-1.7,1.2c-0.1,0.2-0.1,0.4-0.1,0.6v4.2H267L266.9,71.2L266.9,71.2z"/>
	<g>
		<polygon fill="#C8C8C8" points="74.1,72.9 75.5,75.6 78.6,76.1 76.4,78.4 77,81.6 74.1,80.1 71.4,81.6 71.9,78.4 69.6,76.1 
			72.7,75.6 		"/>
		<polygon fill="#C8C8C8" points="87.5,72.9 88.9,75.6 92,76.1 89.8,78.4 90.2,81.6 87.5,80.1 84.6,81.6 85.2,78.4 83,76.1 
			86.1,75.6 		"/>
		<polygon fill="#C8C8C8" points="100.9,72.9 102.2,75.6 105.4,76.1 103.1,78.4 103.6,81.6 100.9,80.1 98,81.6 98.5,78.4 
			96.2,76.1 99.4,75.6 		"/>
		<polygon fill="#C8C8C8" points="114.1,72.9 115.6,75.6 118.8,76.1 116.4,78.4 117,81.6 114.1,80.1 111.4,81.6 111.9,78.4 
			109.6,76.1 112.8,75.6 		"/>
		<polygon fill="#C8C8C8" points="127.5,72.9 128.9,75.6 132,76.1 129.8,78.4 130.4,81.6 127.5,80.1 124.7,81.6 125.3,78.4 
			123,76.1 126.1,75.6 		"/>
	</g>
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
