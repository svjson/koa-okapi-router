import z from 'zod/v4'

export const GenreSchema = z.enum([
  'crime',
  'mystery',
  'sci-fi',
  'fantasy',
  'self-help',
  'blatant propaganda',
])

export const ActorSchemaBase = z.object({
  id: z.int(),
  name: z.string(),
})

export const AuthorSchema = ActorSchemaBase.extend({
  type: z.literal('author'),
  genres: z.array(GenreSchema),
})

export const PublisherSchema = ActorSchemaBase.extend({
  type: z.literal('publisher'),
  region: z.string(),
})

export const ActorSchema = z.discriminatedUnion('type', [AuthorSchema, PublisherSchema])
