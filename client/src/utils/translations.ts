export type Language = 'en' | 'et' | 'es' | 'ru';

export const translations = {
  en: {
    // Navigation
    home: 'Home',
    conversations: 'Conversations',
    profile: 'Profile',
    settings: 'Settings',
    login: 'Login',
    logout: 'Log out',
    getStarted: 'Get Started',
    
    // Auth
    welcomeBack: 'Welcome back',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    createAccount: 'Create your account',
    creating: 'Creating...',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    company: 'Company (optional)',
    newHere: 'New here?',
    alreadyHaveAccount: 'Already have an account?',
    createAnAccount: 'Create an account',
    logIn: 'Log in',
    
    // Profile
    name: 'Name',
    currentPlan: 'Current plan',
    
    // Settings
    language: 'Language',
    plan: 'Plan',
    session: 'Session',
    changePlan: 'Change plan',
    save: 'Save',
    saving: 'Saving...',
    appliesToDevice: 'Applies to this device.',
    
    // Common
    pleaseLogIn: 'Please log in to view your profile.',
    yourConversationsWillAppearHere: 'Your conversations will appear here.',
  },
  et: {
    // Navigation
    home: 'Kodu',
    conversations: 'Vestlused',
    profile: 'Profiil',
    settings: 'Seaded',
    login: 'Logi sisse',
    logout: 'Logi välja',
    getStarted: 'Alusta',
    
    // Auth
    welcomeBack: 'Tere tulemast tagasi',
    signIn: 'Logi sisse',
    signingIn: 'Logitakse sisse...',
    createAccount: 'Loo konto',
    creating: 'Loodakse...',
    firstName: 'Eesnimi',
    lastName: 'Perekonnanimi',
    email: 'E-post',
    password: 'Parool',
    confirmPassword: 'Kinnita parool',
    company: 'Ettevõte (valikuline)',
    newHere: 'Uus siin?',
    alreadyHaveAccount: 'Kontot juba olemas?',
    createAnAccount: 'Loo konto',
    logIn: 'Logi sisse',
    
    // Profile
    name: 'Nimi',
    currentPlan: 'Praegune plaan',
    
    // Settings
    language: 'Keel',
    plan: 'Plaan',
    session: 'Sessioon',
    changePlan: 'Muuda plaani',
    save: 'Salvesta',
    saving: 'Salvestatakse...',
    appliesToDevice: 'Kehtib sellel seadmel.',
    
    // Common
    pleaseLogIn: 'Palun logi sisse, et vaadata oma profiili.',
    yourConversationsWillAppearHere: 'Sinu vestlused ilmuvad siia.',
  },
  es: {
    // Navigation
    home: 'Inicio',
    conversations: 'Conversaciones',
    profile: 'Perfil',
    settings: 'Configuración',
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    getStarted: 'Comenzar',
    
    // Auth
    welcomeBack: 'Bienvenido de vuelta',
    signIn: 'Iniciar sesión',
    signingIn: 'Iniciando sesión...',
    createAccount: 'Crear cuenta',
    creating: 'Creando...',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    company: 'Empresa (opcional)',
    newHere: '¿Nuevo aquí?',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    createAnAccount: 'Crear una cuenta',
    logIn: 'Iniciar sesión',
    
    // Profile
    name: 'Nombre',
    currentPlan: 'Plan actual',
    
    // Settings
    language: 'Idioma',
    plan: 'Plan',
    session: 'Sesión',
    changePlan: 'Cambiar plan',
    save: 'Guardar',
    saving: 'Guardando...',
    appliesToDevice: 'Se aplica a este dispositivo.',
    
    // Common
    pleaseLogIn: 'Por favor inicia sesión para ver tu perfil.',
    yourConversationsWillAppearHere: 'Tus conversaciones aparecerán aquí.',
  },
  ru: {
    // Navigation
    home: 'Главная',
    conversations: 'Разговоры',
    profile: 'Профиль',
    settings: 'Настройки',
    login: 'Войти',
    logout: 'Выйти',
    getStarted: 'Начать',
    
    // Auth
    welcomeBack: 'С возвращением',
    signIn: 'Войти',
    signingIn: 'Вход...',
    createAccount: 'Создать аккаунт',
    creating: 'Создание...',
    firstName: 'Имя',
    lastName: 'Фамилия',
    email: 'Электронная почта',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    company: 'Компания (необязательно)',
    newHere: 'Новый здесь?',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    createAnAccount: 'Создать аккаунт',
    logIn: 'Войти',
    
    // Profile
    name: 'Имя',
    currentPlan: 'Текущий план',
    
    // Settings
    language: 'Язык',
    plan: 'План',
    session: 'Сессия',
    changePlan: 'Изменить план',
    save: 'Сохранить',
    saving: 'Сохранение...',
    appliesToDevice: 'Применяется к этому устройству.',
    
    // Common
    pleaseLogIn: 'Пожалуйста, войдите, чтобы просмотреть свой профиль.',
    yourConversationsWillAppearHere: 'Ваши разговоры появятся здесь.',
  },
};

export const getTranslation = (key: string, language: Language = 'en'): string => {
  return translations[language]?.[key] || translations.en[key] || key;
};

export const getCurrentLanguage = (): Language => {
  return (localStorage.getItem('sb_language') as Language) || 'en';
};
