import { z } from 'zod'

export const deleteStageSchema = z.object({ id: z.uuid() })
