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
  prescriptions,
  checklists,
  shifts,
  notes,
  libraryCategories,
  libraryItems,
  shiftChecklists,
  handovers,
  goals
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
  checklists: {
    list: {
      method: 'GET' as const,
      path: '/api/checklists',
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
      path: '/api/goals', // Get current month goal
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
