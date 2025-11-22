
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

// STABILITY FIX: Converted StarIcon to a React.FC to correctly handle the 'key' prop
// when used in lists, resolving a type error and React warning in Feedback.tsx.
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
        viewBox="0 0 272.7 85.2" 
        fill="none"
    >
        <style>{`
            .st0{fill:url(#SVGID_1_);}
            .st1{fill:url(#SVGID_00000028288443738825107870000008616033524604476330_);}
            .st2{fill:url(#SVGID_00000146482083565615737740000009295172239352778883_);}
            .st40{fill:#00ADEE;}
            .st41{fill:#FFFFFF;}
        `}</style>
        <defs>
            <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="216.3659" y1="59.1025" x2="216.3659" y2="55.7385">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
            {/* More definitions simplified for React rendering stability, using classes above */}
             <linearGradient id="SVGID_00000067939211316510873680000005259345241850380195_" gradientUnits="userSpaceOnUse" x1="221.1279" y1="59.1025" x2="221.1279" y2="55.7385">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000096771226440017247840000000960709484960110992_" gradientUnits="userSpaceOnUse" x1="225.4919" y1="59.1025" x2="225.4919" y2="55.7385">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000162311912465577060710000013185585916062937216_" gradientUnits="userSpaceOnUse" x1="229.8588" y1="59.4945" x2="229.8588" y2="55.3829">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000063634131985847465800000014589567197920968632_" gradientUnits="userSpaceOnUse" x1="209.6197" y1="63.2319" x2="209.6197" y2="26.257">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000180338592284071364350000012063684620084108215_" gradientUnits="userSpaceOnUse" x1="202.8736" y1="63.2319" x2="202.8736" y2="26.257">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000142172842065646748010000003148145349722621881_" gradientUnits="userSpaceOnUse" x1="196.1274" y1="63.2319" x2="196.1274" y2="26.257">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000047060009938746497280000010928930909785144994_" gradientUnits="userSpaceOnUse" x1="189.3813" y1="63.2319" x2="189.3813" y2="26.2571">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000044898885497090740890000002574367429098065855_" gradientUnits="userSpaceOnUse" x1="182.6352" y1="63.2319" x2="182.6352" y2="26.2569">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000076565797233705041160000006091182027135752067_" gradientUnits="userSpaceOnUse" x1="-15666.3877" y1="63.1851" x2="-15666.3877" y2="26.6211" gradientTransform="matrix(-1 0 0 1 -15457.1045 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000169525739579253493950000012245734031058768574_" gradientUnits="userSpaceOnUse" x1="-15659.6416" y1="63.2243" x2="-15659.6416" y2="26.5856" gradientTransform="matrix(-1 0 0 1 -15457.1045 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000168826181217050357280000007444504418690440883_" gradientUnits="userSpaceOnUse" x1="-15652.8955" y1="63.1851" x2="-15652.8955" y2="26.6211" gradientTransform="matrix(-1 0 0 1 -15457.1045 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000086687797295440196090000012969702460495673251_" gradientUnits="userSpaceOnUse" x1="-15646.1484" y1="63.1236" x2="-15646.1484" y2="26.677" gradientTransform="matrix(-1 0 0 1 -15457.1045 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000179617878845919507820000017168775806800805030_" gradientUnits="userSpaceOnUse" x1="-15639.4023" y1="62.7543" x2="-15639.4023" y2="27.0119" gradientTransform="matrix(-1 0 0 1 -15457.1045 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000039119742978693521140000011714712610594833568_" gradientUnits="userSpaceOnUse" x1="-83.6567" y1="63.2319" x2="-83.6567" y2="26.257" gradientTransform="matrix(-1 0 0 1 153.1559 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000075124430169101779230000017177871772505286046_" gradientUnits="userSpaceOnUse" x1="-90.4028" y1="63.2319" x2="-90.4028" y2="26.257" gradientTransform="matrix(-1 0 0 1 153.1559 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000131359752549735657260000011904866751881165711_" gradientUnits="userSpaceOnUse" x1="-97.149" y1="63.2319" x2="-97.149" y2="26.257" gradientTransform="matrix(-1 0 0 1 153.1559 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000142159810744601901210000006823180624739498430_" gradientUnits="userSpaceOnUse" x1="-103.8951" y1="63.2319" x2="-103.8951" y2="26.2571" gradientTransform="matrix(-1 0 0 1 153.1559 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000140009228383303061620000015880369102609788606_" gradientUnits="userSpaceOnUse" x1="-110.6412" y1="63.2319" x2="-110.6412" y2="26.2569" gradientTransform="matrix(-1 0 0 1 153.1559 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000043429323154840443830000014346824282846742413_" gradientUnits="userSpaceOnUse" x1="-15373.1113" y1="63.1851" x2="-15373.1113" y2="26.6211" gradientTransform="matrix(1 0 0 1 15610.2607 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000126299086420775798750000009129047804066223521_" gradientUnits="userSpaceOnUse" x1="-15366.3652" y1="63.2243" x2="-15366.3652" y2="26.5856" gradientTransform="matrix(1 0 0 1 15610.2607 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000155861942969921882350000003632547389298089639_" gradientUnits="userSpaceOnUse" x1="-15359.6182" y1="63.1851" x2="-15359.6182" y2="26.6211" gradientTransform="matrix(1 0 0 1 15610.2607 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000176741482210996136890000011103532697920772493_" gradientUnits="userSpaceOnUse" x1="-15352.8721" y1="63.1236" x2="-15352.8721" y2="26.677" gradientTransform="matrix(1 0 0 1 15610.2607 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000032606697104235559120000004314409641644174744_" gradientUnits="userSpaceOnUse" x1="-15346.126" y1="62.7543" x2="-15346.126" y2="27.0119" gradientTransform="matrix(1 0 0 1 15610.2607 0)">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000088096450592237290250000014202398714086369687_" gradientUnits="userSpaceOnUse" x1="216.3659" y1="63.2349" x2="216.3659" y2="26.2558">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000049908464019006140450000000647233524625633952_" gradientUnits="userSpaceOnUse" x1="216.704" y1="63.188" x2="216.704" y2="26.6207">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000161612772230780943990000007337159730238471601_" gradientUnits="userSpaceOnUse" x1="229.8586" y1="63.2349" x2="229.8586" y2="26.2558">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000129890626357774070410000006958417499161914509_" gradientUnits="userSpaceOnUse" x1="230.1967" y1="63.188" x2="230.1967" y2="26.6207">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000049221823778780029440000015122597676315436956_" gradientUnits="userSpaceOnUse" x1="221.1279" y1="63.2349" x2="221.1279" y2="26.2558">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000181058878793826606330000018118277165293044375_" gradientUnits="userSpaceOnUse" x1="221.4634" y1="63.188" x2="221.4634" y2="26.6207">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000124149785846977677010000017476931359697769905_" gradientUnits="userSpaceOnUse" x1="225.4919" y1="63.2349" x2="225.4919" y2="26.2558">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000049215382206529580170000000656938444964070062_" gradientUnits="userSpaceOnUse" x1="225.83" y1="63.188" x2="225.83" y2="26.6207">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000095336866740543031780000002386928806665734557_" gradientUnits="userSpaceOnUse" x1="221.1279" y1="32.1173" x2="221.1279" y2="28.7533">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000131331554320406244060000014100761751401778847_" gradientUnits="userSpaceOnUse" x1="225.4919" y1="32.1173" x2="225.4919" y2="28.7533">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000047040766858609216660000010571441550096961726_" gradientUnits="userSpaceOnUse" x1="229.8586" y1="32.1173" x2="229.8586" y2="28.7533">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000155127688123055646660000013880119916412677015_" gradientUnits="userSpaceOnUse" x1="216.3659" y1="45.9135" x2="216.3659" y2="29.1036">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000049904762765040431510000017599008267389263798_" gradientUnits="userSpaceOnUse" x1="221.1279" y1="45.6099" x2="221.1279" y2="42.2459">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000078012611148468503130000016191124524038443665_" gradientUnits="userSpaceOnUse" x1="225.4919" y1="45.6099" x2="225.4919" y2="42.2459">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000071558827800528212680000009803180010282882992_" gradientUnits="userSpaceOnUse" x1="229.8586" y1="59.4061" x2="229.8586" y2="42.5963">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
             <linearGradient id="SVGID_00000150070320560556250640000002485074810890223532_" gradientUnits="userSpaceOnUse" x1="216.3659" y1="32.1173" x2="216.3659" y2="28.7533">
                <stop offset="0" stopColor="#308ECD"/>
                <stop offset="1" stopColor="#6ACBDF"/>
                <stop offset="1" stopColor="#58B847"/>
            </linearGradient>
        </defs>
        <g>
            <path className="st0" d="M216.4,55.7h1.7v1.7c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.1,0-0.2,0c-0.1,0-0.1,0-0.2,0c0,0-0.1,0-0.1,0c-0.1,0-0.3-0.1-0.4-0.2c-0.1-0.1-0.2-0.2-0.3-0.3c0,0-0.1-0.1-0.1-0.1c-0.1-0.1-0.2-0.2-0.2-0.4c0,0,0-0.1,0-0.1c0,0,0-0.1,0-0.1c0-0.1,0-0.1,0-0.2c0-0.1,0-0.1,0-0.2c0-0.1,0-0.1,0-0.2c0-0.6,0.3-1,0.7-1.3C215.6,55.8,216,55.7,216.4,55.7z"/>
            <path style={{fill:'url(#SVGID_00000067939211316510873680000005259345241850380195_)'}} d="M222.8,55.7v1.7c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.7-0.2-1.3-0.8-1.3-1.6v-1.7H222.8z"/>
            <path style={{fill:'url(#SVGID_00000096771226440017247840000000960709484960110992_)'}} d="M227.2,55.7v1.7c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.7-0.2-1.3-0.8-1.3-1.6v-1.7H227.2z"/>
            <path style={{fill:'url(#SVGID_00000162311912465577060710000013185585916062937216_)'}} d="M231.5,55.7v1.7c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.7-0.2-1.3-0.8-1.3-1.6v-1.7H231.5z"/>
            <g>
                <g>
                    <path style={{fill:'url(#SVGID_00000063634131985847465800000014589567197920968632_)'}} d="M209.6,28.7c-0.9,0-1.7,0.8-1.7,1.7v27c0,0.9,0.8,1.7,1.7,1.7c0.9,0,1.7-0.8,1.7-1.7v-27C211.3,29.4,210.6,28.7,209.6,28.7z"/>
                    <path style={{fill:'url(#SVGID_00000180338592284071364350000012063684620084108215_)'}} d="M202.9,25.3c-0.9,0-1.7,0.8-1.7,1.7v33.7c0,0.9,0.8,1.7,1.7,1.7s1.7-0.8,1.7-1.7V27C204.6,26,203.8,25.3,202.9,25.3z"/>
                    <path style={{fill:'url(#SVGID_00000142172842065646748010000003148145349722621881_)'}} d="M196.1,28.7c-0.9,0-1.7,0.8-1.7,1.7v27c0,0.9,0.8,1.7,1.7,1.7c0.9,0,1.7-0.8,1.7-1.7v-27C197.8,29.4,197.1,28.7,196.1,28.7z"/>
                    <path style={{fill:'url(#SVGID_00000047060009938746497280000010928930909785144994_)'}} d="M189.4,32c-0.9,0-1.7,0.8-1.7,1.7V54c0,0.9,0.8,1.7,1.7,1.7c0.9,0,1.7-0.8,1.7-1.7V33.7C191.1,32.8,190.3,32,189.4,32z"/>
                    <path style={{fill:'url(#SVGID_00000044898885497090740890000002574367429098065855_)'}} d="M182.6,38.8c-0.9,0-1.7,0.8-1.7,1.7v6.7c0,0.9,0.8,1.7,1.7,1.7c0.9,0,1.7-0.8,1.7-1.7v-6.7C184.3,39.5,183.6,38.8,182.6,38.8z"/>
                    <g>
                        <path style={{fill:'url(#SVGID_00000076565797233705041160000006091182027135752067_)'}} d="M207.9,30.4v27c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3v-27c0-0.9-0.8-1.7-1.7-1.7c-0.1,0-0.3,0-0.4,0C208.2,29.4,207.9,29.8,207.9,30.4z"/>
                        <path style={{fill:'url(#SVGID_00000169525739579253493950000012245734031058768574_)'}} d="M201.2,27v33.7c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3V27.3c0-0.9-0.8-1.7-1.7-1.7c-0.1,0-0.3,0-0.4,0C201.4,26,201.2,26.5,201.2,27z"/>
                        <path style={{fill:'url(#SVGID_00000168826181217050357280000007444504418690440883_)'}} d="M194.4,30.4v27c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3v-27c0-0.9-0.8-1.7-1.7-1.7c-0.1,0-0.3,0-0.4,0C194.7,29.4,194.4,29.8,194.4,30.4z"/>
                        <path style={{fill:'url(#SVGID_00000086687797295440196090000012969702460495673251_)'}} d="M187.7,33.7V54c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3V34.1c0-0.9-0.8-1.7-1.7-1.7c-0.1,0-0.3,0-0.4,0C187.9,32.7,187.7,33.2,187.7,33.7z"/>
                        <path style={{fill:'url(#SVGID_00000179617878845919507820000017168775806800805030_)'}} d="M180.9,40.5v6.7c0,0.9,0.8,1.7,1.7,1.7c0.1,0,0.3,0,0.4,0c0.4-0.3,0.6-0.8,0.6-1.3v-6.7c0-0.9-0.8-1.7-1.7-1.7c-0.1,0-0.3,0-0.4,0C181.2,39.5,180.9,39.9,180.9,40.5z"/>
                    </g>
                </g>
                <g>
                    <path style={{fill:'url(#SVGID_00000039119742978693521140000011714712610594833568_)'}} d="M236.8,28.7c0.9,0,1.7,0.8,1.7,1.7v27c0,0.9-0.8,1.7-1.7,1.7c-0.9,0-1.7-0.8-1.7-1.7v-27C235.1,29.4,235.9,28.7,236.8,28.7z"/>
                    <path style={{fill:'url(#SVGID_00000075124430169101779230000017177871772505286046_)'}} d="M243.6,25.3c0.9,0,1.7,0.8,1.7,1.7v33.7c0,0.9-0.8,1.7-1.7,1.7c-0.9,0-1.7-0.8-1.7-1.7V27C241.9,26,242.6,25.3,243.6,25.3z"/>
                    <path style={{fill:'url(#SVGID_00000131359752549735657260000011904866751881165711_)'}} d="M250.3,28.7c0.9,0,1.7,0.8,1.7,1.7v27c0,0.9-0.8,1.7-1.7,1.7c-0.9,0-1.7-0.8-1.7-1.7v-27C248.6,29.4,249.4,28.7,250.3,28.7z"/>
                    <path style={{fill:'url(#SVGID_00000142159810744601901210000006823180624739498430_)'}} d="M257.1,32c0.9,0,1.7,0.8,1.7,1.7V54c0,0.9-0.8,1.7-1.7,1.7s-1.7-0.8-1.7-1.7V33.7C255.4,32.8,256.1,32,257.1,32z"/>
                    <path style={{fill:'url(#SVGID_00000140009228383303061620000015880369102609788606_)'}} d="M263.8,38.8c0.9,0,1.7,0.8,1.7,1.7v6.7c0,0.9-0.8,1.7-1.7,1.7c-0.9,0-1.7-0.8-1.7-1.7v-6.7C262.1,39.5,262.9,38.8,263.8,38.8z"/>
                    <g>
                        <path style={{fill:'url(#SVGID_00000043429323154840443830000014346824282846742413_)'}} d="M238.5,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4,0c-0.4-0.3-0.6-0.8-0.6-1.3v-27c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.3,0,0.4,0C238.3,29.4,238.5,29.8,238.5,30.4z"/>
                        <path style={{fill:'url(#SVGID_00000126299086420775798750000009129047804066223521_)'}} d="M245.2,27v33.7c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4,0c-0.4-0.3-0.6-0.8-0.6-1.3V27.3c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.3,0,0.4,0C245,26,245.2,26.5,245.2,27z"/>
                        <path style={{fill:'url(#SVGID_00000155861942969921882350000003632547389298089639_)'}} d="M252,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4,0c-0.4-0.3-0.6-0.8-0.6-1.3v-27c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.3,0,0.4,0C251.8,29.4,252,29.8,252,30.4z"/>
                        <path style={{fill:'url(#SVGID_00000176741482210996136890000011103532697920772493_)'}} d="M258.7,33.7V54c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4,0c-0.4-0.3-0.6-0.8-0.6-1.3V34.1c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.3,0,0.4,0C258.5,32.7,258.7,33.2,258.7,33.7z"/>
                        <path style={{fill:'url(#SVGID_00000032606697104235559120000004314409641644174744_)'}} d="M265.5,40.5v6.7c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4,0c-0.4-0.3-0.6-0.8-0.6-1.3v-6.7c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.3,0,0.4,0C265.2,39.5,265.5,39.9,265.5,40.5z"/>
                    </g>
                </g>
                <g>
                    <path style={{fill:'url(#SVGID_00000088096450592237290250000014202398714086369687_)'}} d="M218.1,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.1,0-0.2,0c-0.1,0-0.1,0-0.2,0c0,0-0.1,0-0.1,0c-0.1,0-0.3-0.1-0.4-0.2c-0.1-0.1-0.2-0.2-0.3-0.3c0,0-0.1-0.1-0.1-0.1c0.1-0.1-0.2-0.2-0.2-0.4c0,0,0-0.1,0-0.1c0,0,0-0.1,0-0.1c0-0.1,0-0.1,0-0.2c0-0.1,0-0.1,0-0.2c0-0.1,0-0.1,0-0.2v-27c0-0.2,0-0.3,0.1-0.5c0-0.1,0.1-0.2,0.1-0.3c0.1-0.1,0.1-0.2,0.2-0.3c0.3-0.4,0.8-0.6,1.3-0.6c0.4,0,0.8,0.1,1.1,0.4C217.8,29.4,218.1,29.8,218.1,30.4z"/>
                    <path style={{fill:'url(#SVGID_00000049908464019006140450000000647233524625633952_)'}} d="M218.1,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.1,0-0.2,0c-0.1,0-0.1,0-0.2,0c-0.4-0.3-0.6-0.8-0.6-1.3v-27c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.3,0,0.4,0C217.8,29.4,218.1,29.8,218.1,30.4z"/>
                </g>
                <g>
                    <path style={{fill:'url(#SVGID_00000161612772230780943990000007337159730238471601_)'}} d="M231.5,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.7-0.2-1.3-0.8-1.3-1.6v-27c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.1,0,0.2,0c0,0,0.1,0,0.1,0c0,0,0.1,0,0.1,0c0.1,0,0.1,0,0.2,0c0.1,0,0.1,0,0.2,0.1c0,0,0.1,0,0.1,0.1h0c0,0,0,0,0.1,0c0,0,0.1,0,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0,0.1,0,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0.1,0.1,0.1,0.1,0.2c0,0,0,0.1,0.1,0.1c0,0,0,0.1,0,0.1c0,0.1,0,0.1,0,0.2c0,0.1,0,0.1,0,0.2C231.5,30.2,231.5,30.3,231.5,30.4z"/>
                    <path style={{fill:'url(#SVGID_00000129890626357774070410000006958417499161914509_)'}} d="M231.5,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.4-0.3-0.6-0.8-0.6-1.3v-27c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.3,0,0.4,0c0,0,0.1,0,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0.1,0.1,0.1,0.1,0.2c0,0,0,0.1,0.1,0.1c0,0,0,0.1,0,0.1c0,0.1,0,0.1,0,0.2c0,0.1,0,0.1,0,0.2C231.5,30.2,231.5,30.3,231.5,30.4z"/>
                </g>
                <g>
                    <path style={{fill:'url(#SVGID_00000049221823778780029440000015122597676315436956_)'}} d="M222.8,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.7-0.2-1.3-0.8-1.3-1.6v-27c0-0.9,0.8-1.7,1.7-1.7c0.4,0,0.8,0.1,1.1,0.4C222.6,29.4,222.8,29.8,222.8,30.4z"/>
                    <path style={{fill:'url(#SVGID_00000181058878793826606330000018118277165293044375_)'}} d="M222.8,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.4-0.3-0.6-0.8-0.6-1.3v-27c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.3,0,0.4,0C222.6,29.4,222.8,29.8,222.8,30.4z"/>
                </g>
                <g>
                    <path style={{fill:'url(#SVGID_00000124149785846977677010000017476931359697769905_)'}} d="M227.2,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.7-0.2-1.3-0.8-1.3-1.6v-27c0-0.9,0.8-1.7,1.7-1.7c0.4,0,0.8,0.1,1.1,0.4C226.9,29.4,227.2,29.8,227.2,30.4z"/>
                    <path style={{fill:'url(#SVGID_00000049215382206529580170000000656938444964070062_)'}} d="M227.2,30.4v27c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.4-0.3-0.6-0.8-0.6-1.3v-27c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.3,0,0.4,0C226.9,29.4,227.2,29.8,227.2,30.4z"/>
                </g>
                <path style={{fill:'url(#SVGID_00000095336866740543031780000002386928806665734557_)'}} d="M222.2,29.1c0.4,0.3,0.6,0.8,0.6,1.3V32h-3.4v-1.7c0-0.9,0.8-1.7,1.7-1.7C221.5,28.7,221.9,28.8,222.2,29.1z"/>
                <path style={{fill:'url(#SVGID_00000131331554320406244060000014100761751401778847_)'}} d="M226.6,29.1c0.4,0.3,0.6,0.8,0.6,1.3V32h-3.4v-1.7c0-0.9,0.8-1.7,1.7-1.7C225.9,28.7,226.3,28.8,226.6,29.1z"/>
                <path style={{fill:'url(#SVGID_00000047040766858609216660000010571441550096961726_)'}} d="M231.5,30.4c0,0.9-0.8,1.7-1.7,1.7h-1.7v-1.7c0-0.9,0.8-1.7,1.7-1.7c0.1,0,0.1,0,0.2,0c0,0,0.1,0,0.1,0c0,0,0.1,0,0.1,0c0.1,0,0.1,0,0.2,0c0.1,0,0.1,0,0.2,0.1c0,0,0.1,0,0.1,0.1h0c0,0,0,0,0.1,0c0,0,0.1,0,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0,0.1,0,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0,0.1,0.1,0.1,0.1c0,0.1,0.1,0.1,0.1,0.2c0,0,0,0.1,0.1,0.1c0,0,0,0.1,0,0.1c0,0.1,0,0.1,0,0.2c0,0.1,0,0.1,0,0.2C231.5,30.2,231.5,30.3,231.5,30.4z"/>
                <path style={{fill:'url(#SVGID_00000155127688123055646660000013880119916412677015_)'}} d="M217.4,29.1c0.4,0.3,0.6,0.8,0.6,1.3v15.2h-1.7c-0.4,0-0.7-0.1-1-0.3c-0.4-0.3-0.7-0.8-0.7-1.4V30.4c0-0.2,0-0.3,0.1-0.5c0-0.1,0.1-0.2,0.1-0.3c0.1-0.1,0.1-0.2,0.2-0.3c0.3-0.4,0.8-0.6,1.3-0.6C216.8,28.7,217.1,28.8,217.4,29.1z"/>
                <rect x="219.4" y="42.2" style={{fill:'url(#SVGID_00000049904762765040431510000017599008267389263798_)'}} width="3.4" height="3.4"/>
                <rect x="223.8" y="42.2" style={{fill:'url(#SVGID_00000078012611148468503130000016191124524038443665_)'}} width="3.4" height="3.4"/>
                <path style={{fill:'url(#SVGID_00000071558827800528212680000009803180010282882992_)'}} d="M231.5,43.8v13.5c0,0.9-0.8,1.7-1.7,1.7c-0.1,0-0.3,0-0.4-0.1c-0.7-0.2-1.3-0.8-1.3-1.6V42.2h1.7C230.8,42.2,231.5,42.9,231.5,43.8z"/>
                <path style={{fill:'url(#SVGID_00000150070320560556250640000002485074810890223532_)'}} d="M217.4,29.1c0.4,0.3,0.6,0.8,0.6,1.3V32h-3.4v-1.7c0-0.9,0.8-1.7,1.7-1.7C216.8,28.7,217.1,28.8,217.4,29.1z"/>
            </g>
        </g>
        <g>
            <g>
                <path className="st40" d="M24.1,57.6c-1.1,0-2.3-0.1-3.5-0.2s-2.5-0.3-3.7-0.5c-1.2-0.2-2.2-0.3-3.1-0.5l0.4-4.6c0.9,0.1,1.9,0.2,3.1,0.4c1.2,0.1,2.3,0.2,3.5,0.3c1.2,0.1,2.2,0.1,3,0.1c1.1,0,2-0.1,2.6-0.4c0.7-0.3,1.2-0.7,1.5-1.3c0.3-0.6,0.5-1.3,0.5-2.2c0-0.7-0.1-1.3-0.4-1.8c-0.3-0.4-0.8-0.8-1.6-1.1c-0.8-0.3-1.8-0.5-3.2-0.8c-1.7-0.3-3.2-0.7-4.4-1.1c-1.2-0.4-2.2-1-3-1.6c-0.8-0.6-1.3-1.5-1.7-2.5c-0.4-1-0.5-2.2-0.5-3.6c0-2.2,0.4-4,1.2-5.2c0.8-1.3,2-2.2,3.5-2.7c1.5-0.5,3.3-0.8,5.4-0.8c0.9,0,2,0.1,3.2,0.1c1.2,0.1,2.4,0.2,3.6,0.4c1.2,0.1,2.2,0.3,3,0.5l-0.3,4.7c-0.9-0.1-1.8-0.2-3-0.3c-1.1-0.1-2.2-0.2-3.3-0.3c-1.1-0.1-2-0.1-2.8-0.1c-1.1,0-1.9,0.1-2.6,0.3c-0.7,0.2-1.2,0.6-1.6,1.1c-0.3,0.5-0.5,1.1-0.5,1.8c0,0.9,0.2,1.5,0.5,2c0.3,0.5,0.9,0.8,1.7,1.1c0.8,0.3,1.9,0.6,3.3,0.9c1.7,0.4,3.1,0.8,4.3,1.2c1.2,0.4,2.1,0.9,2.9,1.5c0.7,0.6,1.3,1.4,1.6,2.3c0.3,0.9,0.5,2.1,0.5,3.5c0,2.3-0.4,4.1-1.2,5.5s-2,2.4-3.5,3C28,57.3,26.2,57.6,24.1,57.6z"/>
                <path className="st40" d="M39.2,57.1L46.6,28h10.3l7.4,29.1h-5.9l-1.6-5.9H46.6l-1.5,5.9H39.2z M47.5,46.5h8.4l-3.3-13.7h-1.8L47.5,46.5z"/>
                <path className="st40" d="M72.8,57.1L67.9,28h5.9l3.6,23.4h1l4.4-23.1h6.6l4.5,23.1h1L98.3,28h6l-4.9,29.1h-9.3L86,34h0.2L82,57.1H72.8z"/>
                <path className="st40" d="M116.9,57.1V33h-7.8v-5h21.3v5h-7.6v24.1H116.9z"/>
                <path className="st40" d="M137,57.1V28h5.9v24.1h11.5v5H137z"/>
                <path className="st40" d="M161,57.1V28h5.9v29.1H161z"/>
            </g>
        </g>
        <g>
            <path className="st41" d="M17.7,17.1l-1.2,3.6H15l3.9-11.5h1.8l3.9,11.5H23l-1.2-3.6H17.7z M21.5,15.9l-1.1-3.3c-0.3-0.7-0.4-1.4-0.6-2.1h0c-0.2,0.7-0.4,1.4-0.6,2.1L18,15.9H21.5z"/>
            <path className="st41" d="M27.3,9.2V16c0,2.6,1.1,3.7,2.7,3.7c1.7,0,2.8-1.1,2.8-3.7V9.2h1.5v6.7c0,3.5-1.9,5-4.3,5c-2.3,0-4.1-1.3-4.1-4.9V9.2H27.3z"/>
            <path className="st41" d="M36.8,9.4c0.9-0.1,2-0.2,3.2-0.2c2.1,0,3.6,0.5,4.6,1.4c1,0.9,1.6,2.3,1.6,4.1c0,1.9-0.6,3.4-1.7,4.5c-1.1,1.1-2.8,1.7-5.1,1.7c-1.1,0-1.9-0.1-2.7-0.1V9.4z M38.3,19.5c0.4,0.1,0.9,0.1,1.5,0.1c3.2,0,4.9-1.8,4.9-4.9c0-2.7-1.5-4.4-4.6-4.4c-0.8,0-1.3,0.1-1.7,0.2V19.5z"/>
            <path className="st41" d="M49.7,9.2v11.5h-1.5V9.2H49.7z"/>
            <path className="st41" d="M62.1,14.8c0,4-2.4,6-5.3,6c-3,0-5.2-2.4-5.2-5.8c0-3.6,2.3-6,5.3-6C60,9,62.1,11.4,62.1,14.8z M53.1,15c0,2.5,1.3,4.6,3.7,4.6c2.4,0,3.7-2.2,3.7-4.8c0-2.3-1.2-4.7-3.7-4.7C54.4,10.2,53.1,12.5,53.1,15z"/>
            <path className="st41" d="M68.8,20.7L65.9,9.2h1.6l1.4,5.8c0.3,1.4,0.6,2.9,0.9,4h0c0.2-1.1,0.5-2.5,0.9-4l1.5-5.8h1.5l1.4,5.8c0.3,1.4,0.6,2.7,0.8,3.9h0c0.2-1.3,0.6-2.5,0.9-4l1.5-5.8h1.5l-3.3,11.5h-1.5l-1.4-6c-0.4-1.5-0.6-2.6-0.7-3.7h0c-0.2,1.1-0.5,2.3-0.9,3.7l-1.6,6H68.8z"/>
            <path className="st41" d="M91.2,14.8c0,4-2.4,6-5.3,6c-3,0-5.2-2.4-5.2-5.8c0-3.6,2.3-6,5.3-6C89.2,9,91.2,11.4,91.2,14.8z M82.3,15c0,2.5,1.3,4.6,3.7,4.6c2.4,0,3.7-2.2,3.7-4.8c0-2.3-1.2-4.7-3.7-4.7C83.5,10.2,82.3,12.5,82.3,15z"/>
            <path className="st41" d="M93.1,9.4c0.7-0.2,1.8-0.2,2.8-0.2c1.6,0,2.6,0.3,3.3,0.9c0.6,0.5,0.9,1.3,0.9,2.2c0,1.5-1,2.5-2.2,2.9v0.1c0.9,0.3,1.4,1.1,1.7,2.3c0.4,1.6,0.6,2.7,0.9,3.2h-1.5c-0.2-0.3-0.4-1.3-0.8-2.7c-0.3-1.6-1-2.2-2.3-2.2h-1.4v5h-1.5V9.4z M94.6,14.6h1.5c1.6,0,2.6-0.9,2.6-2.2c0-1.5-1.1-2.1-2.6-2.1c-0.7,0-1.2,0.1-1.5,0.1V14.6z"/>
            <path className="st41" d="M102.3,9.2h1.5v5.5h0.1c0.3-0.4,0.6-0.9,0.9-1.2l3.5-4.3h1.8l-4.2,4.9l4.5,6.6h-1.8l-3.8-5.6l-1.1,1.3v4.4h-1.5V9.2z"/>
            <path className="st41" d="M111.3,18.9c0.7,0.4,1.6,0.7,2.7,0.7c1.5,0,2.4-0.8,2.4-2c0-1.1-0.6-1.7-2.2-2.3c-1.9-0.7-3-1.6-3-3.3c0-1.8,1.5-3.1,3.7-3.1c1.2,0,2,0.3,2.5,0.6l-0.4,1.2c-0.4-0.2-1.1-0.5-2.2-0.5c-1.6,0-2.2,0.9-2.2,1.7c0,1.1,0.7,1.6,2.3,2.2c1.9,0.7,2.9,1.7,2.9,3.4c0,1.8-1.3,3.3-4,3.3c-1.1,0-2.3-0.3-2.9-0.7L111.3,18.9z"/>
            <path className="st41" d="M122.1,10.5h-3.5V9.2h8.5v1.3h-3.5v10.2h-1.5V10.5z"/>
            <path className="st41" d="M128.9,17.1l-1.2,3.6h-1.5l3.9-11.5h1.8l3.9,11.5h-1.6l-1.2-3.6H128.9z M132.7,15.9l-1.1-3.3c-0.3-0.7-0.4-1.4-0.6-2.1h0c-0.2,0.7-0.4,1.4-0.6,2.1l-1.1,3.3H132.7z"/>
            <path className="st41" d="M138.4,10.5h-3.5V9.2h8.5v1.3h-3.5v10.2h-1.5V10.5z"/>
            <path className="st41" d="M146.1,9.2v11.5h-1.5V9.2H146.1z"/>
            <path className="st41" d="M158.5,14.8c0,4-2.4,6-5.3,6c-3,0-5.2-2.4-5.2-5.8c0-3.6,2.3-6,5.3-6C156.5,9,158.5,11.4,158.5,14.8z M149.6,15c0,2.5,1.3,4.6,3.7,4.6c2.4,0,3.7-2.2,3.7-4.8c0-2.3-1.2-4.7-3.7-4.7C150.8,10.2,149.6,12.5,149.6,15z"/>
            <path className="st41" d="M160.5,20.7V9.2h1.6l3.7,5.8c0.9,1.3,1.5,2.6,2.1,3.7l0,0c-0.1-1.5-0.2-2.9-0.2-4.7V9.2h1.4v11.5h-1.5l-3.6-5.8c-0.8-1.3-1.6-2.6-2.1-3.8l-0.1,0c0.1,1.4,0.1,2.8,0.1,4.7v4.9H160.5z"/>
        </g>
        <g>
            <path className="st41" d="M15,63.2c0.6-0.1,1.6-0.2,2.6-0.2c1.4,0,2.3,0.2,3,0.8c0.6,0.4,0.9,1.1,0.9,1.9c0,1.1-0.7,2-1.9,2.4v0c1,0.3,2.3,1.1,2.3,2.8c0,0.9-0.4,1.7-0.9,2.2c-0.8,0.7-2,1-3.8,1c-1,0-1.7-0.1-2.2-0.1V63.2z M16.5,67.7h1.3c1.5,0,2.4-0.8,2.4-1.8c0-1.3-1-1.8-2.4-1.8c-0.7,0-1,0-1.3,0.1V67.7z M16.5,73c0.3,0,0.7,0.1,1.2,0.1c1.5,0,2.8-0.5,2.8-2.1c0-1.5-1.3-2.1-2.8-2.1h-1.2V73z"/>
            <path className="st41" d="M24.7,70.4c0,1.9,1.3,2.7,2.7,2.7c1,0,1.6-0.2,2.2-0.4l0.2,1c-0.5,0.2-1.4,0.5-2.6,0.5c-2.4,0-3.9-1.6-3.9-4c0-2.4,1.4-4.3,3.7-4.3c2.6,0,3.3,2.3,3.3,3.7c0,0.3,0,0.5,0,0.7H24.7z M28.9,69.4c0-0.9-0.4-2.3-2-2.3c-1.5,0-2.1,1.3-2.2,2.3H28.9z"/>
            <path className="st41" d="M32.6,66.2l1.7,4.7c0.2,0.5,0.4,1.1,0.5,1.6h0c0.1-0.5,0.3-1.1,0.5-1.6l1.6-4.6h1.5l-2.2,5.6c-1,2.7-1.7,4.1-2.7,4.9c-0.7,0.6-1.4,0.9-1.8,0.9l-0.4-1.2c0.4-0.1,0.8-0.3,1.3-0.7c0.4-0.3,0.9-0.9,1.2-1.6c0.1-0.1,0.1-0.3,0.1-0.3c0-0.1,0-0.2-0.1-0.4L31,66.2H32.6z"/>
            <path className="st41" d="M46.7,70.1c0,2.9-2,4.2-3.9,4.2c-2.1,0-3.8-1.6-3.8-4.1c0-2.6,1.7-4.2,3.9-4.2C45.2,66,46.7,67.7,46.7,70.1z M40.5,70.2c0,1.7,1,3,2.4,3c1.4,0,2.4-1.3,2.4-3.1c0-1.3-0.7-3-2.4-3S40.5,68.7,40.5,70.2z"/>
            <path className="st41" d="M48.6,68.3c0-0.8,0-1.5-0.1-2.1h1.3l0.1,1.3h0c0.4-0.8,1.3-1.5,2.6-1.5c1.1,0,2.8,0.7,2.8,3.4v4.7h-1.4v-4.6c0-1.3-0.5-2.3-1.8-2.3c-0.9,0-1.7,0.7-1.9,1.5C50,68.9,50,69.1,50,69.3v4.7h-1.4V68.3z"/>
            <path className="st41" d="M64.4,62.5v9.5c0,0.7,0,1.5,0.1,2h-1.3l-0.1-1.4h0c-0.4,0.9-1.4,1.5-2.7,1.5c-1.9,0-3.4-1.6-3.4-4c0-2.6,1.6-4.2,3.5-4.2c1.2,0,2,0.6,2.4,1.2h0v-4.7H64.4z M63,69.4c0-0.2,0-0.4-0.1-0.6c-0.2-0.9-1-1.7-2.1-1.7c-1.5,0-2.4,1.3-2.4,3.1c0,1.6,0.8,2.9,2.3,2.9c1,0,1.8-0.6,2.1-1.7c0-0.2,0.1-0.4,0.1-0.6V69.4z"/>
            <path className="st41" d="M71.7,64.3h-3.3v-1.2h8.1v1.2h-3.4v9.8h-1.4V64.3z"/>
            <path className="st41" d="M77.4,70.4c0,1.9,1.3,2.7,2.7,2.7c1,0,1.6-0.2,2.2-0.4l0.2,1c-0.5,0.2-1.4,0.5-2.6,0.5c-2.4,0-3.9-1.6-3.9-4c0-2.4,1.4-4.3,3.7-4.3c2.6,0,3.3,2.3,3.3,3.7c0,0.3,0,0.5,0,0.7H77.4z M81.6,69.4c0-0.9-0.4-2.3-2-2.3c-1.5,0-2.1,1.3-2.2,2.3H81.6z"/>
            <path className="st41" d="M85.3,66.2l1.1,1.7c0.3,0.4,0.5,0.8,0.8,1.3h0c0.3-0.5,0.5-0.9,0.8-1.3l1.1-1.7h1.5L88.1,70l2.8,4.1h-1.6l-1.2-1.8c-0.3-0.5-0.6-0.9-0.8-1.4h0c-0.3,0.5-0.5,0.9-0.8,1.4l-1.1,1.8h-1.6l2.8-4l-2.7-3.9H85.3z"/>
            <path className="st41" d="M94.2,63.9v2.3h2.1v1.1h-2.1v4.3c0,1,0.3,1.5,1.1,1.5c0.4,0,0.7,0,0.8-0.1l0.1,1.1c-0.3,0.1-0.7,0.2-1.3,0.2c-0.7,0-1.2-0.2-1.5-0.6c-0.4-0.4-0.6-1.1-0.6-2.1v-4.3h-1.2v-1.1h1.2v-1.9L94.2,63.9z"/>
            <path className="st41" d="M101.1,69.2v1.1h-4v-1.1H101.1z"/>
            <path className="st41" d="M104.5,63.9v2.3h2.1v1.1h-2.1v4.3c0,1,0.3,1.5,1.1,1.5c0.4,0,0.7,0,0.8-0.1l0.1,1.1c-0.3,0.1-0.7,0.2-1.3,0.2c-0.7,0-1.2-0.2-1.5-0.6c-0.4-0.4-0.6-1.1-0.6-2.1v-4.3h-1.2v-1.1h1.2v-1.9L104.5,63.9z"/>
            <path className="st41" d="M115.2,70.1c0,2.9-2,4.2-3.9,4.2c-2.1,0-3.8-1.6-3.8-4.1c0-2.6,1.7-4.2,3.9-4.2C113.7,66,115.2,67.7,115.2,70.1z M109,70.2c0,1.7,1,3,2.4,3c1.4,0,2.4-1.3,2.4-3.1c0-1.3-0.7-3-2.4-3S109,68.7,109,70.2z"/>
            <path className="st41" d="M120.6,69.2v1.1h-4v-1.1H120.6z"/>
            <path className="st41" d="M122.1,72.4c0.6,0.4,1.6,0.7,2.5,0.7c1.5,0,2.3-0.8,2.3-1.9c0-1-0.6-1.6-2.1-2.2c-1.8-0.6-2.9-1.6-2.9-3.1c0-1.7,1.4-3,3.6-3c1.1,0,1.9,0.3,2.4,0.5l-0.4,1.2c-0.4-0.2-1.1-0.5-2.1-0.5c-1.5,0-2.1,0.9-2.1,1.6c0,1,0.7,1.5,2.2,2.1c1.9,0.7,2.8,1.6,2.8,3.2c0,1.7-1.3,3.2-3.8,3.2c-1.1,0-2.2-0.3-2.8-0.7L122.1,72.4z"/>
            <path className="st41" d="M130.3,68.8c0-1,0-1.8-0.1-2.6h1.3l0.1,1.4h0c0.6-1,1.5-1.5,2.8-1.5c1.9,0,3.3,1.6,3.3,4c0,2.8-1.7,4.2-3.6,4.2c-1,0-2-0.5-2.4-1.2h0v4.3h-1.4V68.8z M131.7,70.9c0,0.2,0,0.4,0.1,0.6c0.3,1,1.1,1.7,2.2,1.7c1.5,0,2.4-1.2,2.4-3.1c0-1.6-0.8-2.9-2.3-2.9c-1,0-1.9,0.7-2.2,1.8c0,0.2-0.1,0.4-0.1,0.6V70.9z"/>
            <path className="st41" d="M140.4,70.4c0,1.9,1.3,2.7,2.7,2.7c1,0,1.6-0.2,2.2-0.4l0.2,1c-0.5,0.2-1.4,0.5-2.6,0.5c-2.4,0-3.9-1.6-3.9-4c0-2.4,1.4-4.3,3.7-4.3c2.6,0,3.3,2.3,3.3,3.7c0,0.3,0,0.5,0,0.7H140.4z M144.6,69.4c0-0.9-0.4-2.3-2-2.3c-1.5,0-2.1,1.3-2.2,2.3H144.6z"/>
            <path className="st41" d="M148.6,70.4c0,1.9,1.3,2.7,2.7,2.7c1,0,1.6-0.2,2.2-0.4l0.2,1c-0.5,0.2-1.4,0.5-2.6,0.5c-2.4,0-3.9-1.6-3.9-4c0-2.4,1.4-4.3,3.7-4.3c2.6,0,3.3,2.3,3.3,3.7c0,0.3,0,0.5,0,0.7H148.6z M152.8,69.4c0-0.9-0.4-2.3-2-2.3c-1.5,0-2.1,1.3-2.2,2.3H152.8z"/>
            <path className="st41" d="M161.6,73.8c-0.4,0.2-1.2,0.5-2.3,0.5c-2.4,0-3.9-1.6-3.9-4c0-2.4,1.7-4.2,4.2-4.2c0.8,0,1.6,0.2,2,0.4l-0.3,1.1c-0.3-0.2-0.9-0.4-1.7-0.4c-1.8,0-2.8,1.3-2.8,3c0,1.8,1.2,3,2.7,3c0.8,0,1.4-0.2,1.8-0.4L161.6,73.8z"/>
            <path className="st41" d="M163.3,62.5h1.4v4.9h0c0.2-0.4,0.6-0.8,1-1c0.4-0.2,0.9-0.4,1.5-0.4c1.1,0,2.8,0.7,2.8,3.4v4.7h-1.4v-4.5c0-1.3-0.5-2.3-1.8-2.3c-0.9,0-1.7,0.7-1.9,1.4c-0.1,0.2-0.1,0.4-0.1,0.7v4.8h-1.4V62.5z"/>
        </g>
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
  SparklesIcon
};
