import { z } from 'zod';
import { 
  insertPrescriptionSchema, 
  insertChecklistSchema, 
  insertShiftSchema, 
  insertNoteSchema,
  insertLibraryCategorySchema,
  insertLibraryItemSchema,
  insertShiftChecklistSchema,
  insertHandoverSchema,
  insertGoalSchema,
  insertProtocolSchema,
  insertFlashcardSchema,
  insertFavoriteSchema,
  insertDoctorProfileSchema,
  insertInterconsultMessageSchema,
  prescriptions,
  checklists,
  shifts,
  notes,
  libraryCategories,
  libraryItems,
  shiftChecklists,
  handovers,
  goals,
  protocols,
  flashcards,
  favorites,
  adminSettings,
  doctorProfiles,
  interconsultMessages
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  prescriptions: {
    list: {
      method: 'GET' as const,
      path: '/api/prescriptions',
      responses: {
        200: z.array(z.custom<typeof prescriptions.$inferSelect>()),
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/prescriptions/search',
      responses: {
        200: z.array(z.custom<typeof prescriptions.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/prescriptions/:id',
      responses: {
        200: z.custom<typeof prescriptions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/prescriptions',
      input: insertPrescriptionSchema,
      responses: {
        201: z.custom<typeof prescriptions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/prescriptions/:id',
      input: insertPrescriptionSchema.partial(),
      responses: {
        200: z.custom<typeof prescriptions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/prescriptions/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  protocols: {
    list: {
      method: 'GET' as const,
      path: '/api/protocols',
      responses: {
        200: z.array(z.custom<typeof protocols.$inferSelect>()),
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/protocols/search',
      responses: {
        200: z.array(z.custom<typeof protocols.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/protocols/:id',
      responses: {
        200: z.custom<typeof protocols.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/protocols',
      input: insertProtocolSchema,
      responses: {
        201: z.custom<typeof protocols.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/protocols/:id',
      input: insertProtocolSchema.partial(),
      responses: {
        200: z.custom<typeof protocols.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/protocols/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  checklists: {
    list: {
      method: 'GET' as const,
      path: '/api/checklists',
      responses: {
        200: z.array(z.custom<typeof checklists.$inferSelect>()),
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/checklists/search',
      responses: {
        200: z.array(z.custom<typeof checklists.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/checklists/:id',
      responses: {
        200: z.custom<typeof checklists.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/checklists',
      input: insertChecklistSchema,
      responses: {
        201: z.custom<typeof checklists.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/checklists/:id',
      input: insertChecklistSchema.partial(),
      responses: {
        200: z.custom<typeof checklists.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/checklists/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  flashcards: {
    list: {
      method: 'GET' as const,
      path: '/api/flashcards',
      responses: {
        200: z.array(z.custom<typeof flashcards.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/flashcards/:id',
      responses: {
        200: z.custom<typeof flashcards.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/flashcards',
      input: insertFlashcardSchema,
      responses: {
        201: z.custom<typeof flashcards.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/flashcards/:id',
      input: insertFlashcardSchema.partial(),
      responses: {
        200: z.custom<typeof flashcards.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/flashcards/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  favorites: {
    list: {
      method: 'GET' as const,
      path: '/api/favorites',
      responses: {
        200: z.array(z.custom<typeof favorites.$inferSelect>()),
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/favorites',
      input: insertFavoriteSchema,
      responses: {
        201: z.custom<typeof favorites.$inferSelect>(),
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/favorites/:itemType/:itemId',
      responses: {
        204: z.void(),
      },
    },
  },
  doctorProfile: {
    get: {
      method: 'GET' as const,
      path: '/api/doctor-profile',
      responses: {
        200: z.custom<typeof doctorProfiles.$inferSelect>().nullable(),
      },
    },
    upsert: {
      method: 'POST' as const,
      path: '/api/doctor-profile',
      input: insertDoctorProfileSchema,
      responses: {
        200: z.custom<typeof doctorProfiles.$inferSelect>(),
      },
    },
  },
  adminSettings: {
    list: {
      method: 'GET' as const,
      path: '/api/admin/settings',
      responses: {
        200: z.array(z.custom<typeof adminSettings.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/admin/settings/:key',
      responses: {
        200: z.custom<typeof adminSettings.$inferSelect>().nullable(),
      },
    },
    set: {
      method: 'POST' as const,
      path: '/api/admin/settings',
      input: z.object({ key: z.string(), value: z.string() }),
      responses: {
        200: z.custom<typeof adminSettings.$inferSelect>(),
      },
    },
  },
  interconsult: {
    list: {
      method: 'GET' as const,
      path: '/api/interconsult',
      responses: {
        200: z.array(z.custom<typeof interconsultMessages.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/interconsult',
      input: insertInterconsultMessageSchema,
      responses: {
        201: z.custom<typeof interconsultMessages.$inferSelect>(),
      },
    },
  },
  shifts: {
    list: {
      method: 'GET' as const,
      path: '/api/shifts',
      responses: {
        200: z.array(z.custom<typeof shifts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/shifts',
      input: insertShiftSchema,
      responses: {
        201: z.custom<typeof shifts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/shifts/:id',
      input: insertShiftSchema.partial(),
      responses: {
        200: z.custom<typeof shifts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/shifts/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/shifts/stats',
      responses: {
        200: z.object({
          totalEarnings: z.number(),
          totalHours: z.number(),
          upcomingShifts: z.array(z.custom<typeof shifts.$inferSelect>()),
          monthlyGoal: z.number().nullable(),
        }),
      },
    },
  },
  notes: {
    list: {
      method: 'GET' as const,
      path: '/api/notes',
      responses: {
        200: z.array(z.custom<typeof notes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/notes',
      input: insertNoteSchema,
      responses: {
        201: z.custom<typeof notes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/notes/:id',
      input: insertNoteSchema.partial(),
      responses: {
        200: z.custom<typeof notes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/notes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  library: {
    categories: {
      list: {
        method: 'GET' as const,
        path: '/api/library/categories',
        responses: {
          200: z.array(z.custom<typeof libraryCategories.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/library/categories',
        input: insertLibraryCategorySchema,
        responses: {
          201: z.custom<typeof libraryCategories.$inferSelect>(),
          403: errorSchemas.unauthorized,
        },
      },
    },
    items: {
      list: {
        method: 'GET' as const,
        path: '/api/library/items',
        input: z.object({ categoryId: z.coerce.number() }),
        responses: {
          200: z.array(z.custom<typeof libraryItems.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/library/items',
        input: insertLibraryItemSchema,
        responses: {
          201: z.custom<typeof libraryItems.$inferSelect>(),
          403: errorSchemas.unauthorized,
        },
      },
    },
  },
  handovers: {
    list: {
      method: 'GET' as const,
      path: '/api/handovers',
      responses: {
        200: z.array(z.custom<typeof handovers.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/handovers',
      input: insertHandoverSchema,
      responses: {
        201: z.custom<typeof handovers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/handovers/:id',
      input: insertHandoverSchema.partial(),
      responses: {
        200: z.custom<typeof handovers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/handovers/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  goals: {
    get: {
      method: 'GET' as const,
      path: '/api/goals',
      responses: {
        200: z.custom<typeof goals.$inferSelect>().nullable(),
      },
    },
    set: {
      method: 'POST' as const,
      path: '/api/goals',
      input: insertGoalSchema,
      responses: {
        201: z.custom<typeof goals.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
