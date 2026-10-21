import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Language = 'en' | 'ar';

type LanguageState = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  hydrate: () => Promise<void>;
};

const readLanguage = (key: string) => Platform.OS === 'web'
  ? AsyncStorage.getItem(key)
  : SecureStore.getItemAsync(key);
const saveLanguage = (key: string, language: string) => Platform.OS === 'web'
  ? AsyncStorage.setItem(key, language)
  : SecureStore.setItemAsync(key, language);

export const useLanguage = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: async (language) => {
    await saveLanguage('dabbetha-language', language);
    set({ language });
  },
  hydrate: async () => {
    const saved = await readLanguage('dabbetha-language');
    const previous = saved ?? await readLanguage('fixmate-language');
    if (previous === 'en' || previous === 'ar') {
      set({ language: previous });
      if (!saved) await saveLanguage('dabbetha-language', previous);
    }
  },
}));

const translations = {
  en: {
    home: 'Home',
    services: 'Services',
    bookings: 'Bookings',
    profile: 'Profile',
    hello: 'Hello',
    tagline: 'Your Home. Fixed Right.',
    search: 'What needs fixing today?',
    popular: 'Popular services',
    serviceAreas: 'Serving Ajman & Sharjah',
    bookNow: 'Book a service',
    upcoming: 'Your next appointment',
    seeAll: 'See all',
    signIn: 'Sign in',
    createAccount: 'Create account',
    signOut: 'Sign out',
    language: 'Language',
    english: 'English',
    arabic: 'العربية',
    loginRequired: 'Sign in to manage your bookings.',
    noBookings: 'No bookings yet',
    noBookingsHelp: 'Your confirmed service requests will show up here.',
    brand: 'Dabbetha',
    demoMode: 'DEMO MODE',
    simulated: 'Demo only — no real booking or technician dispatch is made.',
    rolePicker: 'Choose a demo experience',
    demoCustomer: 'Customer',
    demoTechnician: 'Technician',
    demoLandlord: 'Property manager',
    demoAdmin: 'Administrator',
    roleHint: 'Select any role to explore its sample screens. No password needed.',
    requestSaved: 'Demo request saved on this phone',
    demoBookingMessage: 'This is a local demonstration only. No technician has been dispatched.',
    statusRequested: 'Requested',
    statusConfirmed: 'Confirmed',
    statusTechnicianAssigned: 'Technician assigned',
    statusTechnicianEnRoute: 'Technician en route',
    statusInProgress: 'In progress',
    statusAwaitingApproval: 'Awaiting approval',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    demoReset: 'Reset demo data',
    switchRole: 'Switch demo role',
    demoEmail: 'Demo account',
    serviceSearch: 'Search services',
    searchExample: 'Try “AC repair”',
    serviceSubtitle: 'Home maintenance across Ajman & Sharjah',
    professionalService: 'Professional home service',
    fromPrice: 'From',
    noSearchResults: 'No services match your search.',
    describeIssue: 'Describe the problem',
    issuePlaceholder: 'What happened? Include useful details for the technician.',
    serviceArea: 'Service area',
    neighborhood: 'Area / neighborhood',
    addressLabel: 'Building, unit and street address',
    addressPlaceholder: 'Building / villa, apartment, street and directions',
    preferredDate: 'Preferred date',
    timeWindow: 'Preferred time window',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    estimatedCallout: 'Estimated call-out from',
    finalChargeNote: 'Final charges depend on inspection. Additional work requires approval.',
    submitRequest: 'Submit service request',
    demoAddressHint: 'Demo address stays on this phone',
    startingPriceNote: 'Starting from AED {price} · final price confirmed by Dabbetha',
    issueRequired: 'Please describe the issue in at least 10 characters',
    areaRequired: 'Enter your area',
    fullAddressRequired: 'Enter a full building and street address',
    dateFormat: 'Use YYYY-MM-DD',
    landlordArea: 'Area',
    resident: 'Resident',
    approve: 'Approve',
    reject: 'Reject',
    demoQuoteNotice: 'Demo quotation only. No payment or work will take place.',
    demoQuoteUpdated: 'Demo quote updated',
    demoChoiceSaved: 'Your choice was saved on this phone only. No real work was authorized.',
    noAssignedJobs: 'No assigned jobs are available.',
    markEnRoute: 'Mark en route',
    startJob: 'Start job',
    submitCompletion: 'Submit completion',
    customerAddress: 'Customer address',
    back: 'Back',
    accountExists: 'Already have an account?',
    noAccount: 'New to Dabbetha?',
    forgotPassword: 'Forgot password?',
    passwordLabel: 'Password',
    emailLabel: 'Email address',
    nameLabel: 'Full name',
    phoneLabel: 'UAE mobile (optional)',
    welcomeBack: 'Welcome back',
    createYourAccount: 'Create your account',
    signInPrompt: 'Sign in securely to manage your service requests.',
    signUpPrompt: 'Create an account to request and track maintenance.',
    signInRequired: 'Sign in required',
    requiredForBooking: 'Sign in before submitting a service request.',
  },
  ar: {
    home: 'الرئيسية',
    services: 'الخدمات',
    bookings: 'الحجوزات',
    profile: 'حسابي',
    hello: 'مرحباً',
    tagline: 'منزلك. صيانة موثوقة.',
    search: 'ما الذي يحتاج إلى صيانة اليوم؟',
    popular: 'الخدمات الأكثر طلباً',
    serviceAreas: 'نخدم عجمان والشارقة',
    bookNow: 'احجز خدمة',
    upcoming: 'موعدك القادم',
    seeAll: 'عرض الكل',
    signIn: 'تسجيل الدخول',
    createAccount: 'إنشاء حساب',
    signOut: 'تسجيل الخروج',
    language: 'اللغة',
    english: 'English',
    arabic: 'العربية',
    loginRequired: 'سجل الدخول لإدارة حجوزاتك.',
    noBookings: 'لا توجد حجوزات بعد',
    noBookingsHelp: 'ستظهر طلبات الخدمة المؤكدة هنا.',
    brand: 'ضبّطها',
    demoMode: 'نسخة تجريبية',
    simulated: 'للعرض فقط — لن يتم إنشاء حجز أو إرسال فني فعلياً.',
    rolePicker: 'اختر تجربة تجريبية',
    demoCustomer: 'عميل',
    demoTechnician: 'فني',
    demoLandlord: 'مدير عقارات',
    demoAdmin: 'مدير النظام',
    roleHint: 'اختر أي دور لاستكشاف الشاشات والبيانات التجريبية. لا تحتاج إلى كلمة مرور.',
    requestSaved: 'تم حفظ الطلب التجريبي على هذا الهاتف',
    demoBookingMessage: 'هذا عرض محلي فقط. لم يتم إرسال فني.',
    statusRequested: 'تم الطلب',
    statusConfirmed: 'تم التأكيد',
    statusTechnicianAssigned: 'تم تعيين فني',
    statusTechnicianEnRoute: 'الفني في الطريق',
    statusInProgress: 'قيد التنفيذ',
    statusAwaitingApproval: 'بانتظار الموافقة',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغي',
    demoReset: 'إعادة تعيين البيانات التجريبية',
    switchRole: 'تغيير الدور التجريبي',
    demoEmail: 'حساب تجريبي',
    serviceSearch: 'ابحث عن خدمة',
    searchExample: 'جرّب «صيانة التكييف»',
    serviceSubtitle: 'خدمات صيانة منزلية في عجمان والشارقة',
    professionalService: 'خدمة منزلية احترافية',
    fromPrice: 'ابتداءً من',
    noSearchResults: 'لم يتم العثور على خدمات.',
    describeIssue: 'صف المشكلة',
    issuePlaceholder: 'ماذا حدث؟ أضف تفاصيل مفيدة للفني.',
    serviceArea: 'منطقة الخدمة',
    neighborhood: 'المنطقة أو الحي',
    addressLabel: 'المبنى والوحدة وعنوان الشارع',
    addressPlaceholder: 'اسم المبنى أو الفيلا ورقم الشقة والشارع',
    preferredDate: 'التاريخ المفضل',
    timeWindow: 'الفترة الزمنية المفضلة',
    morning: 'صباحاً',
    afternoon: 'بعد الظهر',
    evening: 'مساءً',
    estimatedCallout: 'السعر التقديري يبدأ من',
    finalChargeNote: 'تعتمد التكلفة النهائية على المعاينة، وتتطلب الأعمال الإضافية موافقتك.',
    submitRequest: 'إرسال طلب الخدمة',
    demoAddressHint: 'يبقى العنوان التجريبي على هذا الهاتف',
    startingPriceNote: 'ابتداءً من {price} درهم · يؤكد ضبّطها السعر النهائي',
    issueRequired: 'يرجى وصف المشكلة بعشرة أحرف على الأقل',
    areaRequired: 'أدخل المنطقة',
    fullAddressRequired: 'أدخل عنوان المبنى والشارع كاملاً',
    dateFormat: 'استخدم YYYY-MM-DD',
    landlordArea: 'المنطقة',
    resident: 'المقيم',
    approve: 'موافقة',
    reject: 'رفض',
    demoQuoteNotice: 'عرض سعر تجريبي فقط. لن يتم الدفع أو تنفيذ العمل.',
    demoQuoteUpdated: 'تم تحديث العرض التجريبي',
    demoChoiceSaved: 'تم حفظ اختيارك على هذا الهاتف فقط. لم يتم اعتماد أي عمل فعلي.',
    noAssignedJobs: 'لا توجد مهام مسندة حالياً.',
    markEnRoute: 'تحديد: في الطريق',
    startJob: 'بدء العمل',
    submitCompletion: 'إرسال الإنجاز',
    customerAddress: 'عنوان العميل',
    back: 'رجوع',
    accountExists: 'لديك حساب بالفعل؟',
    noAccount: 'جديد في ضبّطها؟',
    forgotPassword: 'نسيت كلمة المرور؟',
    passwordLabel: 'كلمة المرور',
    emailLabel: 'البريد الإلكتروني',
    nameLabel: 'الاسم الكامل',
    phoneLabel: 'رقم الهاتف الإماراتي (اختياري)',
    welcomeBack: 'مرحباً بعودتك',
    createYourAccount: 'أنشئ حسابك',
    signInPrompt: 'سجّل الدخول لإدارة طلبات الخدمة.',
    signUpPrompt: 'أنشئ حساباً لطلب الصيانة ومتابعتها.',
    signInRequired: 'يلزم تسجيل الدخول',
    requiredForBooking: 'سجّل الدخول قبل إرسال طلب الخدمة.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function translate(language: Language, key: TranslationKey): string {
  return translations[language][key];
}

export function translateStatus(language: Language, status: string): string {
  const key = `status${status.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join('')}` as TranslationKey;
  return key in translations[language] ? translations[language][key] : status.replaceAll('_', ' ');
}
