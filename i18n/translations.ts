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
  paragraphPause: {
    ar: 'التوقف بين الفقرات',
    en: 'Pause Between Paragraphs',
    fr: 'Pause entre les paragraphes',
  },
  seconds: {
    ar: 'ث',
    en: 's',
    fr: 's',
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
  stopSpeaking: {
    ar: 'إيقاف الصوت',
    en: 'Stop Audio',
    fr: 'Arrêter l\'Audio',
  },
  generatingSpeech: {
    ar: 'جاري التوليد...',
    en: 'Generating...',
    fr: 'Génération...',
  },
  listening: {
    ar: 'جاري الاستماع...',
    en: 'Listening...',
    fr: 'Écoute en cours...',
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
      en: 'Firebase Configuration Required',
      fr: 'Configuration Firebase Requise',
  },
  feedbackConfigNeededBody: {
      ar: 'ميزة التعليقات معطلة. لتفعيلها، قم بإنشاء مشروع Firebase خاص بك وأضف قيم الإعداد التالية كمتغيرات بيئة (Environment Variables) في منصة النشر الخاصة بك:',
      en: 'The feedback feature is disabled. To enable it, create your own Firebase project and add the following configuration values as Environment Variables in your deployment platform:',
      fr: 'La fonctionnalité de commentaires est désactivée. Pour l\'activer, créez votre propre projet Firebase et ajoutez les valeurs de configuration suivantes en tant que variables d\'environnement sur votre plateforme de déploiement :',
  },
  firebaseSetupGuideTitle: {
      ar: 'عرض دليل الإعداد المفصل',
      en: 'Show Detailed Setup Guide',
      fr: 'Afficher le guide d\'installation détaillé',
  },
  firebaseSetupStep1Title: {
      ar: 'الخطوة 1: إنشاء مشروع Firebase',
      en: 'Step 1: Create a Firebase Project',
      fr: 'Étape 1 : Créer un projet Firebase',
  },
  firebaseSetupStep1Body: {
      ar: 'اذهب إلى منصة Firebase وأنشئ مشروعًا جديدًا. العملية سريعة ومجانية.',
      en: 'Go to the Firebase Console and create a new project. It\'s fast and free.',
      fr: 'Allez sur la console Firebase et créez un nouveau projet. C\'est rapide et gratuit.',
  },
  firebaseSetupStep1Button: {
      ar: 'الذهاب إلى منصة Firebase',
      en: 'Go to Firebase Console',
      fr: 'Aller à la console Firebase',
  },
  firebaseSetupStep2Title: {
      ar: 'الخطوة 2: الحصول على مفاتيح الإعداد',
      en: 'Step 2: Get Your Config Keys',
      fr: 'Étape 2 : Obtenez vos clés de configuration',
  },
  firebaseSetupStep2Body: {
      ar: 'في إعدادات مشروعك، أضف \'تطبيق ويب\' جديد. ستمنحك Firebase كائن `firebaseConfig` يحتوي على مفاتيحك. احتفظ بها للخطوة التالية.',
      en: 'In your project settings, add a new \'Web App\'. Firebase will give you a `firebaseConfig` object containing your keys. Keep them for the next step.',
      fr: 'Dans les paramètres de votre projet, ajoutez une nouvelle \'application Web\'. Firebase vous donnera un objet `firebaseConfig` contenant vos clés. Gardez-les pour la prochaine étape.',
  },
  firebaseSetupStep3Title: {
      ar: 'الخطوة 3: إضافة متغيرات البيئة',
      en: 'Step 3: Add Environment Variables',
      fr: 'Étape 3 : Ajouter des variables d\'environnement',
  },
  firebaseSetupStep3Body: {
      ar: 'اذهب إلى منصة النشر الخاصة بك (Vercel, Netlify, etc.) وأضف المفاتيح التي نسختها كـ \'متغيرات بيئة\'. استخدم هذه الأسماء بالضبط:',
      en: 'Go to your deployment platform (Vercel, Netlify, etc.) and add the keys you copied as \'Environment Variables\'. Use these exact names:',
      fr: 'Allez sur votre plateforme de déploiement (Vercel, Netlify, etc.) et ajoutez les clés que vous avez copiées en tant que \'Variables d\'environnement\'. Utilisez ces noms exacts :',
  },
  firebaseSetupCopyButton: {
      ar: 'نسخ',
      en: 'Copy',
      fr: 'Copier',
  },
  firebaseSetupCopiedButton: {
      ar: 'تم النسخ!',
      en: 'Copied!',
      fr: 'Copié !',
  },
  firebaseSetupStep4Title: {
      ar: 'الخطوة 4: تفعيل وتأمين قاعدة البيانات',
      en: 'Step 4: Enable & Secure Firestore',
      fr: 'Étape 4 : Activer et sécuriser Firestore',
  },
  firebaseSetupStep4Body: {
      ar: 'من لوحة تحكم Firebase، اذهب إلى Firestore Database وأنشئ قاعدة بيانات في \'وضع الإنتاج\'. بعد ذلك، اذهب إلى تبويب \'القواعد\' (Rules) والصق القاعدة الآمنة أدناه. هذه القاعدة تسمح لأي شخص بقراءة وإضافة التعليقات، ولكنها تمنع أي شخص من تعديل أو حذف تعليقات الآخرين.',
      en: 'From the Firebase dashboard, go to Firestore Database and create a database in \'production mode\'. Then, go to the \'Rules\' tab and paste the secure rule below. This rule allows anyone to read and create feedback, but prevents anyone from updating or deleting others\' posts.',
      fr: 'Depuis le tableau de bord Firebase, accédez à la base de données Firestore et créez une base de données en \'mode production\'. Ensuite, allez dans l\'onglet \'Règles\' et collez la règle sécurisée ci-dessous. Cette règle permet à quiconque de lire et de créer des commentaires, mais empêche quiconque de mettre à jour ou de supprimer les messages des autres.',
  },
  firebaseSetupStep5Title: {
      ar: 'الخطوة 5: إعادة النشر',
      en: 'Step 5: Redeploy',
      fr: 'Étape 5 : Redéployer',
  },
  firebaseSetupStep5Body: {
      ar: 'بعد إضافة المتغيرات، قم بإعادة نشر تطبيقك. سيتم تفعيل ميزة التعليقات تلقائيًا.',
      en: 'After adding the variables, redeploy your application. The feedback feature will be enabled automatically.',
      fr: 'Après avoir ajouté les variables, redéployez votre application. La fonctionnalité de commentaires sera activée automatiquement.',
  },
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
