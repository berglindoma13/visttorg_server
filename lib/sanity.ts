import sanityClient from '@sanity/client'

export const client = sanityClient({
  projectId: 'dmvpih9k',
  dataset: 'production',
  useCdn: false, // `false` if you want to ensure fresh data
  token: process.env.SANITY_API_KEY
})