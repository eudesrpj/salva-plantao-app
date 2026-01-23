import { 
  prescriptions, checklists, shifts, notes, tasks, libraryCategories, libraryItems, shiftChecklists, handovers, goals,
  protocols, flashcards, favorites, adminSettings, doctorProfiles, interconsultMessages, usageStats,
  pathologies, pathologyMedications, patientHistory, calculatorSettings, medications,
  drugInteractions, medicationContraindications, prescriptionFavorites, promoCoupons, couponUsages,
  evolutionModels, physicalExamTemplates, signsSymptoms, semiologicalSigns,
  medicalCertificates, attendanceDeclarations, medicalReferrals, referralDestinations, referralReasons,
  prescriptionModels, prescriptionModelMedications, monthlyExpenses, financialGoals,
  plans, subscriptions, payments,
  medicationDilutions, hydrationPresets, memorizeDecks, memorizeCards, cardProgress,
  calculatorAllowedMeds, insertCalculatorAllowedMedSchema, dashboardConfig, insertDashboardConfigSchema,
  quickAccessConfig, insertQuickAccessConfigSchema, donationCauses, insertDonationCauseSchema,
  donations, insertDonationSchema, donationReceipts, insertDonationReceiptSchema,
  doseRules, formulations, emergencyPanelItems, insertEmergencyPanelItemSchema,
  chatRooms, chatRoomMembers, chatMessages, chatContacts, chatBlockedMessages, chatUserBans, chatBannedWords,
  userMedications, insertUserMedicationSchema, userPreferences, insertUserPreferencesSchema,
  adminFeatureFlags, insertAdminFeatureFlagSchema, adminQuickAccessConfig, insertAdminQuickAccessConfigSchema,
  messageOfDayMessages, insertMessageOfDayMessageSchema,
  type ChatRoom, type ChatMessage, type ChatContact, type ChatUserBan, type InsertChatUserBan, type ChatBannedWord, type InsertChatBannedWord,
  type UserMedication, type InsertUserMedication, type UserPreferences, type InsertUserPreferences,
  type AdminFeatureFlag, type InsertAdminFeatureFlag, type AdminQuickAccessConfig, type InsertAdminQuickAccessConfig,
  type MessageOfDayMessage, type InsertMessageOfDayMessage,
  type Prescription, type InsertPrescription, type UpdatePrescriptionRequest,
  type Checklist, type InsertChecklist, type UpdateChecklistRequest,
  type Shift, type InsertShift, type UpdateShiftRequest,
  type Note, type InsertNote, type UpdateNoteRequest,
  type Task, type InsertTask,
  type LibraryCategory, type InsertLibraryCategory,
  type LibraryItem, type InsertLibraryItem,
  type ShiftChecklist, type InsertShiftChecklist,
  type Handover, type InsertHandover, type UpdateHandoverRequest,
  type Goal, type InsertGoal,
  type Protocol, type InsertProtocol, type UpdateProtocolRequest,
  type Flashcard, type InsertFlashcard, type UpdateFlashcardRequest,
  type Favorite, type InsertFavorite,
  type AdminSetting, type InsertAdminSetting,
  type DoctorProfile, type InsertDoctorProfile, type UpdateDoctorProfileRequest,
  type InterconsultMessage, type InsertInterconsultMessage,
  type UsageStat, type InsertUsageStat,
  type Pathology, type InsertPathology, type UpdatePathologyRequest,
  type PathologyMedication, type InsertPathologyMedication, type UpdatePathologyMedicationRequest,
  type PatientHistory, type InsertPatientHistory,
  type CalculatorSetting, type InsertCalculatorSetting, type UpdateCalculatorSettingRequest,
  type Medication, type InsertMedication,
  type DrugInteraction, type InsertDrugInteraction,
  type MedicationContraindication, type InsertMedicationContraindication,
  type PrescriptionFavorite, type InsertPrescriptionFavorite,
  type EvolutionModel, type InsertEvolutionModel,
  type PhysicalExamTemplate, type InsertPhysicalExamTemplate,
  type SignsSymptoms, type InsertSignsSymptoms,
  type SemiologicalSigns, type InsertSemiologicalSigns,
  type MedicalCertificate, type InsertMedicalCertificate,
  type AttendanceDeclaration, type InsertAttendanceDeclaration,
  type MedicalReferral, type InsertMedicalReferral,
  type ReferralDestination, type InsertReferralDestination,
  type ReferralReason, type InsertReferralReason,
  type PrescriptionModel, type InsertPrescriptionModel,
  type PrescriptionModelMedication, type InsertPrescriptionModelMedication,
  type MonthlyExpense, type InsertMonthlyExpense,
  type FinancialGoal, type InsertFinancialGoal,
  type PromoCoupon, type InsertPromoCoupon,
  type CouponUsage, type InsertCouponUsage,
  type Plan, type InsertPlan,
  type Subscription, type InsertSubscription,
  type Payment, type InsertPayment,
  type MedicationDilution, type InsertMedicationDilution,
  type HydrationPreset, type InsertHydrationPreset,
  type MemorizeDeck, type InsertMemorizeDeck,
  type MemorizeCard, type InsertMemorizeCard,
  type CardProgress, type InsertCardProgress,
  type CalculatorAllowedMed, type InsertCalculatorAllowedMed,
  type DashboardConfig, type InsertDashboardConfig,
  type QuickAccessConfig, type InsertQuickAccessConfig,
  type DonationCause, type InsertDonationCause,
  type Donation, type InsertDonation,
  type DonationReceipt, type InsertDonationReceipt,
  type DoseRule, type InsertDoseRule,
  type Formulation, type InsertFormulation,
  type EmergencyPanelItem, type InsertEmergencyPanelItem,
  pushSubscriptions, type PushSubscription, type InsertPushSubscription,
  notificationMessages, type NotificationMessage, type InsertNotificationMessage,
  notificationDeliveries, type NotificationDelivery, type InsertNotificationDelivery,
  notificationDeliveryItems, type NotificationDeliveryItem, type InsertNotificationDeliveryItem,
  notificationReads, type NotificationRead, type InsertNotificationRead,
  userNotificationSettings, type UserNotificationSettings, type InsertUserNotificationSettings,
  emergencyNotificationLimits, type EmergencyNotificationLimit,
  userAdminProfiles, type UserAdminProfile, type InsertUserAdminProfile,
  userUsageStats, type UserUsageStats, type InsertUserUsageStats,
  userCouponUsage, type UserCouponUsage, type InsertUserCouponUsage,
  userBillingStatus, type UserBillingStatus, type InsertUserBillingStatus,
  userOneTimeMessages, type UserOneTimeMessages, type InsertUserOneTimeMessages,
  userPreviewState, type UserPreviewState, type InsertUserPreviewState
} from "@shared/schema";
import { 
  authIdentities, type AuthIdentity, type InsertAuthIdentity,
  emailAuthTokens, type EmailAuthToken, type InsertEmailAuthToken,
  billingPlans, type BillingPlan, type InsertBillingPlan,
  billingOrders, type BillingOrder, type InsertBillingOrder,
  userEntitlements, type UserEntitlement, type InsertUserEntitlement
} from "@shared/models/auth";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql, isNull, lt, gte, gt, inArray, ne, lte } from "drizzle-orm";
import { users } from "@shared/models/auth";

// Helper function to normalize text (remove accents, lowercase, trim)
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface IStorage {
  // Prescriptions
  getPrescriptions(userId?: string, ageGroup?: string): Promise<Prescription[]>;
  searchPrescriptions(query: string, userId?: string): Promise<Prescription[]>;
  getPrescription(id: number): Promise<Prescription | undefined>;
  createPrescription(item: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, item: UpdatePrescriptionRequest): Promise<Prescription>;
  deletePrescription(id: number): Promise<void>;

  // Protocols
  getProtocols(userId?: string, ageGroup?: string): Promise<Protocol[]>;
  searchProtocols(query: string, userId?: string): Promise<Protocol[]>;
  getProtocol(id: number): Promise<Protocol | undefined>;
  getProtocolByTitleNormalized(titleNormalized: string): Promise<Protocol | undefined>;
  createProtocol(item: InsertProtocol): Promise<Protocol>;
  updateProtocol(id: number, item: UpdateProtocolRequest): Promise<Protocol>;
  deleteProtocol(id: number): Promise<void>;
  bulkImportProtocols(items: InsertProtocol[], upsert: boolean): Promise<{ created: number; updated: number; errors: string[] }>;

  // Checklists
  getChecklists(userId?: string, ageGroup?: string): Promise<Checklist[]>;
  searchChecklists(query: string, userId?: string): Promise<Checklist[]>;
  getChecklist(id: number): Promise<Checklist | undefined>;
  getChecklistByTitleNormalized(titleNormalized: string): Promise<Checklist | undefined>;
  createChecklist(item: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: number, item: UpdateChecklistRequest): Promise<Checklist>;
  deleteChecklist(id: number): Promise<void>;
  bulkImportChecklists(items: InsertChecklist[], upsert: boolean): Promise<{ created: number; updated: number; errors: string[] }>;
  getUserChecklistCopy(userId: string, sourceChecklistId: number): Promise<Checklist | undefined>;
  createUserChecklistCopy(userId: string, sourceChecklistId: number, updates?: Partial<InsertChecklist>): Promise<Checklist>;
  deleteUserChecklistCopy(userId: string, sourceChecklistId: number): Promise<void>;

  // Flashcards
  getFlashcards(userId?: string): Promise<Flashcard[]>;
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  createFlashcard(item: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: number, item: UpdateFlashcardRequest): Promise<Flashcard>;
  deleteFlashcard(id: number): Promise<void>;

  // Favorites
  getFavorites(userId: string): Promise<Favorite[]>;
  addFavorite(item: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, itemType: string, itemId: number): Promise<void>;

  // Admin Settings
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(key: string, value: string): Promise<AdminSetting>;
  getAllAdminSettings(): Promise<AdminSetting[]>;

  // Doctor Profiles
  getDoctorProfile(userId: string): Promise<DoctorProfile | undefined>;
  upsertDoctorProfile(item: InsertDoctorProfile): Promise<DoctorProfile>;

  // Interconsult Messages
  getInterconsultMessages(userId: string, channel?: string): Promise<InterconsultMessage[]>;
  createInterconsultMessage(item: InsertInterconsultMessage): Promise<InterconsultMessage>;
  markMessageRead(id: number): Promise<void>;

  // Usage Stats
  logUsage(item: InsertUsageStat): Promise<void>;
  getUsageStats(days?: number): Promise<{ action: string; count: number }[]>;

  // Shifts
  getShifts(userId: string): Promise<Shift[]>;
  getShift(id: number): Promise<Shift | undefined>;
  createShift(item: InsertShift): Promise<Shift>;
  updateShift(id: number, item: UpdateShiftRequest): Promise<Shift>;
  deleteShift(id: number): Promise<void>;
  getShiftStats(userId: string): Promise<{ totalEarnings: number, totalHours: number, upcomingShifts: Shift[], monthlyGoal: number | null }>;

  // Notes
  getNotes(userId: string): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(item: InsertNote): Promise<Note>;
  updateNote(id: number, item: UpdateNoteRequest): Promise<Note>;
  deleteNote(id: number): Promise<void>;

  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(item: InsertTask): Promise<Task>;
  updateTask(id: number, item: Partial<InsertTask>): Promise<Task>;
  toggleTask(id: number): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Library
  getLibraryCategories(): Promise<LibraryCategory[]>;
  createLibraryCategory(item: InsertLibraryCategory): Promise<LibraryCategory>;
  getLibraryItems(categoryId: number): Promise<LibraryItem[]>;
  createLibraryItem(item: InsertLibraryItem): Promise<LibraryItem>;

  // Handovers
  getHandovers(userId: string): Promise<Handover[]>;
  getHandover(id: number): Promise<Handover | undefined>;
  createHandover(item: InsertHandover): Promise<Handover>;
  updateHandover(id: number, item: UpdateHandoverRequest): Promise<Handover>;
  deleteHandover(id: number): Promise<void>;

  // Goals
  getGoal(userId: string, month: string): Promise<Goal | undefined>;
  setGoal(item: InsertGoal): Promise<Goal>;

  // Pathologies
  getPathologies(userId?: string, ageGroup?: string): Promise<Pathology[]>;
  getPublicPathologies(ageGroup?: string): Promise<Pathology[]>;
  getUserPathologies(userId: string, ageGroup?: string): Promise<Pathology[]>;
  searchPathologies(query: string, userId?: string): Promise<Pathology[]>;
  getPathology(id: number): Promise<Pathology | undefined>;
  getPathologyByNameAndAgeGroup(name: string, ageGroup: string): Promise<Pathology | undefined>;
  getPathologyByNameNormalized(nameNormalized: string): Promise<Pathology | undefined>;
  createPathology(item: InsertPathology): Promise<Pathology>;
  createPathologiesBulk(items: InsertPathology[]): Promise<Pathology[]>;
  bulkImportPathologies(items: InsertPathology[], upsert: boolean): Promise<{ created: number; updated: number; errors: string[] }>;
  duplicatePathologyToAgeGroup(id: number, targetAgeGroup: string): Promise<Pathology | null>;
  updatePathology(id: number, item: UpdatePathologyRequest): Promise<Pathology>;
  deletePathology(id: number): Promise<void>;

  // Pathology Medications
  getPathologyMedications(pathologyId: number): Promise<PathologyMedication[]>;
  getPathologyMedicationById(id: number): Promise<PathologyMedication | undefined>;
  createPathologyMedication(item: InsertPathologyMedication): Promise<PathologyMedication>;
  updatePathologyMedication(id: number, item: UpdatePathologyMedicationRequest): Promise<PathologyMedication>;
  deletePathologyMedication(id: number): Promise<void>;

  // Patient History
  getPatientHistory(userId: string): Promise<PatientHistory[]>;
  searchPatientHistory(userId: string, patientName: string): Promise<PatientHistory[]>;
  createPatientHistory(item: InsertPatientHistory): Promise<PatientHistory>;
  deletePatientHistory(id: number): Promise<void>;

  // Calculator Settings
  getCalculatorSettings(): Promise<CalculatorSetting[]>;
  createCalculatorSetting(item: InsertCalculatorSetting): Promise<CalculatorSetting>;
  updateCalculatorSetting(id: number, item: UpdateCalculatorSettingRequest): Promise<CalculatorSetting>;
  deleteCalculatorSetting(id: number): Promise<void>;

  // Dose Rules
  getDoseRules(context?: string): Promise<DoseRule[]>;
  getDoseRulesByMedication(medicationName: string): Promise<DoseRule[]>;
  createDoseRule(item: InsertDoseRule): Promise<DoseRule>;
  updateDoseRule(id: number, item: Partial<InsertDoseRule>): Promise<DoseRule>;
  deleteDoseRule(id: number): Promise<void>;

  // Formulations
  getFormulations(medicationName?: string): Promise<Formulation[]>;
  createFormulation(item: InsertFormulation): Promise<Formulation>;
  updateFormulation(id: number, item: Partial<InsertFormulation>): Promise<Formulation>;
  deleteFormulation(id: number): Promise<void>;

  // Medications Library
  getMedications(ageGroup?: string): Promise<Medication[]>;
  searchMedications(query: string): Promise<Medication[]>;
  getMedication(id: number): Promise<Medication | undefined>;
  createMedication(item: InsertMedication): Promise<Medication>;
  updateMedication(id: number, item: Partial<InsertMedication>): Promise<Medication>;
  deleteMedication(id: number): Promise<void>;

  // Removed old User Preferences interface - replaced with new ones below

  // Drug Interactions
  getDrugInteractions(): Promise<DrugInteraction[]>;
  checkDrugInteraction(drug1: string, drug2: string): Promise<DrugInteraction | undefined>;
  createDrugInteraction(item: InsertDrugInteraction): Promise<DrugInteraction>;
  updateDrugInteraction(id: number, item: Partial<InsertDrugInteraction>): Promise<DrugInteraction>;
  deleteDrugInteraction(id: number): Promise<void>;

  // Medication Contraindications
  getMedicationContraindications(medicationName?: string): Promise<MedicationContraindication[]>;
  createMedicationContraindication(item: InsertMedicationContraindication): Promise<MedicationContraindication>;
  updateMedicationContraindication(id: number, item: Partial<InsertMedicationContraindication>): Promise<MedicationContraindication>;
  deleteMedicationContraindication(id: number): Promise<void>;

  // Promo Coupons
  getPromoCoupons(): Promise<PromoCoupon[]>;
  getPromoCouponByCode(code: string): Promise<PromoCoupon | undefined>;
  createPromoCoupon(item: InsertPromoCoupon): Promise<PromoCoupon>;
  updatePromoCoupon(id: number, item: Partial<InsertPromoCoupon>): Promise<PromoCoupon>;
  deletePromoCoupon(id: number): Promise<void>;
  useCoupon(couponId: number, userId: string): Promise<CouponUsage>;

  // Prescription Favorites
  getPrescriptionFavorites(userId: string): Promise<PrescriptionFavorite[]>;
  getPrescriptionFavorite(id: number): Promise<PrescriptionFavorite | undefined>;
  getPrescriptionFavoriteByToken(token: string): Promise<PrescriptionFavorite | undefined>;
  createPrescriptionFavorite(item: InsertPrescriptionFavorite): Promise<PrescriptionFavorite>;
  updatePrescriptionFavorite(id: number, item: Partial<InsertPrescriptionFavorite>): Promise<PrescriptionFavorite>;
  deletePrescriptionFavorite(id: number): Promise<void>;

  // Prescription Suggestions (Internal AI - no external API)
  searchPrescriptionSuggestions(params: {
    diagnosis?: string;
    ageGroup?: string;
    userId?: string;
  }): Promise<Array<Prescription & { relevanceScore: number }>>;

  // Evolution Models
  getEvolutionModels(userId?: string, category?: string): Promise<EvolutionModel[]>;
  createEvolutionModel(item: InsertEvolutionModel): Promise<EvolutionModel>;
  updateEvolutionModel(id: number, item: Partial<InsertEvolutionModel>): Promise<EvolutionModel>;
  deleteEvolutionModel(id: number): Promise<void>;

  // Physical Exam Templates
  getPhysicalExamTemplates(userId?: string): Promise<PhysicalExamTemplate[]>;
  createPhysicalExamTemplate(item: InsertPhysicalExamTemplate): Promise<PhysicalExamTemplate>;
  updatePhysicalExamTemplate(id: number, item: Partial<InsertPhysicalExamTemplate>): Promise<PhysicalExamTemplate>;
  deletePhysicalExamTemplate(id: number): Promise<void>;

  // Signs and Symptoms
  getSignsSymptoms(userId?: string, category?: string): Promise<SignsSymptoms[]>;
  createSignsSymptoms(item: InsertSignsSymptoms): Promise<SignsSymptoms>;
  updateSignsSymptoms(id: number, item: Partial<InsertSignsSymptoms>): Promise<SignsSymptoms>;
  deleteSignsSymptoms(id: number): Promise<void>;

  // Semiological Signs
  getSemiologicalSigns(userId?: string, category?: string): Promise<SemiologicalSigns[]>;
  createSemiologicalSigns(item: InsertSemiologicalSigns): Promise<SemiologicalSigns>;
  updateSemiologicalSigns(id: number, item: Partial<InsertSemiologicalSigns>): Promise<SemiologicalSigns>;
  deleteSemiologicalSigns(id: number): Promise<void>;

  // Medical Certificates
  getMedicalCertificates(userId: string): Promise<MedicalCertificate[]>;
  createMedicalCertificate(item: InsertMedicalCertificate): Promise<MedicalCertificate>;
  deleteMedicalCertificate(id: number): Promise<void>;

  // Attendance Declarations
  getAttendanceDeclarations(userId: string): Promise<AttendanceDeclaration[]>;
  createAttendanceDeclaration(item: InsertAttendanceDeclaration): Promise<AttendanceDeclaration>;
  deleteAttendanceDeclaration(id: number): Promise<void>;

  // Medical Referrals
  getMedicalReferrals(userId: string): Promise<MedicalReferral[]>;
  createMedicalReferral(item: InsertMedicalReferral): Promise<MedicalReferral>;
  deleteMedicalReferral(id: number): Promise<void>;

  // Referral Destinations
  getReferralDestinations(): Promise<ReferralDestination[]>;
  createReferralDestination(item: InsertReferralDestination): Promise<ReferralDestination>;
  updateReferralDestination(id: number, item: Partial<InsertReferralDestination>): Promise<ReferralDestination>;
  deleteReferralDestination(id: number): Promise<void>;

  // Referral Reasons
  getReferralReasons(): Promise<ReferralReason[]>;
  createReferralReason(item: InsertReferralReason): Promise<ReferralReason>;
  updateReferralReason(id: number, item: Partial<InsertReferralReason>): Promise<ReferralReason>;
  deleteReferralReason(id: number): Promise<void>;

  // Monthly Expenses
  getMonthlyExpenses(userId: string): Promise<MonthlyExpense[]>;
  createMonthlyExpense(item: InsertMonthlyExpense): Promise<MonthlyExpense>;
  updateMonthlyExpense(id: number, item: Partial<InsertMonthlyExpense>): Promise<MonthlyExpense>;
  deleteMonthlyExpense(id: number): Promise<void>;

  // Financial Goals
  getFinancialGoals(userId: string): Promise<FinancialGoal[]>;
  createFinancialGoal(item: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: number, item: Partial<InsertFinancialGoal>): Promise<FinancialGoal>;
  deleteFinancialGoal(id: number): Promise<void>;

  // Plans
  getPlans(): Promise<Plan[]>;
  getActivePlan(): Promise<Plan | undefined>;
  getPlan(id: number): Promise<Plan | undefined>;
  getPlanBySlug(slug: string): Promise<Plan | undefined>;
  createPlan(item: InsertPlan): Promise<Plan>;
  updatePlan(id: number, item: Partial<InsertPlan>): Promise<Plan>;
  upsertPlans(): Promise<void>;

  // Subscriptions
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  getActiveSubscription(userId: string): Promise<Subscription | undefined>;
  getAllSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByProviderId(providerSubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(item: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, item: Partial<InsertSubscription>): Promise<Subscription>;

  // Payments
  getUserPayments(userId: string): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByProviderId(providerPaymentId: string): Promise<Payment | undefined>;
  createPayment(item: InsertPayment): Promise<Payment>;
  updatePayment(id: number, item: Partial<InsertPayment>): Promise<Payment>;

  // Medication Dilutions
  getMedicationDilutions(medicationId?: number): Promise<MedicationDilution[]>;
  getMedicationDilution(id: number): Promise<MedicationDilution | undefined>;
  getMedicationDilutionByName(medicationName: string): Promise<MedicationDilution | undefined>;
  createMedicationDilution(item: InsertMedicationDilution): Promise<MedicationDilution>;
  updateMedicationDilution(id: number, item: Partial<InsertMedicationDilution>): Promise<MedicationDilution>;
  deleteMedicationDilution(id: number): Promise<void>;
  upsertMedicationDilution(item: InsertMedicationDilution): Promise<MedicationDilution>;

  // Hydration Presets
  getHydrationPresets(patientType?: string): Promise<HydrationPreset[]>;
  getHydrationPreset(id: number): Promise<HydrationPreset | undefined>;
  createHydrationPreset(item: InsertHydrationPreset): Promise<HydrationPreset>;
  updateHydrationPreset(id: number, item: Partial<InsertHydrationPreset>): Promise<HydrationPreset>;
  deleteHydrationPreset(id: number): Promise<void>;

  // Medication Service (centralized)
  getMedicationByNormalizedName(nameNormalized: string): Promise<Medication | undefined>;
  upsertMedication(item: InsertMedication): Promise<Medication>;
  searchMedicationsAdvanced(query: string, options?: { ageGroup?: string; category?: string }): Promise<Medication[]>;

  // Memorization Decks
  getMemorizeDecks(userId?: string): Promise<MemorizeDeck[]>;
  getMemorizeDeck(id: number): Promise<MemorizeDeck | undefined>;
  createMemorizeDeck(item: InsertMemorizeDeck): Promise<MemorizeDeck>;
  updateMemorizeDeck(id: number, item: Partial<InsertMemorizeDeck>): Promise<MemorizeDeck>;
  deleteMemorizeDeck(id: number): Promise<void>;

  // Memorization Cards
  getMemorizeCards(deckId: number): Promise<MemorizeCard[]>;
  getMemorizeCard(id: number): Promise<MemorizeCard | undefined>;
  createMemorizeCard(item: InsertMemorizeCard): Promise<MemorizeCard>;
  createMemorizeCardsBulk(items: InsertMemorizeCard[]): Promise<MemorizeCard[]>;
  updateMemorizeCard(id: number, item: Partial<InsertMemorizeCard>): Promise<MemorizeCard>;
  deleteMemorizeCard(id: number): Promise<void>;

  // Card Progress (Spaced Repetition)
  getCardProgress(userId: string, cardId: number): Promise<CardProgress | undefined>;
  getCardsToReview(userId: string, deckId: number): Promise<(MemorizeCard & { progress?: CardProgress })[]>;
  upsertCardProgress(item: InsertCardProgress): Promise<CardProgress>;

  // Calculator Allowed Meds
  getCalculatorAllowedMeds(patientType?: string): Promise<CalculatorAllowedMed[]>;
  getCalculatorAllowedMed(id: number): Promise<CalculatorAllowedMed | undefined>;
  createCalculatorAllowedMed(item: InsertCalculatorAllowedMed): Promise<CalculatorAllowedMed>;
  deleteCalculatorAllowedMed(id: number): Promise<void>;

  // Dashboard Config
  getDashboardConfig(scope?: string): Promise<DashboardConfig | undefined>;
  upsertDashboardConfig(item: InsertDashboardConfig): Promise<DashboardConfig>;

  // Quick Access Config
  getQuickAccessConfigs(patientType?: string): Promise<QuickAccessConfig[]>;
  getQuickAccessConfig(patientType: string): Promise<QuickAccessConfig | undefined>;
  upsertQuickAccessConfig(item: InsertQuickAccessConfig): Promise<QuickAccessConfig>;

  // Donation Causes
  getDonationCauses(activeOnly?: boolean): Promise<DonationCause[]>;
  getDonationCause(id: number): Promise<DonationCause | undefined>;
  createDonationCause(item: InsertDonationCause): Promise<DonationCause>;
  updateDonationCause(id: number, item: Partial<InsertDonationCause>): Promise<DonationCause>;
  deleteDonationCause(id: number): Promise<void>;

  // Donations
  getDonations(userId?: string): Promise<Donation[]>;
  getDonation(id: number): Promise<Donation | undefined>;
  getDonationByProviderId(providerPaymentId: string): Promise<Donation | undefined>;
  createDonation(item: InsertDonation): Promise<Donation>;
  updateDonation(id: number, item: Partial<InsertDonation>): Promise<Donation>;

  // Donation Receipts
  getDonationReceipts(donationId: number): Promise<DonationReceipt[]>;
  createDonationReceipt(item: InsertDonationReceipt): Promise<DonationReceipt>;

  // Emergency Panel Items
  getEmergencyPanelItems(): Promise<EmergencyPanelItem[]>;
  getEmergencyPanelItem(id: number): Promise<EmergencyPanelItem | undefined>;
  createEmergencyPanelItem(item: InsertEmergencyPanelItem): Promise<EmergencyPanelItem>;
  updateEmergencyPanelItem(id: number, item: Partial<InsertEmergencyPanelItem>): Promise<EmergencyPanelItem>;
  deleteEmergencyPanelItem(id: number): Promise<void>;
  reorderEmergencyPanelItems(items: { id: number; sortOrder: number }[]): Promise<void>;

  // User Admin Profiles
  getUserAdminProfile(userId: string): Promise<UserAdminProfile | undefined>;
  getUserAdminProfilesBulk(userIds: string[]): Promise<Map<string, UserAdminProfile>>;
  upsertUserAdminProfile(data: InsertUserAdminProfile): Promise<UserAdminProfile>;

  // User Usage Stats
  getUserUsageStats(userId: string): Promise<UserUsageStats | undefined>;
  getUserUsageStatsBulk(userIds: string[]): Promise<Map<string, UserUsageStats>>;
  upsertUserUsageStats(data: InsertUserUsageStats): Promise<UserUsageStats>;
  updateLastSeen(userId: string): Promise<void>;
  incrementSessionCount(userId: string): Promise<void>;
  incrementFeatureCount(userId: string, feature: string): Promise<void>;

  // User Coupon Usage
  getUserCouponUsage(userId: string): Promise<UserCouponUsage[]>;
  getAllCouponCodes(): Promise<string[]>;
  createUserCouponUsage(data: InsertUserCouponUsage): Promise<UserCouponUsage>;

  // User Billing Status
  getUserBillingStatus(userId: string): Promise<UserBillingStatus | undefined>;
  upsertUserBillingStatus(data: InsertUserBillingStatus): Promise<UserBillingStatus>;

  // User One-Time Messages
  getUserOneTimeMessages(userId: string): Promise<UserOneTimeMessages | undefined>;
  upsertUserOneTimeMessages(userId: string, data: Partial<InsertUserOneTimeMessages>): Promise<UserOneTimeMessages>;
  getLastUnackedDonation(userId: string, lastAckedId?: number | null): Promise<{ donation: Donation; causeName: string } | null>;
  hasConfirmedPayment(userId: string): Promise<boolean>;

  // User Preview State
  getUserPreviewState(userId: string): Promise<UserPreviewState | undefined>;
  upsertUserPreviewState(userId: string, data: Partial<InsertUserPreviewState>): Promise<UserPreviewState>;
  incrementPreviewActions(userId: string): Promise<UserPreviewState>;

  // ===== NEW FEATURES =====

  // User Medications (Custom medications created by users)
  getUserMedications(userId: string): Promise<UserMedication[]>;
  getUserMedication(id: number): Promise<UserMedication | undefined>;
  createUserMedication(item: InsertUserMedication): Promise<UserMedication>;
  updateUserMedication(id: number, item: Partial<InsertUserMedication>): Promise<UserMedication>;
  deleteUserMedication(id: number, userId: string): Promise<void>; // Ensure user owns it
  searchUserMedications(userId: string, query: string): Promise<UserMedication[]>;

  // User Preferences (Message of the Day, theme, notifications)
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(userId: string, item: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, item: Partial<InsertUserPreferences>): Promise<UserPreferences>;

  // Admin Feature Flags (Global feature toggles)
  getAdminFeatureFlags(): Promise<AdminFeatureFlag[]>;
  getAdminFeatureFlag(key: string): Promise<AdminFeatureFlag | undefined>;
  createAdminFeatureFlag(item: InsertAdminFeatureFlag): Promise<AdminFeatureFlag>;
  updateAdminFeatureFlag(key: string, item: Partial<InsertAdminFeatureFlag>): Promise<AdminFeatureFlag>;
  isFeatureEnabled(key: string): Promise<boolean>;

  // Admin Quick Access Config (Control which items appear in UI)
  getAdminQuickAccessConfigs(tab?: string): Promise<AdminQuickAccessConfig[]>;
  getAdminQuickAccessConfig(id: number): Promise<AdminQuickAccessConfig | undefined>;
  createAdminQuickAccessConfig(item: InsertAdminQuickAccessConfig): Promise<AdminQuickAccessConfig>;
  updateAdminQuickAccessConfig(id: number, item: Partial<InsertAdminQuickAccessConfig>): Promise<AdminQuickAccessConfig>;
  deleteAdminQuickAccessConfig(id: number): Promise<void>;
  reorderAdminQuickAccessConfigs(tab: string, items: { id: number; displayOrder: number }[]): Promise<void>;

  // Message of the Day (Daily messages for users)
  getMessageOfDayMessages(type?: string, source?: string): Promise<MessageOfDayMessage[]>;
  getMessageOfDayMessage(id: number): Promise<MessageOfDayMessage | undefined>;
  createMessageOfDayMessage(item: InsertMessageOfDayMessage, createdBy?: string): Promise<MessageOfDayMessage>;
  updateMessageOfDayMessage(id: number, item: Partial<InsertMessageOfDayMessage>): Promise<MessageOfDayMessage>;
  deleteMessageOfDayMessage(id: number): Promise<void>;
  getRandomMessageOfDay(type: string): Promise<MessageOfDayMessage | undefined>;

  // Authentication (independent of Replit)
  getUser(id: string): Promise<(typeof users.$inferSelect) | undefined>;
  getUserByEmail(email: string): Promise<(typeof users.$inferSelect) | undefined>;
  createUser(data: {
    email: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string | null;
  }): Promise<typeof users.$inferSelect>;
  updateUser(id: string, data: Partial<typeof users.$inferSelect>): Promise<typeof users.$inferSelect>;
  getAllUsers(): Promise<(typeof users.$inferSelect)[]>;
  updateUserStatus(id: string, status: "active" | "pending" | "blocked"): Promise<typeof users.$inferSelect>;
  updateUserRole(id: string, role: string): Promise<typeof users.$inferSelect>;
  activateUserWithSubscription(id: string, expiresAt: Date): Promise<typeof users.$inferSelect>;
  updateUserUf(userId: string, uf: string): Promise<void>;
  updateUserChatTerms(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Prescriptions
  async getPrescriptions(userId?: string, ageGroup?: string): Promise<Prescription[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(or(eq(prescriptions.isPublic, true), eq(prescriptions.userId, userId)));
    } else {
      conditions.push(eq(prescriptions.isPublic, true));
    }
    
    if (ageGroup) {
      conditions.push(eq(prescriptions.ageGroup, ageGroup));
    }
    
    return await db.select().from(prescriptions)
      .where(and(...conditions))
      .orderBy(desc(prescriptions.createdAt));
  }

  async searchPrescriptions(query: string, userId?: string): Promise<Prescription[]> {
    const searchPattern = `%${query}%`;
    const conditions = [
      or(
        ilike(prescriptions.title, searchPattern),
        ilike(prescriptions.medication, searchPattern),
        ilike(prescriptions.category, searchPattern)
      )
    ];
    
    if (userId) {
      conditions.push(or(eq(prescriptions.isPublic, true), eq(prescriptions.userId, userId)));
    }
    
    return await db.select().from(prescriptions)
      .where(and(...conditions))
      .orderBy(desc(prescriptions.createdAt));
  }

  async getPrescription(id: number): Promise<Prescription | undefined> {
    const [item] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return item;
  }

  async createPrescription(insertItem: InsertPrescription): Promise<Prescription> {
    const [item] = await db.insert(prescriptions).values(insertItem).returning();
    return item;
  }

  async updatePrescription(id: number, updateItem: UpdatePrescriptionRequest): Promise<Prescription> {
    const [item] = await db.update(prescriptions).set(updateItem).where(eq(prescriptions.id, id)).returning();
    return item;
  }

  async deletePrescription(id: number): Promise<void> {
    await db.delete(prescriptions).where(eq(prescriptions.id, id));
  }

  // Protocols
  async getProtocols(userId?: string, ageGroup?: string): Promise<Protocol[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(or(eq(protocols.isPublic, true), eq(protocols.userId, userId)));
    } else {
      conditions.push(eq(protocols.isPublic, true));
    }
    
    if (ageGroup) {
      conditions.push(eq(protocols.ageGroup, ageGroup));
    }
    
    return await db.select().from(protocols)
      .where(and(...conditions))
      .orderBy(desc(protocols.createdAt));
  }

  async searchProtocols(query: string, userId?: string): Promise<Protocol[]> {
    const searchPattern = `%${query}%`;
    const conditions = [
      or(
        ilike(protocols.title, searchPattern),
        ilike(protocols.description, searchPattern),
        ilike(protocols.specialty, searchPattern)
      )
    ];
    
    if (userId) {
      conditions.push(or(eq(protocols.isPublic, true), eq(protocols.userId, userId)));
    }
    
    return await db.select().from(protocols)
      .where(and(...conditions))
      .orderBy(desc(protocols.createdAt));
  }

  async getProtocol(id: number): Promise<Protocol | undefined> {
    const [item] = await db.select().from(protocols).where(eq(protocols.id, id));
    return item;
  }

  async createProtocol(insertItem: InsertProtocol): Promise<Protocol> {
    const [item] = await db.insert(protocols).values(insertItem).returning();
    return item;
  }

  async updateProtocol(id: number, updateItem: UpdateProtocolRequest): Promise<Protocol> {
    const [item] = await db.update(protocols).set({ ...updateItem, updatedAt: new Date() }).where(eq(protocols.id, id)).returning();
    return item;
  }

  async deleteProtocol(id: number): Promise<void> {
    await db.delete(protocols).where(eq(protocols.id, id));
  }

  async getProtocolByTitleNormalized(titleNormalized: string): Promise<Protocol | undefined> {
    const [item] = await db.select().from(protocols).where(eq(protocols.titleNormalized, titleNormalized));
    return item;
  }

  async bulkImportProtocols(items: InsertProtocol[], upsert: boolean): Promise<{ created: number; updated: number; errors: string[] }> {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const titleNormalized = normalizeText(item.title);
        const existing = await this.getProtocolByTitleNormalized(titleNormalized);

        if (existing) {
          if (upsert) {
            await this.updateProtocol(existing.id, { ...item, titleNormalized });
            updated++;
          }
        } else {
          await db.insert(protocols).values({ ...item, titleNormalized });
          created++;
        }
      } catch (e) {
        errors.push(`Linha ${i + 1}: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
      }
    }

    return { created, updated, errors };
  }

  // Checklists
  async getChecklists(userId?: string, ageGroup?: string): Promise<Checklist[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(or(eq(checklists.isPublic, true), eq(checklists.userId, userId)));
    } else {
      conditions.push(eq(checklists.isPublic, true));
    }
    
    if (ageGroup) {
      conditions.push(eq(checklists.ageGroup, ageGroup));
    }
    
    return await db.select().from(checklists)
      .where(and(...conditions))
      .orderBy(desc(checklists.createdAt));
  }

  async searchChecklists(query: string, userId?: string): Promise<Checklist[]> {
    const searchPattern = `%${query}%`;
    const conditions = [
      or(
        ilike(checklists.title, searchPattern),
        ilike(checklists.category, searchPattern),
        ilike(checklists.specialty, searchPattern)
      )
    ];
    
    if (userId) {
      conditions.push(or(eq(checklists.isPublic, true), eq(checklists.userId, userId)));
    }
    
    return await db.select().from(checklists)
      .where(and(...conditions))
      .orderBy(desc(checklists.createdAt));
  }

  async getChecklist(id: number): Promise<Checklist | undefined> {
    const [item] = await db.select().from(checklists).where(eq(checklists.id, id));
    return item;
  }

  async createChecklist(insertItem: InsertChecklist): Promise<Checklist> {
    const [item] = await db.insert(checklists).values(insertItem).returning();
    return item;
  }

  async updateChecklist(id: number, updateItem: UpdateChecklistRequest): Promise<Checklist> {
    const [item] = await db.update(checklists).set(updateItem).where(eq(checklists.id, id)).returning();
    return item;
  }

  async deleteChecklist(id: number): Promise<void> {
    await db.delete(checklists).where(eq(checklists.id, id));
  }

  async getChecklistByTitleNormalized(titleNormalized: string): Promise<Checklist | undefined> {
    const [item] = await db.select().from(checklists).where(eq(checklists.titleNormalized, titleNormalized));
    return item;
  }

  async bulkImportChecklists(items: InsertChecklist[], upsert: boolean): Promise<{ created: number; updated: number; errors: string[] }> {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const titleNormalized = normalizeText(item.title);
        const existing = await this.getChecklistByTitleNormalized(titleNormalized);

        if (existing) {
          if (upsert) {
            await this.updateChecklist(existing.id, { ...item, titleNormalized } as any);
            updated++;
          }
        } else {
          await db.insert(checklists).values({ ...item, titleNormalized });
          created++;
        }
      } catch (e) {
        errors.push(`Linha ${i + 1}: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
      }
    }

    return { created, updated, errors };
  }

  async getUserChecklistCopy(userId: string, sourceChecklistId: number): Promise<Checklist | undefined> {
    const [item] = await db.select().from(checklists)
      .where(and(
        eq(checklists.userId, userId),
        eq(checklists.sourceChecklistId, sourceChecklistId)
      ));
    return item;
  }

  async createUserChecklistCopy(userId: string, sourceChecklistId: number, updates?: Partial<InsertChecklist>): Promise<Checklist> {
    const source = await this.getChecklist(sourceChecklistId);
    if (!source) throw new Error("Checklist original não encontrado");

    const copyData: InsertChecklist = {
      title: source.title,
      titleNormalized: source.titleNormalized,
      content: source.content as Record<string, unknown>,
      description: source.description,
      ageGroup: source.ageGroup,
      category: source.category,
      specialty: source.specialty,
      pathologyName: source.pathologyName,
      tags: source.tags,
      sortOrder: source.sortOrder,
      isPublic: false,
      isLocked: false,
      sourceChecklistId: sourceChecklistId,
      userId: userId,
      ...updates,
    };

    const [item] = await db.insert(checklists).values(copyData).returning();
    return item;
  }

  async deleteUserChecklistCopy(userId: string, sourceChecklistId: number): Promise<void> {
    await db.delete(checklists)
      .where(and(
        eq(checklists.userId, userId),
        eq(checklists.sourceChecklistId, sourceChecklistId)
      ));
  }

  // Flashcards
  async getFlashcards(userId?: string): Promise<Flashcard[]> {
    if (userId) {
      return await db.select().from(flashcards)
        .where(or(eq(flashcards.isPublic, true), eq(flashcards.userId, userId)))
        .orderBy(desc(flashcards.createdAt));
    }
    return await db.select().from(flashcards).where(eq(flashcards.isPublic, true)).orderBy(desc(flashcards.createdAt));
  }

  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    const [item] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return item;
  }

  async createFlashcard(insertItem: InsertFlashcard): Promise<Flashcard> {
    const [item] = await db.insert(flashcards).values(insertItem).returning();
    return item;
  }

  async updateFlashcard(id: number, updateItem: UpdateFlashcardRequest): Promise<Flashcard> {
    const [item] = await db.update(flashcards).set(updateItem).where(eq(flashcards.id, id)).returning();
    return item;
  }

  async deleteFlashcard(id: number): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }

  // Favorites
  async getFavorites(userId: string): Promise<Favorite[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async addFavorite(item: InsertFavorite): Promise<Favorite> {
    const [fav] = await db.insert(favorites).values(item).returning();
    return fav;
  }

  async removeFavorite(userId: string, itemType: string, itemId: number): Promise<void> {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.itemType, itemType), eq(favorites.itemId, itemId))
    );
  }

  // Admin Settings
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [item] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return item;
  }

  async setAdminSetting(key: string, value: string): Promise<AdminSetting> {
    const existing = await this.getAdminSetting(key);
    if (existing) {
      const [item] = await db.update(adminSettings).set({ value, updatedAt: new Date() }).where(eq(adminSettings.key, key)).returning();
      return item;
    }
    const [item] = await db.insert(adminSettings).values({ key, value }).returning();
    return item;
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings);
  }

  // Doctor Profiles
  async getDoctorProfile(userId: string): Promise<DoctorProfile | undefined> {
    const [item] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, userId));
    return item;
  }

  async upsertDoctorProfile(item: InsertDoctorProfile): Promise<DoctorProfile> {
    const existing = await this.getDoctorProfile(item.userId);
    if (existing) {
      const [updated] = await db.update(doctorProfiles)
        .set({ ...item, updatedAt: new Date() })
        .where(eq(doctorProfiles.userId, item.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(doctorProfiles).values(item).returning();
    return created;
  }

  // Interconsult Messages
  async getInterconsultMessages(userId: string, channel?: string): Promise<InterconsultMessage[]> {
    const conditions = [
      or(eq(interconsultMessages.senderId, userId), eq(interconsultMessages.receiverId, userId))
    ];
    if (channel) {
      conditions.push(eq(interconsultMessages.channel, channel));
    }
    return await db.select().from(interconsultMessages)
      .where(and(...conditions))
      .orderBy(desc(interconsultMessages.createdAt));
  }

  async createInterconsultMessage(item: InsertInterconsultMessage): Promise<InterconsultMessage> {
    const [msg] = await db.insert(interconsultMessages).values(item).returning();
    return msg;
  }

  async markMessageRead(id: number): Promise<void> {
    await db.update(interconsultMessages).set({ isRead: true }).where(eq(interconsultMessages.id, id));
  }

  // Usage Stats
  async logUsage(item: InsertUsageStat): Promise<void> {
    await db.insert(usageStats).values(item);
  }

  async getUsageStats(days: number = 30): Promise<{ action: string; count: number }[]> {
    const result = await db.select({
      action: usageStats.action,
      count: sql<number>`count(*)::int`
    }).from(usageStats)
      .groupBy(usageStats.action);
    return result;
  }

  // Shifts
  async getShifts(userId: string): Promise<Shift[]> {
    return await db.select().from(shifts)
      .where(eq(shifts.userId, userId))
      .orderBy(desc(shifts.date));
  }

  async getShift(id: number): Promise<Shift | undefined> {
    const [item] = await db.select().from(shifts).where(eq(shifts.id, id));
    return item;
  }

  async createShift(insertItem: InsertShift): Promise<Shift> {
    const [item] = await db.insert(shifts).values(insertItem).returning();
    return item;
  }

  async updateShift(id: number, updateItem: UpdateShiftRequest): Promise<Shift> {
    const [item] = await db.update(shifts).set(updateItem).where(eq(shifts.id, id)).returning();
    return item;
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  async getShiftStats(userId: string): Promise<{ totalEarnings: number, totalHours: number, upcomingShifts: Shift[], monthlyGoal: number | null }> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const userShifts = await db.select().from(shifts).where(eq(shifts.userId, userId));
    const userGoal = await this.getGoal(userId, currentMonth);
    
    let totalEarnings = 0;
    let totalHours = 0;
    const upcomingShifts: Shift[] = [];

    for (const shift of userShifts) {
      if (shift.value) {
        totalEarnings += Number(shift.value);
      }
      if (new Date(shift.date) >= now) {
        upcomingShifts.push(shift);
      }
      if (shift.type?.includes('12')) {
        totalHours += 12;
      } else if (shift.type?.includes('24')) {
        totalHours += 24;
      } else if (shift.type?.includes('6')) {
        totalHours += 6;
      }
    }

    upcomingShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { 
      totalEarnings, 
      totalHours, 
      upcomingShifts,
      monthlyGoal: userGoal ? Number(userGoal.targetAmount) : null
    };
  }

  // Notes
  async getNotes(userId: string): Promise<Note[]> {
    return await db.select().from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [item] = await db.select().from(notes).where(eq(notes.id, id));
    return item;
  }

  async createNote(insertItem: InsertNote): Promise<Note> {
    const [item] = await db.insert(notes).values(insertItem).returning();
    return item;
  }

  async updateNote(id: number, updateItem: UpdateNoteRequest): Promise<Note> {
    const [item] = await db.update(notes).set(updateItem).where(eq(notes.id, id)).returning();
    return item;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Tasks
  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [item] = await db.select().from(tasks).where(eq(tasks.id, id));
    return item;
  }

  async createTask(insertItem: InsertTask): Promise<Task> {
    const [item] = await db.insert(tasks).values(insertItem).returning();
    return item;
  }

  async updateTask(id: number, updateItem: Partial<InsertTask>): Promise<Task> {
    const [item] = await db.update(tasks).set(updateItem).where(eq(tasks.id, id)).returning();
    return item;
  }

  async toggleTask(id: number): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) throw new Error("Task not found");
    
    const isCompleted = !task.isCompleted;
    const [item] = await db.update(tasks).set({ 
      isCompleted,
      completedAt: isCompleted ? new Date() : null 
    }).where(eq(tasks.id, id)).returning();
    return item;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Library
  async getLibraryCategories(): Promise<LibraryCategory[]> {
    return await db.select().from(libraryCategories).orderBy(libraryCategories.order);
  }

  async createLibraryCategory(insertItem: InsertLibraryCategory): Promise<LibraryCategory> {
    const [item] = await db.insert(libraryCategories).values(insertItem).returning();
    return item;
  }

  async getLibraryItems(categoryId: number): Promise<LibraryItem[]> {
    return await db.select().from(libraryItems).where(eq(libraryItems.categoryId, categoryId)).orderBy(libraryItems.order);
  }

  async createLibraryItem(insertItem: InsertLibraryItem): Promise<LibraryItem> {
    const [item] = await db.insert(libraryItems).values(insertItem).returning();
    return item;
  }

  // Handovers
  async getHandovers(userId: string): Promise<Handover[]> {
    return await db.select().from(handovers).where(eq(handovers.userId, userId)).orderBy(desc(handovers.createdAt));
  }

  async getHandover(id: number): Promise<Handover | undefined> {
    const [item] = await db.select().from(handovers).where(eq(handovers.id, id));
    return item;
  }

  async createHandover(insertItem: InsertHandover): Promise<Handover> {
    const [item] = await db.insert(handovers).values(insertItem).returning();
    return item;
  }

  async updateHandover(id: number, updateItem: UpdateHandoverRequest): Promise<Handover> {
    const [item] = await db.update(handovers).set(updateItem).where(eq(handovers.id, id)).returning();
    return item;
  }

  async deleteHandover(id: number): Promise<void> {
    await db.delete(handovers).where(eq(handovers.id, id));
  }

  // Goals
  async getGoal(userId: string, month: string): Promise<Goal | undefined> {
    const [item] = await db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.month, month)));
    return item;
  }

  async setGoal(insertItem: InsertGoal): Promise<Goal> {
    const existing = await this.getGoal(insertItem.userId, insertItem.month);
    if (existing) {
       const [updated] = await db.update(goals).set({ targetAmount: insertItem.targetAmount }).where(eq(goals.id, existing.id)).returning();
       return updated;
    }
    const [item] = await db.insert(goals).values(insertItem).returning();
    return item;
  }

  // Pathologies
  async getPathologies(userId?: string, ageGroup?: string): Promise<Pathology[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(pathologies.isPublic, true), eq(pathologies.userId, userId)));
    } else {
      conditions.push(eq(pathologies.isPublic, true));
    }
    if (ageGroup) {
      conditions.push(eq(pathologies.ageGroup, ageGroup));
    }
    return await db.select().from(pathologies).where(and(...conditions)).orderBy(pathologies.name);
  }

  async getPublicPathologies(ageGroup?: string): Promise<Pathology[]> {
    const conditions = [eq(pathologies.isPublic, true)];
    if (ageGroup) {
      conditions.push(eq(pathologies.ageGroup, ageGroup));
    }
    return await db.select().from(pathologies).where(and(...conditions)).orderBy(pathologies.clinicalCategory, pathologies.name);
  }

  async getUserPathologies(userId: string, ageGroup?: string): Promise<Pathology[]> {
    const conditions = [
      eq(pathologies.userId, userId),
      eq(pathologies.isPublic, false)
    ];
    if (ageGroup) {
      conditions.push(eq(pathologies.ageGroup, ageGroup));
    }
    return await db.select().from(pathologies).where(and(...conditions)).orderBy(pathologies.name);
  }

  async searchPathologies(query: string, userId?: string): Promise<Pathology[]> {
    const searchPattern = `%${query}%`;
    const conditions = [or(ilike(pathologies.name, searchPattern), ilike(pathologies.category, searchPattern))];
    if (userId) {
      conditions.push(or(eq(pathologies.isPublic, true), eq(pathologies.userId, userId)));
    }
    return await db.select().from(pathologies).where(and(...conditions)).orderBy(pathologies.name);
  }

  async getPathology(id: number): Promise<Pathology | undefined> {
    const [item] = await db.select().from(pathologies).where(eq(pathologies.id, id));
    return item;
  }

  async getPathologyByNameAndAgeGroup(name: string, ageGroup: string): Promise<Pathology | undefined> {
    const [item] = await db.select().from(pathologies).where(
      and(eq(pathologies.name, name), eq(pathologies.ageGroup, ageGroup))
    );
    return item;
  }

  async createPathology(insertItem: InsertPathology): Promise<Pathology> {
    const [item] = await db.insert(pathologies).values(insertItem).returning();
    return item;
  }

  async createPathologiesBulk(items: InsertPathology[]): Promise<Pathology[]> {
    if (items.length === 0) return [];
    const inserted = await db.insert(pathologies).values(items).returning();
    return inserted;
  }

  async getPathologyByNameNormalized(nameNormalized: string): Promise<Pathology | undefined> {
    const [item] = await db.select().from(pathologies).where(eq(pathologies.nameNormalized, nameNormalized));
    return item;
  }

  async bulkImportPathologies(items: InsertPathology[], upsert: boolean): Promise<{ created: number; updated: number; errors: string[] }> {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const nameNormalized = normalizeText(item.name);
        const existing = await this.getPathologyByNameNormalized(nameNormalized);

        if (existing) {
          if (upsert) {
            await this.updatePathology(existing.id, { ...item, nameNormalized });
            updated++;
          }
        } else {
          await db.insert(pathologies).values({ ...item, nameNormalized });
          created++;
        }
      } catch (e) {
        errors.push(`Linha ${i + 1}: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
      }
    }

    return { created, updated, errors };
  }

  async duplicatePathologyToAgeGroup(id: number, targetAgeGroup: string): Promise<Pathology | null> {
    const original = await this.getPathology(id);
    if (!original) return null;
    
    const existing = await this.getPathologyByNameAndAgeGroup(original.name, targetAgeGroup);
    if (existing) return null;
    
    const sourceGroup = targetAgeGroup === 'adulto' ? 'duplicado_de_pediatrico' : 'duplicado_de_adulto';
    const newPathology: InsertPathology = {
      name: original.name,
      description: original.description,
      ageGroup: targetAgeGroup,
      clinicalCategory: original.clinicalCategory,
      sourceGroup: sourceGroup,
      category: original.category,
      specialty: original.specialty,
      tags: original.tags,
      isPublic: original.isPublic,
      isLocked: original.isLocked,
      userId: original.userId,
    };
    
    return await this.createPathology(newPathology);
  }

  async updatePathology(id: number, updateItem: UpdatePathologyRequest): Promise<Pathology> {
    const [item] = await db.update(pathologies).set(updateItem).where(eq(pathologies.id, id)).returning();
    return item;
  }

  async deletePathology(id: number): Promise<void> {
    await db.delete(pathologyMedications).where(eq(pathologyMedications.pathologyId, id));
    await db.delete(pathologies).where(eq(pathologies.id, id));
  }

  // Pathology Medications
  async getPathologyMedications(pathologyId: number): Promise<PathologyMedication[]> {
    return await db.select().from(pathologyMedications).where(eq(pathologyMedications.pathologyId, pathologyId)).orderBy(pathologyMedications.order);
  }

  async getPathologyMedicationById(id: number): Promise<PathologyMedication | undefined> {
    const [item] = await db.select().from(pathologyMedications).where(eq(pathologyMedications.id, id));
    return item;
  }

  async createPathologyMedication(insertItem: InsertPathologyMedication): Promise<PathologyMedication> {
    const [item] = await db.insert(pathologyMedications).values(insertItem).returning();
    return item;
  }

  async updatePathologyMedication(id: number, updateItem: UpdatePathologyMedicationRequest): Promise<PathologyMedication> {
    const [item] = await db.update(pathologyMedications).set(updateItem).where(eq(pathologyMedications.id, id)).returning();
    return item;
  }

  async deletePathologyMedication(id: number): Promise<void> {
    await db.delete(pathologyMedications).where(eq(pathologyMedications.id, id));
  }

  // Patient History
  async getPatientHistory(userId: string): Promise<PatientHistory[]> {
    return await db.select().from(patientHistory).where(eq(patientHistory.userId, userId)).orderBy(desc(patientHistory.createdAt));
  }

  async searchPatientHistory(userId: string, patientName: string): Promise<PatientHistory[]> {
    return await db.select().from(patientHistory).where(and(eq(patientHistory.userId, userId), ilike(patientHistory.patientName, `%${patientName}%`))).orderBy(desc(patientHistory.createdAt));
  }

  async createPatientHistory(insertItem: InsertPatientHistory): Promise<PatientHistory> {
    const [item] = await db.insert(patientHistory).values(insertItem).returning();
    return item;
  }

  async deletePatientHistory(id: number): Promise<void> {
    await db.delete(patientHistory).where(eq(patientHistory.id, id));
  }

  // Calculator Settings
  async getCalculatorSettings(): Promise<CalculatorSetting[]> {
    return await db.select().from(calculatorSettings).where(eq(calculatorSettings.isActive, true)).orderBy(calculatorSettings.medication);
  }

  async createCalculatorSetting(insertItem: InsertCalculatorSetting): Promise<CalculatorSetting> {
    const [item] = await db.insert(calculatorSettings).values(insertItem).returning();
    return item;
  }

  async updateCalculatorSetting(id: number, updateItem: UpdateCalculatorSettingRequest): Promise<CalculatorSetting> {
    const [item] = await db.update(calculatorSettings).set(updateItem).where(eq(calculatorSettings.id, id)).returning();
    return item;
  }

  async deleteCalculatorSetting(id: number): Promise<void> {
    await db.delete(calculatorSettings).where(eq(calculatorSettings.id, id));
  }

  // Dose Rules
  async getDoseRules(context?: string): Promise<DoseRule[]> {
    const conditions = [eq(doseRules.isActive, true)];
    if (context) {
      conditions.push(eq(doseRules.context, context));
    }
    return await db.select().from(doseRules).where(and(...conditions)).orderBy(doseRules.medicationName);
  }

  async getDoseRulesByMedication(medicationName: string): Promise<DoseRule[]> {
    return await db.select().from(doseRules)
      .where(and(
        eq(doseRules.isActive, true),
        ilike(doseRules.medicationName, medicationName)
      ))
      .orderBy(doseRules.context);
  }

  async createDoseRule(insertItem: InsertDoseRule): Promise<DoseRule> {
    const [item] = await db.insert(doseRules).values(insertItem).returning();
    return item;
  }

  async updateDoseRule(id: number, updateItem: Partial<InsertDoseRule>): Promise<DoseRule> {
    const [item] = await db.update(doseRules).set(updateItem).where(eq(doseRules.id, id)).returning();
    return item;
  }

  async deleteDoseRule(id: number): Promise<void> {
    await db.delete(doseRules).where(eq(doseRules.id, id));
  }

  // Formulations
  async getFormulations(medicationName?: string): Promise<Formulation[]> {
    const conditions = [eq(formulations.isActive, true)];
    if (medicationName) {
      conditions.push(ilike(formulations.medicationName, medicationName));
    }
    return await db.select().from(formulations).where(and(...conditions)).orderBy(formulations.medicationName);
  }

  async createFormulation(insertItem: InsertFormulation): Promise<Formulation> {
    const [item] = await db.insert(formulations).values(insertItem).returning();
    return item;
  }

  async updateFormulation(id: number, updateItem: Partial<InsertFormulation>): Promise<Formulation> {
    const [item] = await db.update(formulations).set(updateItem).where(eq(formulations.id, id)).returning();
    return item;
  }

  async deleteFormulation(id: number): Promise<void> {
    await db.delete(formulations).where(eq(formulations.id, id));
  }

  // Medications Library
  async getMedications(ageGroup?: string): Promise<Medication[]> {
    const conditions = [eq(medications.isActive, true)];
    if (ageGroup) {
      conditions.push(eq(medications.ageGroup, ageGroup));
    }
    return await db.select().from(medications).where(and(...conditions)).orderBy(medications.name);
  }

  async searchMedications(query: string): Promise<Medication[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(medications)
      .where(and(
        eq(medications.isActive, true),
        or(ilike(medications.name, searchPattern), ilike(medications.category, searchPattern))
      ))
      .orderBy(medications.name);
  }

  async getMedication(id: number): Promise<Medication | undefined> {
    const [item] = await db.select().from(medications).where(eq(medications.id, id));
    return item;
  }

  async createMedication(insertItem: InsertMedication): Promise<Medication> {
    const [item] = await db.insert(medications).values(insertItem).returning();
    return item;
  }

  async updateMedication(id: number, updateItem: Partial<InsertMedication>): Promise<Medication> {
    const [item] = await db.update(medications).set(updateItem).where(eq(medications.id, id)).returning();
    return item;
  }

  async deleteMedication(id: number): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }

  // User Preferences
  // Removed old getUserPreferences and upsertUserPreferences methods - replaced with new ones below

  // Drug Interactions
  async getDrugInteractions(): Promise<DrugInteraction[]> {
    return await db.select().from(drugInteractions).where(eq(drugInteractions.isActive, true)).orderBy(drugInteractions.drug1);
  }

  async checkDrugInteraction(drug1: string, drug2: string): Promise<DrugInteraction | undefined> {
    const d1Lower = drug1.toLowerCase();
    const d2Lower = drug2.toLowerCase();
    const [item] = await db.select().from(drugInteractions)
      .where(and(
        eq(drugInteractions.isActive, true),
        or(
          and(ilike(drugInteractions.drug1, d1Lower), ilike(drugInteractions.drug2, d2Lower)),
          and(ilike(drugInteractions.drug1, d2Lower), ilike(drugInteractions.drug2, d1Lower))
        )
      ));
    return item;
  }

  async createDrugInteraction(insertItem: InsertDrugInteraction): Promise<DrugInteraction> {
    const [item] = await db.insert(drugInteractions).values(insertItem).returning();
    return item;
  }

  async updateDrugInteraction(id: number, updateItem: Partial<InsertDrugInteraction>): Promise<DrugInteraction> {
    const [item] = await db.update(drugInteractions).set(updateItem).where(eq(drugInteractions.id, id)).returning();
    return item;
  }

  async deleteDrugInteraction(id: number): Promise<void> {
    await db.delete(drugInteractions).where(eq(drugInteractions.id, id));
  }

  // Medication Contraindications
  async getMedicationContraindications(medicationName?: string): Promise<MedicationContraindication[]> {
    if (medicationName) {
      return await db.select().from(medicationContraindications)
        .where(and(
          eq(medicationContraindications.isActive, true),
          ilike(medicationContraindications.medicationName, medicationName)
        ))
        .orderBy(medicationContraindications.medicationName);
    }
    return await db.select().from(medicationContraindications)
      .where(eq(medicationContraindications.isActive, true))
      .orderBy(medicationContraindications.medicationName);
  }

  async createMedicationContraindication(insertItem: InsertMedicationContraindication): Promise<MedicationContraindication> {
    const [item] = await db.insert(medicationContraindications).values(insertItem).returning();
    return item;
  }

  async updateMedicationContraindication(id: number, updateItem: Partial<InsertMedicationContraindication>): Promise<MedicationContraindication> {
    const [item] = await db.update(medicationContraindications).set(updateItem).where(eq(medicationContraindications.id, id)).returning();
    return item;
  }

  async deleteMedicationContraindication(id: number): Promise<void> {
    await db.delete(medicationContraindications).where(eq(medicationContraindications.id, id));
  }

  // Promo Coupons
  async getPromoCoupons(): Promise<PromoCoupon[]> {
    return await db.select().from(promoCoupons).orderBy(desc(promoCoupons.createdAt));
  }

  async getPromoCouponByCode(code: string): Promise<PromoCoupon | undefined> {
    const [item] = await db.select().from(promoCoupons).where(eq(promoCoupons.code, code.toUpperCase()));
    return item;
  }

  async createPromoCoupon(insertItem: InsertPromoCoupon): Promise<PromoCoupon> {
    const [item] = await db.insert(promoCoupons).values({
      ...insertItem,
      code: insertItem.code.toUpperCase()
    }).returning();
    return item;
  }

  async updatePromoCoupon(id: number, updateItem: Partial<InsertPromoCoupon>): Promise<PromoCoupon> {
    const [item] = await db.update(promoCoupons).set({
      ...updateItem,
      ...(updateItem.code ? { code: updateItem.code.toUpperCase() } : {})
    }).where(eq(promoCoupons.id, id)).returning();
    return item;
  }

  async deletePromoCoupon(id: number): Promise<void> {
    await db.delete(couponUsages).where(eq(couponUsages.couponId, id));
    await db.delete(promoCoupons).where(eq(promoCoupons.id, id));
  }

  async useCoupon(couponId: number, userId: string): Promise<CouponUsage> {
    const [usage] = await db.insert(couponUsages).values({ couponId, userId }).returning();
    await db.update(promoCoupons).set({ 
      currentUses: sql`${promoCoupons.currentUses} + 1` 
    }).where(eq(promoCoupons.id, couponId));
    return usage;
  }

  // Prescription Favorites
  async getPrescriptionFavorites(userId: string): Promise<PrescriptionFavorite[]> {
    return await db.select().from(prescriptionFavorites)
      .where(eq(prescriptionFavorites.userId, userId))
      .orderBy(desc(prescriptionFavorites.createdAt));
  }

  async getPrescriptionFavorite(id: number): Promise<PrescriptionFavorite | undefined> {
    const [item] = await db.select().from(prescriptionFavorites).where(eq(prescriptionFavorites.id, id));
    return item;
  }

  async getPrescriptionFavoriteByToken(token: string): Promise<PrescriptionFavorite | undefined> {
    const [item] = await db.select().from(prescriptionFavorites).where(eq(prescriptionFavorites.exportToken, token));
    return item;
  }

  async createPrescriptionFavorite(insertItem: InsertPrescriptionFavorite): Promise<PrescriptionFavorite> {
    const [item] = await db.insert(prescriptionFavorites).values(insertItem).returning();
    return item;
  }

  async updatePrescriptionFavorite(id: number, updateItem: Partial<InsertPrescriptionFavorite>): Promise<PrescriptionFavorite> {
    const [item] = await db.update(prescriptionFavorites).set({ ...updateItem, updatedAt: new Date() }).where(eq(prescriptionFavorites.id, id)).returning();
    return item;
  }

  async deletePrescriptionFavorite(id: number): Promise<void> {
    await db.delete(prescriptionFavorites).where(eq(prescriptionFavorites.id, id));
  }

  // Prescription Suggestions (Internal AI - uses existing data only)
  async searchPrescriptionSuggestions(params: {
    diagnosis?: string;
    ageGroup?: string;
    userId?: string;
  }): Promise<Array<Prescription & { relevanceScore: number }>> {
    const { diagnosis, ageGroup, userId } = params;
    
    // Build base conditions for access control
    const accessConditions = [];
    if (userId) {
      accessConditions.push(or(eq(prescriptions.isPublic, true), eq(prescriptions.userId, userId)));
    } else {
      accessConditions.push(eq(prescriptions.isPublic, true));
    }
    
    // Filter by age group if provided
    if (ageGroup) {
      accessConditions.push(eq(prescriptions.ageGroup, ageGroup));
    }
    
    // Get all accessible prescriptions
    const allPrescriptions = await db.select().from(prescriptions)
      .where(and(...accessConditions))
      .orderBy(desc(prescriptions.createdAt));
    
    // If no diagnosis search term, return all with neutral score
    if (!diagnosis || diagnosis.trim() === "") {
      return allPrescriptions.map(p => ({ ...p, relevanceScore: 50 }));
    }
    
    // Score and rank by relevance to diagnosis
    const searchTerms = diagnosis.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const scored = allPrescriptions.map(p => {
      let score = 0;
      const titleLower = (p.title || "").toLowerCase();
      const categoryLower = (p.category || "").toLowerCase();
      const medicationLower = (p.medication || "").toLowerCase();
      const specialtyLower = (p.specialty || "").toLowerCase();
      const tagsLower = (p.tags || []).map(t => t.toLowerCase());
      
      for (const term of searchTerms) {
        // Exact match in title (highest weight)
        if (titleLower.includes(term)) score += 40;
        // Category match
        if (categoryLower.includes(term)) score += 30;
        // Medication match
        if (medicationLower.includes(term)) score += 25;
        // Specialty match
        if (specialtyLower.includes(term)) score += 20;
        // Tags match
        if (tagsLower.some(tag => tag.includes(term))) score += 15;
      }
      
      // Bonus for official/public prescriptions
      if (p.isPublic) score += 10;
      
      return { ...p, relevanceScore: Math.min(score, 100) };
    });
    
    // Filter out zero-score results and sort by relevance
    return scored
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Evolution Models
  async getEvolutionModel(id: number): Promise<EvolutionModel | undefined> {
    const [item] = await db.select().from(evolutionModels).where(eq(evolutionModels.id, id));
    return item;
  }

  async getEvolutionModels(userId?: string, category?: string): Promise<EvolutionModel[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(evolutionModels.isPublic, true), eq(evolutionModels.userId, userId)));
    } else {
      conditions.push(eq(evolutionModels.isPublic, true));
    }
    if (category) {
      conditions.push(eq(evolutionModels.category, category));
    }
    return await db.select().from(evolutionModels)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(evolutionModels.createdAt));
  }

  async createEvolutionModel(insertItem: InsertEvolutionModel): Promise<EvolutionModel> {
    const [item] = await db.insert(evolutionModels).values(insertItem).returning();
    return item;
  }

  async updateEvolutionModel(id: number, updateItem: Partial<InsertEvolutionModel>): Promise<EvolutionModel> {
    const [item] = await db.update(evolutionModels).set(updateItem).where(eq(evolutionModels.id, id)).returning();
    return item;
  }

  async deleteEvolutionModel(id: number): Promise<void> {
    await db.delete(evolutionModels).where(eq(evolutionModels.id, id));
  }

  // Physical Exam Templates
  async getPhysicalExamTemplate(id: number): Promise<PhysicalExamTemplate | undefined> {
    const [item] = await db.select().from(physicalExamTemplates).where(eq(physicalExamTemplates.id, id));
    return item;
  }

  async getPhysicalExamTemplates(userId?: string): Promise<PhysicalExamTemplate[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(physicalExamTemplates.isPublic, true), eq(physicalExamTemplates.userId, userId)));
    } else {
      conditions.push(eq(physicalExamTemplates.isPublic, true));
    }
    return await db.select().from(physicalExamTemplates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(physicalExamTemplates.order);
  }

  async createPhysicalExamTemplate(insertItem: InsertPhysicalExamTemplate): Promise<PhysicalExamTemplate> {
    const [item] = await db.insert(physicalExamTemplates).values(insertItem).returning();
    return item;
  }

  async updatePhysicalExamTemplate(id: number, updateItem: Partial<InsertPhysicalExamTemplate>): Promise<PhysicalExamTemplate> {
    const [item] = await db.update(physicalExamTemplates).set(updateItem).where(eq(physicalExamTemplates.id, id)).returning();
    return item;
  }

  async deletePhysicalExamTemplate(id: number): Promise<void> {
    await db.delete(physicalExamTemplates).where(eq(physicalExamTemplates.id, id));
  }

  // Signs and Symptoms
  async getSignsSymptoms(userId?: string, category?: string): Promise<SignsSymptoms[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(signsSymptoms.isPublic, true), eq(signsSymptoms.userId, userId)));
    } else {
      conditions.push(eq(signsSymptoms.isPublic, true));
    }
    if (category) {
      conditions.push(eq(signsSymptoms.category, category));
    }
    return await db.select().from(signsSymptoms)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(signsSymptoms.createdAt));
  }

  async createSignsSymptoms(insertItem: InsertSignsSymptoms): Promise<SignsSymptoms> {
    const [item] = await db.insert(signsSymptoms).values(insertItem).returning();
    return item;
  }

  async updateSignsSymptoms(id: number, updateItem: Partial<InsertSignsSymptoms>): Promise<SignsSymptoms> {
    const [item] = await db.update(signsSymptoms).set(updateItem).where(eq(signsSymptoms.id, id)).returning();
    return item;
  }

  async deleteSignsSymptoms(id: number): Promise<void> {
    await db.delete(signsSymptoms).where(eq(signsSymptoms.id, id));
  }

  // Semiological Signs
  async getSemiologicalSigns(userId?: string, category?: string): Promise<SemiologicalSigns[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(semiologicalSigns.isPublic, true), eq(semiologicalSigns.userId, userId)));
    } else {
      conditions.push(eq(semiologicalSigns.isPublic, true));
    }
    if (category) {
      conditions.push(eq(semiologicalSigns.category, category));
    }
    return await db.select().from(semiologicalSigns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(semiologicalSigns.createdAt));
  }

  async createSemiologicalSigns(insertItem: InsertSemiologicalSigns): Promise<SemiologicalSigns> {
    const [item] = await db.insert(semiologicalSigns).values(insertItem).returning();
    return item;
  }

  async updateSemiologicalSigns(id: number, updateItem: Partial<InsertSemiologicalSigns>): Promise<SemiologicalSigns> {
    const [item] = await db.update(semiologicalSigns).set(updateItem).where(eq(semiologicalSigns.id, id)).returning();
    return item;
  }

  async deleteSemiologicalSigns(id: number): Promise<void> {
    await db.delete(semiologicalSigns).where(eq(semiologicalSigns.id, id));
  }

  // Medical Certificates
  async getMedicalCertificate(id: number): Promise<MedicalCertificate | undefined> {
    const [item] = await db.select().from(medicalCertificates).where(eq(medicalCertificates.id, id));
    return item;
  }

  async getMedicalCertificates(userId: string): Promise<MedicalCertificate[]> {
    return await db.select().from(medicalCertificates)
      .where(eq(medicalCertificates.userId, userId))
      .orderBy(desc(medicalCertificates.createdAt));
  }

  async createMedicalCertificate(insertItem: InsertMedicalCertificate): Promise<MedicalCertificate> {
    const [item] = await db.insert(medicalCertificates).values(insertItem).returning();
    return item;
  }

  async deleteMedicalCertificate(id: number): Promise<void> {
    await db.delete(medicalCertificates).where(eq(medicalCertificates.id, id));
  }

  // Attendance Declarations
  async getAttendanceDeclaration(id: number): Promise<AttendanceDeclaration | undefined> {
    const [item] = await db.select().from(attendanceDeclarations).where(eq(attendanceDeclarations.id, id));
    return item;
  }

  async getAttendanceDeclarations(userId: string): Promise<AttendanceDeclaration[]> {
    return await db.select().from(attendanceDeclarations)
      .where(eq(attendanceDeclarations.userId, userId))
      .orderBy(desc(attendanceDeclarations.createdAt));
  }

  async createAttendanceDeclaration(insertItem: InsertAttendanceDeclaration): Promise<AttendanceDeclaration> {
    const [item] = await db.insert(attendanceDeclarations).values(insertItem).returning();
    return item;
  }

  async deleteAttendanceDeclaration(id: number): Promise<void> {
    await db.delete(attendanceDeclarations).where(eq(attendanceDeclarations.id, id));
  }

  // Medical Referrals
  async getMedicalReferral(id: number): Promise<MedicalReferral | undefined> {
    const [item] = await db.select().from(medicalReferrals).where(eq(medicalReferrals.id, id));
    return item;
  }

  async getMedicalReferrals(userId: string): Promise<MedicalReferral[]> {
    return await db.select().from(medicalReferrals)
      .where(eq(medicalReferrals.userId, userId))
      .orderBy(desc(medicalReferrals.createdAt));
  }

  async createMedicalReferral(insertItem: InsertMedicalReferral): Promise<MedicalReferral> {
    const [item] = await db.insert(medicalReferrals).values(insertItem).returning();
    return item;
  }

  async deleteMedicalReferral(id: number): Promise<void> {
    await db.delete(medicalReferrals).where(eq(medicalReferrals.id, id));
  }

  // Referral Destinations
  async getReferralDestinations(): Promise<ReferralDestination[]> {
    return await db.select().from(referralDestinations)
      .where(eq(referralDestinations.isActive, true))
      .orderBy(referralDestinations.name);
  }

  async createReferralDestination(insertItem: InsertReferralDestination): Promise<ReferralDestination> {
    const [item] = await db.insert(referralDestinations).values(insertItem).returning();
    return item;
  }

  async updateReferralDestination(id: number, updateItem: Partial<InsertReferralDestination>): Promise<ReferralDestination> {
    const [item] = await db.update(referralDestinations).set(updateItem).where(eq(referralDestinations.id, id)).returning();
    return item;
  }

  async deleteReferralDestination(id: number): Promise<void> {
    await db.delete(referralDestinations).where(eq(referralDestinations.id, id));
  }

  // Referral Reasons
  async getReferralReasons(): Promise<ReferralReason[]> {
    return await db.select().from(referralReasons)
      .where(eq(referralReasons.isActive, true))
      .orderBy(referralReasons.description);
  }

  async createReferralReason(insertItem: InsertReferralReason): Promise<ReferralReason> {
    const [item] = await db.insert(referralReasons).values(insertItem).returning();
    return item;
  }

  async updateReferralReason(id: number, updateItem: Partial<InsertReferralReason>): Promise<ReferralReason> {
    const [item] = await db.update(referralReasons).set(updateItem).where(eq(referralReasons.id, id)).returning();
    return item;
  }

  async deleteReferralReason(id: number): Promise<void> {
    await db.delete(referralReasons).where(eq(referralReasons.id, id));
  }

  // Prescription Models (Official admin-created models)
  async getPrescriptionModels(pathologyId?: number): Promise<PrescriptionModel[]> {
    if (pathologyId) {
      return await db.select().from(prescriptionModels)
        .where(and(eq(prescriptionModels.pathologyId, pathologyId), eq(prescriptionModels.isActive, true)))
        .orderBy(prescriptionModels.order);
    }
    return await db.select().from(prescriptionModels)
      .where(eq(prescriptionModels.isActive, true))
      .orderBy(prescriptionModels.order);
  }

  async getPrescriptionModel(id: number): Promise<PrescriptionModel | undefined> {
    const [item] = await db.select().from(prescriptionModels).where(eq(prescriptionModels.id, id));
    return item;
  }

  async createPrescriptionModel(insertItem: InsertPrescriptionModel): Promise<PrescriptionModel> {
    const [item] = await db.insert(prescriptionModels).values(insertItem).returning();
    return item;
  }

  async updatePrescriptionModel(id: number, updateItem: Partial<InsertPrescriptionModel>): Promise<PrescriptionModel> {
    const [item] = await db.update(prescriptionModels).set(updateItem).where(eq(prescriptionModels.id, id)).returning();
    return item;
  }

  async deletePrescriptionModel(id: number): Promise<void> {
    await db.delete(prescriptionModelMedications).where(eq(prescriptionModelMedications.prescriptionModelId, id));
    await db.delete(prescriptionModels).where(eq(prescriptionModels.id, id));
  }

  // Prescription Model Medications
  async getPrescriptionModelMedications(prescriptionModelId: number): Promise<PrescriptionModelMedication[]> {
    return await db.select().from(prescriptionModelMedications)
      .where(eq(prescriptionModelMedications.prescriptionModelId, prescriptionModelId))
      .orderBy(prescriptionModelMedications.order);
  }

  async createPrescriptionModelMedication(insertItem: InsertPrescriptionModelMedication): Promise<PrescriptionModelMedication> {
    const [item] = await db.insert(prescriptionModelMedications).values(insertItem).returning();
    return item;
  }

  async updatePrescriptionModelMedication(id: number, updateItem: Partial<InsertPrescriptionModelMedication>): Promise<PrescriptionModelMedication> {
    const [item] = await db.update(prescriptionModelMedications).set(updateItem).where(eq(prescriptionModelMedications.id, id)).returning();
    return item;
  }

  async deletePrescriptionModelMedication(id: number): Promise<void> {
    await db.delete(prescriptionModelMedications).where(eq(prescriptionModelMedications.id, id));
  }

  // Monthly Expenses
  async getMonthlyExpenses(userId: string): Promise<MonthlyExpense[]> {
    return await db.select().from(monthlyExpenses)
      .where(eq(monthlyExpenses.userId, userId))
      .orderBy(desc(monthlyExpenses.createdAt));
  }

  async createMonthlyExpense(insertItem: InsertMonthlyExpense): Promise<MonthlyExpense> {
    const [item] = await db.insert(monthlyExpenses).values(insertItem).returning();
    return item;
  }

  async updateMonthlyExpense(id: number, updateItem: Partial<InsertMonthlyExpense>): Promise<MonthlyExpense> {
    const [item] = await db.update(monthlyExpenses).set(updateItem).where(eq(monthlyExpenses.id, id)).returning();
    return item;
  }

  async deleteMonthlyExpense(id: number): Promise<void> {
    await db.delete(monthlyExpenses).where(eq(monthlyExpenses.id, id));
  }

  // Financial Goals
  async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    return await db.select().from(financialGoals)
      .where(eq(financialGoals.userId, userId))
      .orderBy(desc(financialGoals.createdAt));
  }

  async createFinancialGoal(insertItem: InsertFinancialGoal): Promise<FinancialGoal> {
    const [item] = await db.insert(financialGoals).values(insertItem).returning();
    return item;
  }

  async updateFinancialGoal(id: number, updateItem: Partial<InsertFinancialGoal>): Promise<FinancialGoal> {
    const [item] = await db.update(financialGoals).set(updateItem).where(eq(financialGoals.id, id)).returning();
    return item;
  }

  async deleteFinancialGoal(id: number): Promise<void> {
    await db.delete(financialGoals).where(eq(financialGoals.id, id));
  }

  // Plans
  async getPlans(): Promise<Plan[]> {
    return await db.select().from(plans).orderBy(desc(plans.createdAt));
  }

  async getActivePlan(): Promise<Plan | undefined> {
    const [item] = await db.select().from(plans).where(eq(plans.isActive, true)).limit(1);
    return item;
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    const [item] = await db.select().from(plans).where(eq(plans.id, id));
    return item;
  }

  async getPlanBySlug(slug: string): Promise<Plan | undefined> {
    const [item] = await db.select().from(plans).where(
      and(eq(plans.slug, slug), eq(plans.isActive, true))
    );
    return item;
  }

  async createPlan(insertItem: InsertPlan): Promise<Plan> {
    const [item] = await db.insert(plans).values(insertItem).returning();
    return item;
  }

  async updatePlan(id: number, updateItem: Partial<InsertPlan>): Promise<Plan> {
    const [item] = await db.update(plans).set(updateItem).where(eq(plans.id, id)).returning();
    return item;
  }

  async upsertPlans(): Promise<void> {
    const defaultPlans = [
      { slug: 'mensal', name: 'Plano Mensal', priceCents: 2990, billingPeriod: 'monthly', cycle: 'MONTHLY', isActive: true },
      { slug: 'semestral', name: 'Plano Semestral', priceCents: 14990, billingPeriod: 'semiannually', cycle: 'SEMIANNUALLY', isActive: true },
      { slug: 'anual', name: 'Plano Anual', priceCents: 27990, billingPeriod: 'yearly', cycle: 'YEARLY', isActive: true },
    ];

    for (const plan of defaultPlans) {
      const existing = await db.select().from(plans).where(eq(plans.slug, plan.slug)).limit(1);
      if (existing.length === 0) {
        await db.insert(plans).values(plan);
      } else {
        await db.update(plans).set(plan).where(eq(plans.slug, plan.slug));
      }
    }
  }

  // Subscriptions
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [item] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return item;
  }

  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const [item] = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ))
      .limit(1);
    return item;
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [item] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return item;
  }

  async getSubscriptionByProviderId(providerSubscriptionId: string): Promise<Subscription | undefined> {
    const [item] = await db.select().from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId));
    return item;
  }

  async createSubscription(insertItem: InsertSubscription): Promise<Subscription> {
    const [item] = await db.insert(subscriptions).values(insertItem).returning();
    return item;
  }

  async updateSubscription(id: number, updateItem: Partial<InsertSubscription>): Promise<Subscription> {
    const [item] = await db.update(subscriptions).set({
      ...updateItem,
      updatedAt: new Date()
    }).where(eq(subscriptions.id, id)).returning();
    return item;
  }

  // Payments
  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [item] = await db.select().from(payments).where(eq(payments.id, id));
    return item;
  }

  async getPaymentByProviderId(providerPaymentId: string): Promise<Payment | undefined> {
    const [item] = await db.select().from(payments)
      .where(eq(payments.providerPaymentId, providerPaymentId));
    return item;
  }

  async createPayment(insertItem: InsertPayment): Promise<Payment> {
    const [item] = await db.insert(payments).values(insertItem).returning();
    return item;
  }

  async updatePayment(id: number, updateItem: Partial<InsertPayment>): Promise<Payment> {
    const [item] = await db.update(payments).set(updateItem).where(eq(payments.id, id)).returning();
    return item;
  }

  // Medication Dilutions
  async getMedicationDilutions(medicationId?: number): Promise<MedicationDilution[]> {
    if (medicationId) {
      return await db.select().from(medicationDilutions)
        .where(and(eq(medicationDilutions.medicationId, medicationId), eq(medicationDilutions.isActive, true)));
    }
    return await db.select().from(medicationDilutions)
      .where(eq(medicationDilutions.isActive, true));
  }

  async getMedicationDilution(id: number): Promise<MedicationDilution | undefined> {
    const [item] = await db.select().from(medicationDilutions).where(eq(medicationDilutions.id, id));
    return item;
  }

  async getMedicationDilutionByName(medicationName: string): Promise<MedicationDilution | undefined> {
    const [item] = await db.select().from(medicationDilutions)
      .where(ilike(medicationDilutions.medicationName, medicationName));
    return item;
  }

  async createMedicationDilution(insertItem: InsertMedicationDilution): Promise<MedicationDilution> {
    const [item] = await db.insert(medicationDilutions).values(insertItem).returning();
    return item;
  }

  async updateMedicationDilution(id: number, updateItem: Partial<InsertMedicationDilution>): Promise<MedicationDilution> {
    const [item] = await db.update(medicationDilutions)
      .set({ ...updateItem, updatedAt: new Date() })
      .where(eq(medicationDilutions.id, id)).returning();
    return item;
  }

  async deleteMedicationDilution(id: number): Promise<void> {
    await db.delete(medicationDilutions).where(eq(medicationDilutions.id, id));
  }

  async upsertMedicationDilution(item: InsertMedicationDilution): Promise<MedicationDilution> {
    const existing = await this.getMedicationDilutionByName(item.medicationName);
    if (existing) {
      return await this.updateMedicationDilution(existing.id, item);
    }
    return await this.createMedicationDilution(item);
  }

  async bulkImportMedicationDilutions(data: InsertMedicationDilution[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    
    for (let i = 0; i < data.length; i++) {
      try {
        await this.upsertMedicationDilution(data[i]);
        imported++;
      } catch (error) {
        errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
    
    return { imported, errors };
  }

  // Hydration Presets
  async getHydrationPresets(patientType?: string): Promise<HydrationPreset[]> {
    if (patientType) {
      return await db.select().from(hydrationPresets)
        .where(and(eq(hydrationPresets.patientType, patientType), eq(hydrationPresets.isActive, true)))
        .orderBy(hydrationPresets.order);
    }
    return await db.select().from(hydrationPresets)
      .where(eq(hydrationPresets.isActive, true))
      .orderBy(hydrationPresets.order);
  }

  async getHydrationPreset(id: number): Promise<HydrationPreset | undefined> {
    const [item] = await db.select().from(hydrationPresets).where(eq(hydrationPresets.id, id));
    return item;
  }

  async createHydrationPreset(insertItem: InsertHydrationPreset): Promise<HydrationPreset> {
    const [item] = await db.insert(hydrationPresets).values(insertItem).returning();
    return item;
  }

  async updateHydrationPreset(id: number, updateItem: Partial<InsertHydrationPreset>): Promise<HydrationPreset> {
    const [item] = await db.update(hydrationPresets)
      .set({ ...updateItem, updatedAt: new Date() })
      .where(eq(hydrationPresets.id, id)).returning();
    return item;
  }

  async deleteHydrationPreset(id: number): Promise<void> {
    await db.delete(hydrationPresets).where(eq(hydrationPresets.id, id));
  }

  // Medication Service (centralized)
  async getMedicationByNormalizedName(nameNormalized: string): Promise<Medication | undefined> {
    const [item] = await db.select().from(medications)
      .where(eq(medications.nameNormalized, nameNormalized));
    return item;
  }

  async upsertMedication(item: InsertMedication): Promise<Medication> {
    const normalized = this.normalizeText(item.name);
    const existing = await this.getMedicationByNormalizedName(normalized);
    if (existing) {
      return await this.updateMedication(existing.id, { ...item, nameNormalized: normalized });
    }
    return await this.createMedication({ ...item, nameNormalized: normalized });
  }

  async searchMedicationsAdvanced(query: string, options?: { ageGroup?: string; category?: string }): Promise<Medication[]> {
    const searchPattern = `%${query}%`;
    const conditions = [
      or(
        ilike(medications.name, searchPattern),
        ilike(medications.nameNormalized, searchPattern),
        ilike(medications.category, searchPattern)
      ),
      eq(medications.isActive, true)
    ];

    if (options?.ageGroup) {
      conditions.push(eq(medications.ageGroup, options.ageGroup));
    }
    if (options?.category) {
      conditions.push(eq(medications.category, options.category));
    }

    return await db.select().from(medications)
      .where(and(...conditions))
      .orderBy(medications.name);
  }

  // Helper function for text normalization
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // Memorization Decks
  async getMemorizeDecks(userId?: string): Promise<MemorizeDeck[]> {
    if (userId) {
      return await db.select().from(memorizeDecks)
        .where(or(eq(memorizeDecks.isPublic, true), eq(memorizeDecks.userId, userId)))
        .orderBy(desc(memorizeDecks.createdAt));
    }
    return await db.select().from(memorizeDecks)
      .where(eq(memorizeDecks.isPublic, true))
      .orderBy(desc(memorizeDecks.createdAt));
  }

  async getMemorizeDeck(id: number): Promise<MemorizeDeck | undefined> {
    const [item] = await db.select().from(memorizeDecks).where(eq(memorizeDecks.id, id));
    return item;
  }

  async createMemorizeDeck(item: InsertMemorizeDeck): Promise<MemorizeDeck> {
    const [created] = await db.insert(memorizeDecks).values(item).returning();
    return created;
  }

  async updateMemorizeDeck(id: number, item: Partial<InsertMemorizeDeck>): Promise<MemorizeDeck> {
    const [updated] = await db.update(memorizeDecks)
      .set(item)
      .where(eq(memorizeDecks.id, id)).returning();
    return updated;
  }

  async deleteMemorizeDeck(id: number): Promise<void> {
    await db.delete(memorizeDecks).where(eq(memorizeDecks.id, id));
  }

  // Memorization Cards
  async getMemorizeCards(deckId: number): Promise<MemorizeCard[]> {
    return await db.select().from(memorizeCards)
      .where(eq(memorizeCards.deckId, deckId))
      .orderBy(memorizeCards.id);
  }

  async getMemorizeCard(id: number): Promise<MemorizeCard | undefined> {
    const [item] = await db.select().from(memorizeCards).where(eq(memorizeCards.id, id));
    return item;
  }

  async createMemorizeCard(item: InsertMemorizeCard): Promise<MemorizeCard> {
    const [created] = await db.insert(memorizeCards).values(item).returning();
    await db.update(memorizeDecks)
      .set({ cardCount: sql`card_count + 1` })
      .where(eq(memorizeDecks.id, item.deckId));
    return created;
  }

  async createMemorizeCardsBulk(items: InsertMemorizeCard[]): Promise<MemorizeCard[]> {
    if (items.length === 0) return [];
    const created = await db.insert(memorizeCards).values(items).returning();
    const deckId = items[0].deckId;
    await db.update(memorizeDecks)
      .set({ cardCount: sql`card_count + ${items.length}` })
      .where(eq(memorizeDecks.id, deckId));
    return created;
  }

  async updateMemorizeCard(id: number, item: Partial<InsertMemorizeCard>): Promise<MemorizeCard> {
    const [updated] = await db.update(memorizeCards)
      .set(item)
      .where(eq(memorizeCards.id, id)).returning();
    return updated;
  }

  async deleteMemorizeCard(id: number): Promise<void> {
    const card = await this.getMemorizeCard(id);
    if (card) {
      await db.delete(memorizeCards).where(eq(memorizeCards.id, id));
      await db.update(memorizeDecks)
        .set({ cardCount: sql`GREATEST(card_count - 1, 0)` })
        .where(eq(memorizeDecks.id, card.deckId));
    }
  }

  // Card Progress (Spaced Repetition)
  async getCardProgress(userId: string, cardId: number): Promise<CardProgress | undefined> {
    const [item] = await db.select().from(cardProgress)
      .where(and(eq(cardProgress.userId, userId), eq(cardProgress.cardId, cardId)));
    return item;
  }

  async getCardsToReview(userId: string, deckId: number): Promise<(MemorizeCard & { progress?: CardProgress })[]> {
    const cards = await this.getMemorizeCards(deckId);
    const cardIds = cards.map(c => c.id);
    
    if (cardIds.length === 0) return [];
    
    const progresses = await db.select().from(cardProgress)
      .where(and(
        eq(cardProgress.userId, userId),
        sql`${cardProgress.cardId} = ANY(${cardIds})`
      ));
    
    const progressMap = new Map(progresses.map(p => [p.cardId, p]));
    
    return cards.map(card => ({
      ...card,
      progress: progressMap.get(card.id)
    }));
  }

  async upsertCardProgress(item: InsertCardProgress): Promise<CardProgress> {
    const existing = await this.getCardProgress(item.userId, item.cardId);
    if (existing) {
      const [updated] = await db.update(cardProgress)
        .set({ ...item, lastReviewedAt: new Date() })
        .where(eq(cardProgress.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(cardProgress).values(item).returning();
    return created;
  }

  // Calculator Allowed Meds
  async getCalculatorAllowedMeds(patientType?: string): Promise<CalculatorAllowedMed[]> {
    if (patientType) {
      return await db.select().from(calculatorAllowedMeds)
        .where(and(eq(calculatorAllowedMeds.patientType, patientType), eq(calculatorAllowedMeds.isActive, true)))
        .orderBy(calculatorAllowedMeds.sortOrder);
    }
    return await db.select().from(calculatorAllowedMeds)
      .where(eq(calculatorAllowedMeds.isActive, true))
      .orderBy(calculatorAllowedMeds.sortOrder);
  }

  async getCalculatorAllowedMed(id: number): Promise<CalculatorAllowedMed | undefined> {
    const [med] = await db.select().from(calculatorAllowedMeds).where(eq(calculatorAllowedMeds.id, id));
    return med;
  }

  async createCalculatorAllowedMed(item: InsertCalculatorAllowedMed): Promise<CalculatorAllowedMed> {
    const [created] = await db.insert(calculatorAllowedMeds).values(item).returning();
    return created;
  }

  async deleteCalculatorAllowedMed(id: number): Promise<void> {
    await db.delete(calculatorAllowedMeds).where(eq(calculatorAllowedMeds.id, id));
  }

  // Dashboard Config
  async getDashboardConfig(scope?: string): Promise<DashboardConfig | undefined> {
    const s = scope || "user_default";
    const [config] = await db.select().from(dashboardConfig).where(eq(dashboardConfig.scope, s));
    return config;
  }

  async upsertDashboardConfig(item: InsertDashboardConfig): Promise<DashboardConfig> {
    const existing = await this.getDashboardConfig(item.scope);
    if (existing) {
      const [updated] = await db.update(dashboardConfig)
        .set({ ...item, updatedAt: new Date() })
        .where(eq(dashboardConfig.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(dashboardConfig).values(item).returning();
    return created;
  }

  // Quick Access Config
  async getQuickAccessConfigs(patientType?: string): Promise<QuickAccessConfig[]> {
    if (patientType) {
      return await db.select().from(quickAccessConfig)
        .where(and(
          or(eq(quickAccessConfig.patientType, patientType), eq(quickAccessConfig.patientType, "ambos")),
          eq(quickAccessConfig.isActive, true)
        ))
        .orderBy(quickAccessConfig.sortOrder);
    }
    return await db.select().from(quickAccessConfig)
      .where(eq(quickAccessConfig.isActive, true))
      .orderBy(quickAccessConfig.sortOrder);
  }

  async getQuickAccessConfig(patientType: string): Promise<QuickAccessConfig | undefined> {
    const [config] = await db.select().from(quickAccessConfig)
      .where(eq(quickAccessConfig.patientType, patientType));
    return config;
  }

  async upsertQuickAccessConfig(item: InsertQuickAccessConfig): Promise<QuickAccessConfig> {
    const [existing] = await db.select().from(quickAccessConfig)
      .where(eq(quickAccessConfig.patientType, item.patientType || "ambos"));
    if (existing) {
      const [updated] = await db.update(quickAccessConfig)
        .set({ ...item, updatedAt: new Date() })
        .where(eq(quickAccessConfig.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(quickAccessConfig).values(item).returning();
    return created;
  }

  // Donation Causes
  async getDonationCauses(activeOnly?: boolean): Promise<DonationCause[]> {
    if (activeOnly) {
      return await db.select().from(donationCauses)
        .where(eq(donationCauses.isActive, true))
        .orderBy(donationCauses.sortOrder);
    }
    return await db.select().from(donationCauses).orderBy(donationCauses.sortOrder);
  }

  async getDonationCause(id: number): Promise<DonationCause | undefined> {
    const [cause] = await db.select().from(donationCauses).where(eq(donationCauses.id, id));
    return cause;
  }

  async createDonationCause(item: InsertDonationCause): Promise<DonationCause> {
    const [created] = await db.insert(donationCauses).values(item).returning();
    return created;
  }

  async updateDonationCause(id: number, item: Partial<InsertDonationCause>): Promise<DonationCause> {
    const [updated] = await db.update(donationCauses)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(donationCauses.id, id))
      .returning();
    return updated;
  }

  async deleteDonationCause(id: number): Promise<void> {
    await db.delete(donationCauses).where(eq(donationCauses.id, id));
  }

  // Donations
  async getDonations(userId?: string): Promise<Donation[]> {
    if (userId) {
      return await db.select().from(donations)
        .where(eq(donations.userId, userId))
        .orderBy(desc(donations.createdAt));
    }
    return await db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async getDonation(id: number): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.id, id));
    return donation;
  }

  async getDonationByProviderId(providerPaymentId: string): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations)
      .where(eq(donations.providerPaymentId, providerPaymentId));
    return donation;
  }

  async createDonation(item: InsertDonation): Promise<Donation> {
    const [created] = await db.insert(donations).values(item).returning();
    return created;
  }

  async updateDonation(id: number, item: Partial<InsertDonation>): Promise<Donation> {
    const [updated] = await db.update(donations)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(donations.id, id))
      .returning();
    return updated;
  }

  // Donation Receipts
  async getDonationReceipts(donationId: number): Promise<DonationReceipt[]> {
    return await db.select().from(donationReceipts)
      .where(eq(donationReceipts.donationId, donationId));
  }

  async createDonationReceipt(item: InsertDonationReceipt): Promise<DonationReceipt> {
    const [created] = await db.insert(donationReceipts).values(item).returning();
    return created;
  }

  // Emergency Panel Items
  async getEmergencyPanelItems(): Promise<EmergencyPanelItem[]> {
    return await db.select().from(emergencyPanelItems).orderBy(emergencyPanelItems.sortOrder);
  }

  async getEmergencyPanelItem(id: number): Promise<EmergencyPanelItem | undefined> {
    const [item] = await db.select().from(emergencyPanelItems).where(eq(emergencyPanelItems.id, id));
    return item;
  }

  async createEmergencyPanelItem(item: InsertEmergencyPanelItem): Promise<EmergencyPanelItem> {
    const [created] = await db.insert(emergencyPanelItems).values(item).returning();
    return created;
  }

  async updateEmergencyPanelItem(id: number, item: Partial<InsertEmergencyPanelItem>): Promise<EmergencyPanelItem> {
    const [updated] = await db.update(emergencyPanelItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(emergencyPanelItems.id, id))
      .returning();
    return updated;
  }

  async deleteEmergencyPanelItem(id: number): Promise<void> {
    await db.delete(emergencyPanelItems).where(eq(emergencyPanelItems.id, id));
  }

  async reorderEmergencyPanelItems(items: { id: number; sortOrder: number }[]): Promise<void> {
    for (const item of items) {
      await db.update(emergencyPanelItems)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(emergencyPanelItems.id, item.id));
    }
  }

  // Doctor Chat
  async getChatRoomsForUser(userId: string): Promise<any[]> {
    const memberOf = await db.select({ roomId: chatRoomMembers.roomId })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.userId, userId));
    
    if (memberOf.length === 0) return [];
    
    const roomIds = memberOf.map(m => m.roomId);
    const rooms = await db.select().from(chatRooms).where(inArray(chatRooms.id, roomIds));
    
    const result = [];
    for (const room of rooms) {
      if (room.type === 'dm') {
        const members = await db.select({ userId: chatRoomMembers.userId })
          .from(chatRoomMembers)
          .where(and(eq(chatRoomMembers.roomId, room.id), ne(chatRoomMembers.userId, userId)));
        
        if (members.length > 0 && members[0].userId) {
          const [otherUser] = await db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          }).from(users).where(eq(users.id, members[0].userId as string));
          
          result.push({
            ...room,
            otherUser,
            name: otherUser ? `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || "Usuário" : "Usuário",
          });
        }
      } else {
        result.push(room);
      }
    }
    return result;
  }

  async getOrCreateStateGroup(uf: string, userId: string): Promise<ChatRoom> {
    const [existing] = await db.select().from(chatRooms)
      .where(and(eq(chatRooms.type, 'group'), eq(chatRooms.stateUf, uf)));
    
    if (existing) {
      const [member] = await db.select().from(chatRoomMembers)
        .where(and(eq(chatRoomMembers.roomId, existing.id), eq(chatRoomMembers.userId, userId)));
      
      if (!member) {
        await db.insert(chatRoomMembers).values({ roomId: existing.id, userId });
      }
      return existing;
    }
    
    const [room] = await db.insert(chatRooms).values({
      type: 'group',
      stateUf: uf,
      name: `Médicos ${uf}`,
    }).returning();
    
    await db.insert(chatRoomMembers).values({ roomId: room.id, userId });
    return room;
  }

  async isRoomMember(roomId: number, userId: string): Promise<boolean> {
    const [member] = await db.select().from(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)));
    return !!member;
  }

  async getChatMessages(roomId: number, limit: number, before?: number): Promise<any[]> {
    const now = new Date();
    let query = db.select({
      id: chatMessages.id,
      roomId: chatMessages.roomId,
      senderId: chatMessages.senderId,
      body: chatMessages.body,
      createdAt: chatMessages.createdAt,
      expiresAt: chatMessages.expiresAt,
      senderFirstName: users.firstName,
      senderLastName: users.lastName,
      senderImage: users.profileImageUrl,
    })
    .from(chatMessages)
    .leftJoin(users, eq(chatMessages.senderId, users.id))
    .where(
      before
        ? and(eq(chatMessages.roomId, roomId), gte(chatMessages.expiresAt, now), lt(chatMessages.id, before))
        : and(eq(chatMessages.roomId, roomId), gte(chatMessages.expiresAt, now))
    )
    .orderBy(desc(chatMessages.id))
    .limit(limit);
    
    const messages = await query;
    return messages.map(m => ({
      id: m.id,
      roomId: m.roomId,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt,
      expiresAt: m.expiresAt,
      senderName: `${m.senderFirstName || ""} ${m.senderLastName || ""}`.trim() || "Usuário",
      senderImage: m.senderImage,
    })).reverse();
  }

  async createChatMessage(data: { roomId: number; senderId: string; body: string; expiresAt: Date }): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(data).returning();
    return message;
  }

  async logBlockedMessage(userId: string, reason: string): Promise<void> {
    await db.insert(chatBlockedMessages).values({ userId, reason });
  }

  async searchUsersForChat(q: string, excludeUserId: string): Promise<any[]> {
    const searchTerm = `%${q}%`;
    return await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
    .from(users)
    .where(and(
      ne(users.id, excludeUserId),
      or(
        ilike(users.firstName, searchTerm),
        ilike(users.lastName, searchTerm),
        ilike(users.email, searchTerm)
      )
    ))
    .limit(20);
  }

  async getChatContacts(userId: string): Promise<any[]> {
    const contactRows = await db.select({ contactId: chatContacts.contactId })
      .from(chatContacts)
      .where(eq(chatContacts.userId, userId));
    
    if (contactRows.length === 0) return [];
    
    const contactIds = contactRows.map(c => c.contactId).filter(Boolean) as string[];
    return await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
    .from(users)
    .where(inArray(users.id, contactIds));
  }

  async getOrCreateDmRoom(userId: string, contactId: string): Promise<ChatRoom> {
    const userRooms = await db.select({ roomId: chatRoomMembers.roomId })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.userId, userId));
    
    for (const { roomId } of userRooms) {
      const [room] = await db.select().from(chatRooms)
        .where(and(eq(chatRooms.id, roomId), eq(chatRooms.type, 'dm')));
      
      if (room) {
        const [hasContact] = await db.select().from(chatRoomMembers)
          .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, contactId)));
        
        if (hasContact) return room;
      }
    }
    
    const [room] = await db.insert(chatRooms).values({ type: 'dm' }).returning();
    await db.insert(chatRoomMembers).values([
      { roomId: room.id, userId },
      { roomId: room.id, userId: contactId },
    ]);
    
    const [existingContact] = await db.select().from(chatContacts)
      .where(and(eq(chatContacts.userId, userId), eq(chatContacts.contactId, contactId)));
    
    if (!existingContact) {
      await db.insert(chatContacts).values({ userId, contactId });
    }
    
    return room;
  }

  async deleteExpiredMessages(): Promise<number> {
    const now = new Date();
    const result = await db.delete(chatMessages).where(lt(chatMessages.expiresAt, now)).returning();
    return result.length;
  }

  // Chat moderation methods
  async getActiveChatBan(userId: string): Promise<ChatUserBan | null> {
    const now = new Date();
    const [ban] = await db.select().from(chatUserBans)
      .where(and(
        eq(chatUserBans.userId, userId),
        or(
          eq(chatUserBans.isPermanent, true),
          gt(chatUserBans.expiresAt, now)
        )
      ))
      .limit(1);
    return ban || null;
  }

  async getAllChatBans(): Promise<any[]> {
    return await db.select({
      id: chatUserBans.id,
      userId: chatUserBans.userId,
      reason: chatUserBans.reason,
      bannedBy: chatUserBans.bannedBy,
      isPermanent: chatUserBans.isPermanent,
      expiresAt: chatUserBans.expiresAt,
      createdAt: chatUserBans.createdAt,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
    })
    .from(chatUserBans)
    .leftJoin(users, eq(chatUserBans.userId, users.id))
    .orderBy(desc(chatUserBans.createdAt));
  }

  async createChatBan(data: InsertChatUserBan): Promise<ChatUserBan> {
    const [ban] = await db.insert(chatUserBans).values(data).returning();
    return ban;
  }

  async deleteChatBan(id: number): Promise<void> {
    await db.delete(chatUserBans).where(eq(chatUserBans.id, id));
  }

  async getChatBannedWords(): Promise<ChatBannedWord[]> {
    return await db.select().from(chatBannedWords).orderBy(chatBannedWords.word);
  }

  async createChatBannedWord(data: InsertChatBannedWord): Promise<ChatBannedWord> {
    const [word] = await db.insert(chatBannedWords).values(data).returning();
    return word;
  }

  async deleteChatBannedWord(id: number): Promise<void> {
    await db.delete(chatBannedWords).where(eq(chatBannedWords.id, id));
  }

  async getBlockedMessagesLog(): Promise<any[]> {
    return await db.select({
      id: chatBlockedMessages.id,
      userId: chatBlockedMessages.userId,
      reason: chatBlockedMessages.reason,
      createdAt: chatBlockedMessages.createdAt,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
    })
    .from(chatBlockedMessages)
    .leftJoin(users, eq(chatBlockedMessages.userId, users.id))
    .orderBy(desc(chatBlockedMessages.createdAt))
    .limit(100);
  }

  async changeUserUf(userId: string, newUf: string, isAdminChange: boolean = false): Promise<{ success: boolean; error?: string }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }
    
    const oldUf = user.uf;
    if (oldUf === newUf) {
      return { success: false, error: "O usuário já está neste estado" };
    }
    
    if (!isAdminChange && user.lastUfChangeAt) {
      const daysSinceChange = Math.floor((Date.now() - new Date(user.lastUfChangeAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceChange < 30) {
        const daysRemaining = 30 - daysSinceChange;
        return { success: false, error: `Você só pode mudar de estado novamente em ${daysRemaining} dias` };
      }
    }
    
    await db.update(users).set({
      uf: newUf,
      lastUfChangeAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    
    if (oldUf) {
      const [oldRoom] = await db.select().from(chatRooms)
        .where(and(eq(chatRooms.type, 'group'), eq(chatRooms.stateUf, oldUf)));
      if (oldRoom) {
        await db.delete(chatRoomMembers)
          .where(and(eq(chatRoomMembers.roomId, oldRoom.id), eq(chatRoomMembers.userId, userId)));
      }
    }
    
    await this.getOrCreateStateGroup(newUf, userId);
    
    return { success: true };
  }

  async canUserChangeUf(userId: string): Promise<{ canChange: boolean; daysRemaining?: number }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { canChange: false };
    }
    
    if (!user.lastUfChangeAt) {
      return { canChange: true };
    }
    
    const daysSinceChange = Math.floor((Date.now() - new Date(user.lastUfChangeAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceChange >= 30) {
      return { canChange: true };
    }
    
    return { canChange: false, daysRemaining: 30 - daysSinceChange };
  }

  async getChatUsersWithUf(): Promise<any[]> {
    return await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      uf: users.uf,
      lastUfChangeAt: users.lastUfChangeAt,
      chatTermsAcceptedAt: users.chatTermsAcceptedAt,
    })
    .from(users)
    .where(sql`${users.chatTermsAcceptedAt} IS NOT NULL`)
    .orderBy(users.firstName);
  }

  async savePushSubscription(data: InsertPushSubscription): Promise<PushSubscription> {
    const existing = await db.select().from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, data.userId),
        eq(pushSubscriptions.endpoint, data.endpoint)
      ));
    if (existing.length > 0) {
      const [updated] = await db.update(pushSubscriptions)
        .set({ p256dh: data.p256dh, auth: data.auth, userAgent: data.userAgent })
        .where(eq(pushSubscriptions.id, existing[0].id))
        .returning();
      return updated;
    }
    const [sub] = await db.insert(pushSubscriptions).values(data).returning();
    return sub;
  }

  async deletePushSubscription(userId: string, endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      ));
  }

  async deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async getPushSubscriptions(userIds?: string[]): Promise<PushSubscription[]> {
    if (userIds && userIds.length > 0) {
      return await db.select().from(pushSubscriptions)
        .where(inArray(pushSubscriptions.userId, userIds));
    }
    return await db.select().from(pushSubscriptions);
  }

  async getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  // --- Notification Messages (Inbox) ---
  async createNotificationMessage(data: InsertNotificationMessage): Promise<NotificationMessage> {
    const [msg] = await db.insert(notificationMessages).values(data).returning();
    return msg;
  }

  async getNotificationMessages(options?: { category?: string; segment?: string; limit?: number; offset?: number }): Promise<NotificationMessage[]> {
    let query = db.select().from(notificationMessages).orderBy(desc(notificationMessages.createdAt));
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    return await query;
  }

  async getNotificationMessagesForUser(userId: string, userSegments: string[], limit: number = 50, offset: number = 0): Promise<NotificationMessage[]> {
    // Get messages that are: general, emergency, update, or targeted to user's segments
    const conditions = [
      eq(notificationMessages.category, "general"),
      eq(notificationMessages.category, "emergency"),
      eq(notificationMessages.category, "update"),
      isNull(notificationMessages.segment),
    ];
    if (userSegments.length > 0) {
      conditions.push(inArray(notificationMessages.segment, userSegments));
    }
    return await db.select().from(notificationMessages)
      .where(or(...conditions))
      .orderBy(desc(notificationMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // --- Notification Deliveries (Audit) ---
  async createNotificationDelivery(data: InsertNotificationDelivery): Promise<NotificationDelivery> {
    const [del] = await db.insert(notificationDeliveries).values(data).returning();
    return del;
  }

  async updateNotificationDelivery(id: number, data: Partial<NotificationDelivery>): Promise<NotificationDelivery> {
    const [updated] = await db.update(notificationDeliveries).set(data).where(eq(notificationDeliveries.id, id)).returning();
    return updated;
  }

  async getNotificationDeliveries(limit: number = 50): Promise<(NotificationDelivery & { message: NotificationMessage })[]> {
    const result = await db.select({
      delivery: notificationDeliveries,
      message: notificationMessages,
    })
    .from(notificationDeliveries)
    .leftJoin(notificationMessages, eq(notificationDeliveries.messageId, notificationMessages.id))
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(limit);
    return result.map(r => ({ ...r.delivery, message: r.message! }));
  }

  // --- Notification Delivery Items ---
  async createNotificationDeliveryItem(data: InsertNotificationDeliveryItem): Promise<NotificationDeliveryItem> {
    const [item] = await db.insert(notificationDeliveryItems).values(data).returning();
    return item;
  }

  async updateNotificationDeliveryItem(id: number, data: Partial<NotificationDeliveryItem>): Promise<void> {
    await db.update(notificationDeliveryItems).set(data).where(eq(notificationDeliveryItems.id, id));
  }

  async getDeliveryItems(deliveryId: number): Promise<NotificationDeliveryItem[]> {
    return await db.select().from(notificationDeliveryItems)
      .where(eq(notificationDeliveryItems.deliveryId, deliveryId))
      .orderBy(desc(notificationDeliveryItems.createdAt));
  }

  // --- Notification Reads ---
  async markNotificationRead(userId: string, messageId: number): Promise<NotificationRead> {
    const existing = await db.select().from(notificationReads)
      .where(and(eq(notificationReads.userId, userId), eq(notificationReads.messageId, messageId)));
    if (existing.length > 0) return existing[0];
    const [read] = await db.insert(notificationReads).values({ userId, messageId }).returning();
    return read;
  }

  async getUserNotificationReads(userId: string): Promise<number[]> {
    const reads = await db.select({ messageId: notificationReads.messageId }).from(notificationReads)
      .where(eq(notificationReads.userId, userId));
    return reads.map(r => r.messageId);
  }

  // --- User Notification Settings ---
  async getUserNotificationSettings(userId: string): Promise<UserNotificationSettings | null> {
    const [settings] = await db.select().from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, userId));
    return settings || null;
  }

  async saveUserNotificationSettings(data: InsertUserNotificationSettings): Promise<UserNotificationSettings> {
    const existing = await this.getUserNotificationSettings(data.userId);
    if (existing) {
      const [updated] = await db.update(userNotificationSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userNotificationSettings.userId, data.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userNotificationSettings).values(data).returning();
    return created;
  }

  async getUsersWithSegment(segment: string): Promise<string[]> {
    const result = await db.select({ userId: userNotificationSettings.userId })
      .from(userNotificationSettings)
      .where(sql`${userNotificationSettings.segments} @> ${JSON.stringify([segment])}`);
    return result.map(r => r.userId);
  }

  async getUsersWithAnySegment(segments: string[]): Promise<string[]> {
    if (segments.length === 0) return [];
    const conditions = segments.map(seg => 
      sql`${userNotificationSettings.segments} @> ${JSON.stringify([seg])}`
    );
    const result = await db.select({ userId: userNotificationSettings.userId })
      .from(userNotificationSettings)
      .where(or(...conditions));
    return Array.from(new Set(result.map(r => r.userId)));
  }

  // --- Emergency Rate Limiting ---
  async getLastEmergencyNotificationTime(adminUserId: string): Promise<Date | null> {
    const [record] = await db.select().from(emergencyNotificationLimits)
      .where(eq(emergencyNotificationLimits.adminUserId, adminUserId));
    return record?.lastSentAt || null;
  }

  async updateEmergencyNotificationLimit(adminUserId: string): Promise<void> {
    const existing = await db.select().from(emergencyNotificationLimits)
      .where(eq(emergencyNotificationLimits.adminUserId, adminUserId));
    if (existing.length > 0) {
      await db.update(emergencyNotificationLimits)
        .set({ lastSentAt: new Date() })
        .where(eq(emergencyNotificationLimits.adminUserId, adminUserId));
    } else {
      await db.insert(emergencyNotificationLimits).values({ adminUserId, lastSentAt: new Date() });
    }
  }

  // --- Bulk User Subscription Lookup ---
  async getAllActiveUserIds(): Promise<string[]> {
    const result = await db.select({ id: users.id }).from(users)
      .where(eq(users.status, "active"));
    return result.map(r => r.id);
  }

  async getUsersWithSubscriptions(userIds?: string[]): Promise<{ userId: string; subscriptions: PushSubscription[] }[]> {
    let query = db.select().from(pushSubscriptions);
    if (userIds && userIds.length > 0) {
      query = query.where(inArray(pushSubscriptions.userId, userIds)) as any;
    }
    const subs = await query;
    const grouped: Record<string, PushSubscription[]> = {};
    for (const sub of subs) {
      if (!grouped[sub.userId]) grouped[sub.userId] = [];
      grouped[sub.userId].push(sub);
    }
    return Object.entries(grouped).map(([userId, subscriptions]) => ({ userId, subscriptions }));
  }

  // --- User Admin Profiles ---
  async getUserAdminProfile(userId: string): Promise<UserAdminProfile | undefined> {
    const [profile] = await db.select().from(userAdminProfiles).where(eq(userAdminProfiles.userId, userId));
    return profile;
  }

  async getUserAdminProfilesBulk(userIds: string[]): Promise<Map<string, UserAdminProfile>> {
    if (userIds.length === 0) return new Map();
    const profiles = await db.select().from(userAdminProfiles).where(inArray(userAdminProfiles.userId, userIds));
    const map = new Map<string, UserAdminProfile>();
    for (const p of profiles) {
      map.set(p.userId, p);
    }
    return map;
  }

  async upsertUserAdminProfile(data: InsertUserAdminProfile): Promise<UserAdminProfile> {
    const existing = await this.getUserAdminProfile(data.userId);
    if (existing) {
      const [updated] = await db.update(userAdminProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userAdminProfiles.userId, data.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userAdminProfiles).values(data).returning();
    return created;
  }

  // --- User Usage Stats ---
  async getUserUsageStats(userId: string): Promise<UserUsageStats | undefined> {
    const [stats] = await db.select().from(userUsageStats).where(eq(userUsageStats.userId, userId));
    return stats;
  }

  async getUserUsageStatsBulk(userIds: string[]): Promise<Map<string, UserUsageStats>> {
    if (userIds.length === 0) return new Map();
    const stats = await db.select().from(userUsageStats).where(inArray(userUsageStats.userId, userIds));
    const map = new Map<string, UserUsageStats>();
    for (const s of stats) {
      map.set(s.userId, s);
    }
    return map;
  }

  async upsertUserUsageStats(data: InsertUserUsageStats): Promise<UserUsageStats> {
    const existing = await this.getUserUsageStats(data.userId);
    if (existing) {
      const [updated] = await db.update(userUsageStats)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userUsageStats.userId, data.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userUsageStats).values(data).returning();
    return created;
  }

  async updateLastSeen(userId: string): Promise<void> {
    const existing = await this.getUserUsageStats(userId);
    if (existing) {
      await db.update(userUsageStats)
        .set({ lastSeenAt: new Date(), updatedAt: new Date() })
        .where(eq(userUsageStats.userId, userId));
    } else {
      await db.insert(userUsageStats).values({ userId, lastSeenAt: new Date(), sessionsCount: 1 });
    }
  }

  async incrementSessionCount(userId: string): Promise<void> {
    const existing = await this.getUserUsageStats(userId);
    if (existing) {
      await db.update(userUsageStats)
        .set({ 
          sessionsCount: (existing.sessionsCount || 0) + 1, 
          lastSeenAt: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(userUsageStats.userId, userId));
    } else {
      await db.insert(userUsageStats).values({ userId, lastSeenAt: new Date(), sessionsCount: 1 });
    }
  }

  async incrementFeatureCount(userId: string, feature: string): Promise<void> {
    const existing = await this.getUserUsageStats(userId);
    const counts = existing?.featureCounts || {};
    counts[feature] = (counts[feature] || 0) + 1;
    
    if (existing) {
      await db.update(userUsageStats)
        .set({ featureCounts: counts, updatedAt: new Date() })
        .where(eq(userUsageStats.userId, userId));
    } else {
      await db.insert(userUsageStats).values({ userId, featureCounts: counts });
    }
  }

  // --- User Coupon Usage ---
  async getUserCouponUsage(userId: string): Promise<UserCouponUsage[]> {
    return await db.select().from(userCouponUsage).where(eq(userCouponUsage.userId, userId));
  }

  async getAllCouponCodes(): Promise<string[]> {
    const result = await db.selectDistinct({ code: userCouponUsage.couponCode }).from(userCouponUsage);
    return result.map(r => r.code);
  }

  async createUserCouponUsage(data: InsertUserCouponUsage): Promise<UserCouponUsage> {
    const [created] = await db.insert(userCouponUsage).values(data).returning();
    return created;
  }

  // --- User Billing Status ---
  async getUserBillingStatus(userId: string): Promise<UserBillingStatus | undefined> {
    const [status] = await db.select().from(userBillingStatus).where(eq(userBillingStatus.userId, userId));
    return status;
  }

  async upsertUserBillingStatus(data: InsertUserBillingStatus): Promise<UserBillingStatus> {
    const existing = await this.getUserBillingStatus(data.userId);
    if (existing) {
      const [updated] = await db.update(userBillingStatus)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userBillingStatus.userId, data.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userBillingStatus).values(data).returning();
    return created;
  }

  // --- User One-Time Messages ---
  async getUserOneTimeMessages(userId: string): Promise<UserOneTimeMessages | undefined> {
    const [record] = await db.select().from(userOneTimeMessages).where(eq(userOneTimeMessages.userId, userId));
    return record;
  }

  async upsertUserOneTimeMessages(userId: string, data: Partial<InsertUserOneTimeMessages>): Promise<UserOneTimeMessages> {
    const existing = await this.getUserOneTimeMessages(userId);
    if (existing) {
      const [updated] = await db.update(userOneTimeMessages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userOneTimeMessages.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userOneTimeMessages).values({ userId, ...data }).returning();
    return created;
  }

  async getLastUnackedDonation(userId: string, lastAckedId?: number | null): Promise<{ donation: Donation; causeName: string } | null> {
    const conditions = [
      eq(donations.userId, userId),
      eq(donations.status, "PAID")
    ];
    if (lastAckedId) {
      conditions.push(gt(donations.id, lastAckedId));
    }
    
    const [donation] = await db.select().from(donations)
      .where(and(...conditions))
      .orderBy(desc(donations.paidAt))
      .limit(1);
    
    if (!donation) return null;
    
    const cause = await this.getDonationCause(donation.causeId);
    return { donation, causeName: cause?.title || "Causa social" };
  }

  async hasConfirmedPayment(userId: string): Promise<boolean> {
    const [payment] = await db.select().from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.status, "paid")))
      .limit(1);
    return !!payment;
  }

  // --- User Preview State ---
  async getUserPreviewState(userId: string): Promise<UserPreviewState | undefined> {
    const [record] = await db.select().from(userPreviewState).where(eq(userPreviewState.userId, userId));
    return record;
  }

  async upsertUserPreviewState(userId: string, data: Partial<InsertUserPreviewState>): Promise<UserPreviewState> {
    const existing = await this.getUserPreviewState(userId);
    if (existing) {
      const [updated] = await db.update(userPreviewState)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userPreviewState.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userPreviewState).values({ userId, ...data }).returning();
    return created;
  }

  async incrementPreviewActions(userId: string): Promise<UserPreviewState> {
    const existing = await this.getUserPreviewState(userId);
    if (existing) {
      const [updated] = await db.update(userPreviewState)
        .set({ 
          actionsUsed: (existing.actionsUsed || 0) + 1,
          updatedAt: new Date() 
        })
        .where(eq(userPreviewState.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userPreviewState).values({ 
      userId, 
      previewStartedAt: new Date(),
      actionsUsed: 1 
    }).returning();
    return created;
  }

  // --- Auth Identities ---
  async getAuthIdentityByProvider(provider: string, providerUserId: string): Promise<AuthIdentity | undefined> {
    const [identity] = await db.select().from(authIdentities)
      .where(and(eq(authIdentities.provider, provider), eq(authIdentities.providerUserId, providerUserId)));
    return identity;
  }

  async getAuthIdentitiesByUserId(userId: string): Promise<AuthIdentity[]> {
    return await db.select().from(authIdentities).where(eq(authIdentities.userId, userId));
  }

  async createAuthIdentity(data: InsertAuthIdentity): Promise<AuthIdentity> {
    const [identity] = await db.insert(authIdentities).values(data).returning();
    return identity;
  }

  async deleteAuthIdentity(id: number): Promise<void> {
    await db.delete(authIdentities).where(eq(authIdentities.id, id));
  }

  // --- Email Auth Tokens ---
  async createEmailAuthToken(data: InsertEmailAuthToken): Promise<EmailAuthToken> {
    const [token] = await db.insert(emailAuthTokens).values(data).returning();
    return token;
  }

  async getValidEmailAuthToken(email: string): Promise<EmailAuthToken | undefined> {
    const [token] = await db.select().from(emailAuthTokens)
      .where(and(
        eq(emailAuthTokens.email, email),
        isNull(emailAuthTokens.usedAt),
        gt(emailAuthTokens.expiresAt, new Date())
      ))
      .orderBy(desc(emailAuthTokens.createdAt))
      .limit(1);
    return token;
  }

  async markEmailAuthTokenUsed(id: number): Promise<void> {
    await db.update(emailAuthTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailAuthTokens.id, id));
  }

  async deleteExpiredEmailAuthTokens(): Promise<void> {
    await db.delete(emailAuthTokens).where(lt(emailAuthTokens.expiresAt, new Date()));
  }

  // --- Billing Plans ---
  async getBillingPlans(): Promise<BillingPlan[]> {
    return await db.select().from(billingPlans)
      .where(eq(billingPlans.isActive, true))
      .orderBy(billingPlans.displayOrder);
  }

  async getBillingPlan(code: string): Promise<BillingPlan | undefined> {
    const [plan] = await db.select().from(billingPlans).where(eq(billingPlans.code, code));
    return plan;
  }

  async createBillingPlan(data: InsertBillingPlan): Promise<BillingPlan> {
    const [plan] = await db.insert(billingPlans).values(data).returning();
    return plan;
  }

  async updateBillingPlan(code: string, data: Partial<InsertBillingPlan>): Promise<BillingPlan | undefined> {
    const [plan] = await db.update(billingPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(billingPlans.code, code))
      .returning();
    return plan;
  }

  async upsertBillingPlan(data: InsertBillingPlan): Promise<BillingPlan> {
    const existing = await this.getBillingPlan(data.code);
    if (existing) {
      const [updated] = await db.update(billingPlans)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(billingPlans.code, data.code))
        .returning();
      return updated;
    }
    return this.createBillingPlan(data);
  }

  // --- Billing Orders ---
  async createBillingOrder(data: InsertBillingOrder): Promise<BillingOrder> {
    const [order] = await db.insert(billingOrders).values(data).returning();
    return order;
  }

  async getBillingOrder(id: number): Promise<BillingOrder | undefined> {
    const [order] = await db.select().from(billingOrders).where(eq(billingOrders.id, id));
    return order;
  }

  async getBillingOrderByAsaasId(asaasPaymentId: string): Promise<BillingOrder | undefined> {
    const [order] = await db.select().from(billingOrders)
      .where(eq(billingOrders.asaasPaymentId, asaasPaymentId));
    return order;
  }

  async getUserBillingOrders(userId: string): Promise<BillingOrder[]> {
    return await db.select().from(billingOrders)
      .where(eq(billingOrders.userId, userId))
      .orderBy(desc(billingOrders.createdAt));
  }

  async updateBillingOrder(id: number, data: Partial<BillingOrder>): Promise<BillingOrder | undefined> {
    const [order] = await db.update(billingOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(billingOrders.id, id))
      .returning();
    return order;
  }

  // --- User Entitlements ---
  async getUserEntitlement(userId: string): Promise<UserEntitlement | undefined> {
    const [entitlement] = await db.select().from(userEntitlements)
      .where(eq(userEntitlements.userId, userId));
    return entitlement;
  }

  async upsertUserEntitlement(data: InsertUserEntitlement): Promise<UserEntitlement> {
    const existing = await this.getUserEntitlement(data.userId);
    if (existing) {
      const [updated] = await db.update(userEntitlements)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userEntitlements.userId, data.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userEntitlements).values(data).returning();
    return created;
  }

  async activateUserEntitlement(userId: string, planCode: string, durationDays: number, orderId: number): Promise<UserEntitlement> {
    const existing = await this.getUserEntitlement(userId);
    const now = new Date();
    let accessUntil: Date;
    
    if (existing?.accessUntil && existing.accessUntil > now) {
      accessUntil = new Date(existing.accessUntil.getTime() + durationDays * 24 * 60 * 60 * 1000);
    } else {
      accessUntil = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }
    
    return this.upsertUserEntitlement({
      userId,
      status: "active",
      planCode,
      accessUntil,
      lastOrderId: orderId
    });
  }

  async checkAndExpireEntitlements(): Promise<void> {
    await db.update(userEntitlements)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(
        eq(userEntitlements.status, "active"),
        lte(userEntitlements.accessUntil, new Date())
      ));
  }

  async hasActiveEntitlement(userId: string): Promise<boolean> {
    const entitlement = await this.getUserEntitlement(userId);
    if (!entitlement) return false;
    if (entitlement.status !== "active") return false;
    if (!entitlement.accessUntil) return false;
    return entitlement.accessUntil > new Date();
  }

  // --- Seed Default Billing Plans ---
  async seedBillingPlans(): Promise<void> {
    const plans: InsertBillingPlan[] = [
      {
        code: "monthly",
        name: "Mensal",
        description: "Acesso por 30 dias",
        priceCents: 2990,
        durationDays: 30,
        discountPercent: 0,
        isActive: true,
        displayOrder: 1
      },
      {
        code: "semiannual",
        name: "Semestral",
        description: "Acesso por 6 meses",
        priceCents: 14990,
        originalPriceCents: 17940,
        durationDays: 180,
        discountPercent: 17,
        isActive: true,
        displayOrder: 2
      },
      {
        code: "annual",
        name: "Anual",
        description: "Acesso por 1 ano",
        priceCents: 27990,
        originalPriceCents: 35880,
        durationDays: 365,
        discountPercent: 22,
        isActive: true,
        displayOrder: 3
      }
    ];

    for (const plan of plans) {
      await this.upsertBillingPlan(plan);
    }
  }

  // ===== NEW FEATURES: USER MEDICATIONS, PREFERENCES, ADMIN FLAGS =====

  // User Medications
  async getUserMedications(userId: string): Promise<UserMedication[]> {
    return await db.select().from(userMedications)
      .where(eq(userMedications.userId, userId))
      .orderBy(desc(userMedications.createdAt));
  }

  async getUserMedication(id: number): Promise<UserMedication | undefined> {
    const [item] = await db.select().from(userMedications).where(eq(userMedications.id, id));
    return item;
  }

  async createUserMedication(item: InsertUserMedication): Promise<UserMedication> {
    const [created] = await db.insert(userMedications).values(item).returning();
    return created;
  }

  async updateUserMedication(id: number, item: Partial<InsertUserMedication>): Promise<UserMedication> {
    const [updated] = await db.update(userMedications).set({ ...item, updatedAt: new Date() }).where(eq(userMedications.id, id)).returning();
    return updated;
  }

  async deleteUserMedication(id: number, userId: string): Promise<void> {
    const med = await this.getUserMedication(id);
    if (!med || med.userId !== userId) {
      throw new Error("Medication not found or unauthorized");
    }
    await db.delete(userMedications).where(eq(userMedications.id, id));
  }

  async searchUserMedications(userId: string, query: string): Promise<UserMedication[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(userMedications)
      .where(and(
        eq(userMedications.userId, userId),
        ilike(userMedications.name, searchPattern)
      ))
      .orderBy(desc(userMedications.createdAt));
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async createUserPreferences(userId: string, item: InsertUserPreferences): Promise<UserPreferences> {
    const [created] = await db.insert(userPreferences).values({ ...item, userId }).returning();
    return created;
  }

  async updateUserPreferences(userId: string, item: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (!existing) {
      return this.createUserPreferences(userId, item as InsertUserPreferences);
    }
    const [updated] = await db.update(userPreferences).set({ ...item, updatedAt: new Date() }).where(eq(userPreferences.userId, userId)).returning();
    return updated;
  }

  // Admin Feature Flags
  async getAdminFeatureFlags(): Promise<AdminFeatureFlag[]> {
    return await db.select().from(adminFeatureFlags).orderBy(adminFeatureFlags.key);
  }

  async getAdminFeatureFlag(key: string): Promise<AdminFeatureFlag | undefined> {
    const [flag] = await db.select().from(adminFeatureFlags).where(eq(adminFeatureFlags.key, key));
    return flag;
  }

  async createAdminFeatureFlag(item: InsertAdminFeatureFlag): Promise<AdminFeatureFlag> {
    const [created] = await db.insert(adminFeatureFlags).values(item).returning();
    return created;
  }

  async updateAdminFeatureFlag(key: string, item: Partial<InsertAdminFeatureFlag>): Promise<AdminFeatureFlag> {
    const [updated] = await db.update(adminFeatureFlags).set({ ...item, updatedAt: new Date() }).where(eq(adminFeatureFlags.key, key)).returning();
    return updated;
  }

  async isFeatureEnabled(key: string): Promise<boolean> {
    const flag = await this.getAdminFeatureFlag(key);
    return flag?.enabled ?? true; // Default to enabled if not found
  }

  // Admin Quick Access Config
  async getAdminQuickAccessConfigs(tab?: string): Promise<AdminQuickAccessConfig[]> {
    if (tab) {
      return await db.select().from(adminQuickAccessConfig).where(eq(adminQuickAccessConfig.tab, tab)).orderBy(adminQuickAccessConfig.displayOrder);
    }
    return await db.select().from(adminQuickAccessConfig).orderBy(adminQuickAccessConfig.displayOrder);
  }

  async getAdminQuickAccessConfig(id: number): Promise<AdminQuickAccessConfig | undefined> {
    const [config] = await db.select().from(adminQuickAccessConfig).where(eq(adminQuickAccessConfig.id, id));
    return config;
  }

  async createAdminQuickAccessConfig(item: InsertAdminQuickAccessConfig): Promise<AdminQuickAccessConfig> {
    const [created] = await db.insert(adminQuickAccessConfig).values(item).returning();
    return created;
  }

  async updateAdminQuickAccessConfig(id: number, item: Partial<InsertAdminQuickAccessConfig>): Promise<AdminQuickAccessConfig> {
    const [updated] = await db.update(adminQuickAccessConfig).set({ ...item, updatedAt: new Date() }).where(eq(adminQuickAccessConfig.id, id)).returning();
    return updated;
  }

  async deleteAdminQuickAccessConfig(id: number): Promise<void> {
    await db.delete(adminQuickAccessConfig).where(eq(adminQuickAccessConfig.id, id));
  }

  async reorderAdminQuickAccessConfigs(tab: string, items: { id: number; displayOrder: number }[]): Promise<void> {
    for (const item of items) {
      await db.update(adminQuickAccessConfig).set({ displayOrder: item.displayOrder }).where(eq(adminQuickAccessConfig.id, item.id));
    }
  }

  // Message of the Day
  async getMessageOfDayMessages(type?: string, source?: string): Promise<MessageOfDayMessage[]> {
    const conditions = [eq(messageOfDayMessages.isActive, true)];
    if (type) {
      conditions.push(eq(messageOfDayMessages.type, type));
    }
    if (source) {
      conditions.push(eq(messageOfDayMessages.source, source));
    }
    return await db.select().from(messageOfDayMessages)
      .where(and(...conditions))
      .orderBy(desc(messageOfDayMessages.createdAt));
  }

  async getMessageOfDayMessage(id: number): Promise<MessageOfDayMessage | undefined> {
    const [msg] = await db.select().from(messageOfDayMessages).where(eq(messageOfDayMessages.id, id));
    return msg;
  }

  async createMessageOfDayMessage(item: InsertMessageOfDayMessage, createdBy?: string): Promise<MessageOfDayMessage> {
    const [created] = await db.insert(messageOfDayMessages).values({ ...item, createdBy: createdBy || null }).returning();
    return created;
  }

  async updateMessageOfDayMessage(id: number, item: Partial<InsertMessageOfDayMessage>): Promise<MessageOfDayMessage> {
    const [updated] = await db.update(messageOfDayMessages).set({ ...item, updatedAt: new Date() }).where(eq(messageOfDayMessages.id, id)).returning();
    return updated;
  }

  async deleteMessageOfDayMessage(id: number): Promise<void> {
    await db.delete(messageOfDayMessages).where(eq(messageOfDayMessages.id, id));
  }

  async getRandomMessageOfDay(type: string): Promise<MessageOfDayMessage | undefined> {
    // Get random active message of given type
    const messages = await this.getMessageOfDayMessages(type);
    if (messages.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  // ============== AUTHENTICATION METHODS ==============
  
  async getUser(id: string): Promise<(typeof users.$inferSelect) | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<(typeof users.$inferSelect) | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(data: {
    email: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string | null;
  }): Promise<typeof users.$inferSelect> {
    const [user] = await db.insert(users).values({
      email: data.email,
      passwordHash: data.passwordHash || null,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      profileImageUrl: data.profileImageUrl || null,
      role: "user", // Default role
    }).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<typeof users.$inferSelect>): Promise<typeof users.$inferSelect> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<(typeof users.$inferSelect)[]> {
    return db.select().from(users);
  }

  async updateUserStatus(id: string, status: "active" | "pending" | "blocked"): Promise<typeof users.$inferSelect> {
    const [user] = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<typeof users.$inferSelect> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async activateUserWithSubscription(id: string, expiresAt: Date): Promise<typeof users.$inferSelect> {
    const [user] = await db.update(users)
      .set({ status: "active", subscriptionExpiresAt: expiresAt })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserUf(userId: string, uf: string): Promise<void> {
    await db.update(users).set({ uf }).where(eq(users.id, userId));
  }

  async updateUserChatTerms(userId: string): Promise<void> {
    await db.update(users).set({ acceptedChatTermsAt: new Date() }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
