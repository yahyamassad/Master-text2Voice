import React, { useState, useEffect } from 'react';
import { t, Language } from '../i18n/translations';
import { WarningIcon, ChevronDownIcon, CopyIcon, ExternalLinkIcon } from './icons';

interface OwnerSetupGuideProps {
    uiLanguage: Language;
    isApiConfigured: boolean;
    isFirebaseConfigured: boolean;
}

const OwnerSetupGuide: React.FC<OwnerSetupGuideProps> = ({ uiLanguage, isApiConfigured, isFirebaseConfigured }) => {
    const [isGuideOpen, setIsGuideOpen] = useState(true); // Default to open for visibility
    
    // This component will only be rendered if one of the configs is false,
    // so no need to check for that here.
    
    return (
        <div className="p-4 bg-slate-800/80 border border-amber-500/50 rounded-lg text-slate-300 shadow-lg backdrop-blur-sm">
            <button 
                onClick={() => setIsGuideOpen(!isGuideOpen)} 
                className="w-full flex justify-between items-center text-left"
            >
                <div className="flex items-center gap-3">
                    <WarningIcon className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-amber-400">{t('appOwnerNoticeTitle', uiLanguage)}</h3>
                        <p className="text-xs text-slate-400">{t('appOwnerNoticeBody', uiLanguage)}</p>
                    </div>
                </div>
                <ChevronDownIcon className={`transform transition-transform duration-300 ${isGuideOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isGuideOpen && (
                <div className="mt-4 border-t border-slate-600 pt-4 space-y-4 animate-fade-in-down text-sm">
                    {!isApiConfigured && <ApiKeySetup uiLanguage={uiLanguage} />}
                    {!isFirebaseConfigured && <FirebaseSetup uiLanguage={uiLanguage} />}
                </div>
            )}
        </div>
    );
};

// --- Sub-components for specific setup instructions ---

const ApiKeySetup: React.FC<{ uiLanguage: Language }> = ({ uiLanguage }) => (
    <div className="p-3 bg-slate-900/50 rounded-md">
        <h4 className="font-bold text-cyan-400">{t('configNeededTitle', uiLanguage)}</h4>
        <p className="mt-1 text-slate-400">{t('configNeededBody_AppOwner', uiLanguage)}</p>
        <div dir="ltr" className="my-3 p-3 bg-slate-900 rounded-md font-mono text-cyan-300 text-left text-xs">
            <pre className="whitespace-pre-wrap"><code>{`# In your Vercel project settings > Environment Variables:
API_KEY="your-gemini-api-key"`}</code></pre>
        </div>
        <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors text-xs">
            {t('goToVercelButton', uiLanguage)} <ExternalLinkIcon />
        </a>
    </div>
);

const FirebaseSetup: React.FC<{ uiLanguage: Language }> = ({ uiLanguage }) => {
    const [varsCopyButtonText, setVarsCopyButtonText] = useState(t('firebaseSetupCopyButton', uiLanguage));
    const [rulesCopyButtonText, setRulesCopyButtonText] = useState(t('firebaseSetupCopyButton', uiLanguage));
    const [serviceAccountCopyButtonText, setServiceAccountCopyButtonText] = useState(t('firebaseSetupCopyButton', uiLanguage));


     useEffect(() => {
      setVarsCopyButtonText(t('firebaseSetupCopyButton', uiLanguage));
      setRulesCopyButtonText(t('firebaseSetupCopyButton', uiLanguage));
      setServiceAccountCopyButtonText(t('firebaseSetupCopyButton', uiLanguage));
    }, [uiLanguage]);
    
     const firebaseClientEnvVars = [
      'VITE_FIREBASE_API_KEY="your-api-key"',
      'VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"',
      'VITE_FIREBASE_PROJECT_ID="your-project-id"',
      'VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"',
      'VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"',
      'VITE_FIREBASE_APP_ID="your-app-id"',
    ].join('\n');
    
    const firebaseServerEnvVars = [
        '# From your Firebase Service Account JSON file',
        'FIREBASE_PROJECT_ID="your-project-id"',
        'FIREBASE_CLIENT_EMAIL="your-client-email"',
        'FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"',
    ].join('\n');
    
    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId}/{documents=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Allow anyone to read/create feedback, but not edit/delete
    match /feedback/{feedbackId} {
      allow read, create: if true;
      allow update, delete: if false;
    }
  }
}`;

    const handleCopy = (textToCopy: string, buttonType: 'vars' | 'rules' | 'serviceAccount') => {
        navigator.clipboard.writeText(textToCopy);
        if(buttonType === 'vars') {
            setVarsCopyButtonText(t('firebaseSetupCopiedButton', uiLanguage));
            setTimeout(() => setVarsCopyButtonText(t('firebaseSetupCopyButton', uiLanguage)), 2000);
        } else if (buttonType === 'rules') {
            setRulesCopyButtonText(t('firebaseSetupCopiedButton', uiLanguage));
            setTimeout(() => setRulesCopyButtonText(t('firebaseSetupCopyButton', uiLanguage)), 2000);
        } else if (buttonType === 'serviceAccount') {
             setServiceAccountCopyButtonText(t('firebaseSetupCopiedButton', uiLanguage));
             setTimeout(() => setServiceAccountCopyButtonText(t('firebaseSetupCopyButton', uiLanguage)), 2000);
        }
    };

    return (
        <div className="p-3 bg-slate-900/50 rounded-md space-y-4">
            <div>
                <h4 className="font-bold text-cyan-400">{t('feedbackConfigNeededTitle', uiLanguage)}</h4>
                <p className="mt-1 text-slate-400">{t('feedbackConfigNeededBody', uiLanguage)}</p>
            </div>
            {/* Step 1 & 2 */}
            <div>
                <h5 className="font-semibold">1. {t('firebaseSetupStep1Title', uiLanguage)} & {t('firebaseSetupStep2Title', uiLanguage)}</h5>
                <p className="mt-1 text-slate-400 text-xs">{t('firebaseSetupStep1Body', uiLanguage)} {t('firebaseSetupStep2Body', uiLanguage)}</p>
            </div>
             {/* Step 3 */}
            <div>
                <h5 className="font-semibold">2. {t('firebaseSetupStep3Title', uiLanguage)}</h5>
                <p className="mt-1 text-slate-400 text-xs">
                    You need to add **two sets** of variables to Vercel: one for the client (browser) and one for the server (API).
                </p>
                
                <p className="mt-2 font-medium text-sm text-slate-300">Client-Side (for Login & History):</p>
                <div dir="ltr" className="relative my-2 p-3 bg-slate-900 rounded-md font-mono text-xs text-cyan-300 text-left">
                    <pre className="whitespace-pre-wrap"><code>{firebaseClientEnvVars}</code></pre>
                    <button onClick={() => handleCopy(firebaseClientEnvVars, 'vars')} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-1">
                        <CopyIcon /> {varsCopyButtonText}
                    </button>
                </div>
                
                <p className="mt-2 font-medium text-sm text-slate-300">Server-Side (for Feedback API):</p>
                <div dir="ltr" className="relative my-2 p-3 bg-slate-900 rounded-md font-mono text-xs text-lime-300 text-left">
                    <pre className="whitespace-pre-wrap"><code>{firebaseServerEnvVars}</code></pre>
                     <button onClick={() => handleCopy(firebaseServerEnvVars, 'serviceAccount')} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-1">
                        <CopyIcon /> {serviceAccountCopyButtonText}
                    </button>
                </div>
            </div>
            {/* Step 4 */}
            <div>
                <h5 className="font-semibold">3. {t('firebaseSetupStep4Title', uiLanguage)}</h5>
                <p className="mt-1 text-slate-400 text-xs">{t('firebaseSetupStep4Body', uiLanguage)}</p>
                <div dir="ltr" className="relative my-2 p-3 bg-slate-900 rounded-md font-mono text-xs text-yellow-300 text-left">
                    <pre className="whitespace-pre-wrap"><code>{firestoreRules}</code></pre>
                    <button onClick={() => handleCopy(firestoreRules, 'rules')} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-1">
                        <CopyIcon /> {rulesCopyButtonText}
                    </button>
                </div>
            </div>
             {/* Step 5 */}
             <div>
                <h5 className="font-semibold">4. {t('firebaseSetupStep5Title', uiLanguage)}</h5>
                <p className="mt-1 text-slate-400 text-xs">{t('firebaseSetupStep5Body', uiLanguage)}</p>
            </div>
        </div>
    );
};


export default OwnerSetupGuide;
