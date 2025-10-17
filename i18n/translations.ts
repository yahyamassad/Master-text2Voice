export type Language = 'ar' | 'en' | 'fr';
export type Direction = 'rtl' | 'ltr';
export interface LanguageListItem {
    code: string;
    name: string;
}

export const translations = {
  title: {
    ar: 'مترجم ومحول نص إلى كلام',
    en: 'Text-to-Speech & Translator',
    fr: 'Traducteur & Synthèse Vocale',
  },
  subtitle: {
    ar: 'ترجم أي نص وتحدث به. مدعوم بالذكاء الاصطناعي من Gemini.',
    en: 'Translate any text and speak it out. Powered by Gemini AI.',
    fr: 'Traduisez n\'importe quel texte et écoutez-le. Propulsé par Gemini AI.',
  },
  placeholder: {
    ar: 'أدخل النص هنا...',
    en: 'Enter text here...',
    fr: 'Entrez le texte ici...',
  },
  translationPlaceholder: {
    ar: 'الترجمة ستظهر هنا...',
    en: 'Translation will appear here...',
    fr: 'La traduction apparaîtra ici...',
  },
  sourceLanguage: {
    ar: 'لغة المصدر',
    en: 'Source Language',
    fr: 'Langue Source',
  },
  targetLanguage: {
    ar: 'اللغة الهدف',
    en: 'Target Language',
    fr: 'Langue Cible',
  },
  maleVoice: {
    ar: 'صوت ذكر',
    en: 'Male Voice',
    fr: 'Voix Masculine',
  },
  femaleVoice: {
    ar: 'صوت أنثى',
    en: 'Female Voice',
    fr: 'Voix Féminine',
  },
  speechSpeed: {
    ar: 'سرعة النطق',
    en: 'Speech Speed',
    fr: 'Vitesse de la parole',
  },
  speedSlow: {
    ar: 'بطيء',
    en: 'Slow',
    fr: 'Lent',
  },
  speedNormal: {
    ar: 'عادي',
    en: 'Normal',
    fr: 'Normal',
  },
  speedFast: {
    ar: 'سريع',
    en: 'Fast',
    fr: 'Rapide',
  },
  translateButton: {
    ar: 'ترجمة',
    en: 'Translate',
    fr: 'Traduire',
  },
  translatingButton: {
    ar: 'جاري الترجمة...',
    en: 'Translating...',
    fr: 'Traduction...',
  },
  speakSource: {
    ar: 'استمع للنص الأصلي',
    en: 'Speak Source Text',
    fr: 'Écouter le Texte Source',
  },
  speakTarget: {
    ar: 'استمع للترجمة',
    en: 'Speak Translation',
    fr: 'Écouter la Traduction',
  },
  downloadFormat: {
    ar: 'صيغة التحميل:',
    en: 'Download Format:',
    fr: 'Format de Téléchargement:',
  },
  downloadButton: {
    ar: 'تحميل الصوت',
    en: 'Download Audio',
    fr: 'Télécharger l\'Audio',
  },
  selectInterfaceLanguage: {
      ar: 'اختر لغة الواجهة',
      en: 'Select interface language',
      fr: 'Sélectionner la langue de l\'interface',
  },
  errorApiNoAudio: {
    ar: 'لم يتم استلام أي بيانات صوتية من الواجهة البرمجية.',
    en: 'No audio data received from the API.',
    fr: 'Aucune donnée audio reçue de l\'API.',
  },
  errorUnexpected: {
    ar: 'حدث خطأ غير متوقع.',
    en: 'An unexpected error occurred.',
    fr: 'Une erreur inattendue est survenue.',
  },
  errorGemini: {
    ar: 'فشل في توليد الصوت. يرجى التحقق من وحدة التحكم لمزيد من التفاصيل.',
    en: 'Failed to generate speech. Please check the console for more details.',
    fr: 'Échec de la génération de la parole. Veuillez consulter la console pour plus de détails.',
  },
  errorTranslate: {
    ar: 'فشلت عملية الترجمة.',
    en: 'Translation failed.',
    fr: 'La traduction a échoué.',
  },
  feedbackTitle: {
    ar: 'آراء المستخدمين',
    en: 'User Feedback',
    fr: 'Avis des Utilisateurs',
  },
  feedbackSubtitle: {
    ar: 'شاهد ما يقوله الآخرون أو شاركنا رأيك!',
    en: 'See what others are saying or share your own feedback!',
    fr: 'Voyez ce que les autres en disent ou partagez votre avis !',
  },
  yourName: {
    ar: 'اسمك (اختياري)',
    en: 'Your Name (Optional)',
    fr: 'Votre Nom (Facultatif)',
  },
  yourComment: {
    ar: 'تعليقك...',
    en: 'Your comment...',
    fr: 'Votre commentaire...',
  },
  yourRating: {
    ar: 'تقييمك:',
    en: 'Your Rating:',
    fr: 'Votre Évaluation :',
  },
  submitFeedback: {
    ar: 'إرسال الرأي',
    en: 'Submit Feedback',
    fr: 'Envoyer l\'avis',
  },
  submittingFeedback: {
    ar: 'جاري الإرسال...',
    en: 'Submitting...',
    fr: 'Envoi en cours...',
  },
  noFeedbackYet: {
    ar: 'لا توجد آراء بعد. كن أول من يشاركنا رأيه!',
    en: 'No feedback yet. Be the first to share your thoughts!',
    fr: 'Aucun avis pour le moment. Soyez le premier à partager votre opinion !',
  },
  feedbackSuccess: {
    ar: 'شكراً لك على مشاركتنا رأيك!',
    en: 'Thank you for your feedback!',
    fr: 'Merci pour votre commentaire !',
  },
  feedbackError: {
    ar: 'فشل إرسال الرأي. الرجاء المحاولة مرة أخرى.',
    en: 'Failed to submit feedback. Please try again.',
    fr: 'Échec de l\'envoi de l\'avis. Veuillez réessayer.',
  },
  feedbackConfigNeededTitle: {
      ar: 'مطلوب إعداد Firebase',
      en: 'Firebase Configuration Needed',
      fr: 'Configuration Firebase Requise',
  },
  feedbackConfigNeededBody: {
      ar: 'ميزة التعليقات معطلة. لتفعيلها، يجب إضافة بيانات اعتماد Firebase كمتغيرات بيئة (Environment Variables) في منصة النشر مثل Vercel. يتم قراءة هذه المتغيرات في ملف `firebaseConfig.ts`.',
      en: 'The feedback feature is disabled. To enable it, Firebase credentials must be added as Environment Variables in your deployment platform (e.g., Vercel). These variables are read by the `firebaseConfig.ts` file.',
      fr: 'La fonctionnalité de commentaires est désactivée. Pour l\'activer, les informations d\'identification Firebase doivent être ajoutées en tant que variables d\'environnement sur votre plateforme de déploiement (par ex. Vercel). Ces variables sont lues par le fichier `firebaseConfig.ts`.',
  }
};

export const languageOptions: { value: Language; label: string; dir: Direction }[] = [
    { value: 'ar', label: 'العربية', dir: 'rtl' },
    { value: 'en', label: 'English', dir: 'ltr' },
    { value: 'fr', label: 'Français', dir: 'ltr' },
];

export const translationLanguages: LanguageListItem[] = [
    { code: 'ar', name: 'Arabic' },
    { code: 'bn', name: 'Bengali' },
    { code: 'zh', name: 'Chinese' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'id', name: 'Indonesian' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ms', name: 'Malay' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'es', name: 'Spanish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' },
];


export const t = (key: keyof typeof translations, lang: Language): string => {
  return translations[key][lang] || translations[key]['en'];
};
