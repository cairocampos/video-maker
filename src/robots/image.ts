import { google } from 'googleapis'
const customSearch = google.customsearch('v1')
import googleSearchCredentials from '../credentials/google-search.json'
import { Content } from '../types/content'

import * as state from './state'

export async function robot() {
  const content = state.load()
  await fetchIMagesOfAllSentences();

  state.save(content);

  async function fetchIMagesOfAllSentences() {
    for (const sentence of content.sentences) {
      const query = `${content.searchTerm} ${sentence.keywords[0]}`
      sentence.images = await fetchGoogleAndReturnImagesLinks(query);
      sentence.googleSearchQuery = query;
    }
  }

  async function fetchGoogleAndReturnImagesLinks(query: string) {
    const response = await customSearch.cse.list({
      auth: googleSearchCredentials.apiKey,
      cx: googleSearchCredentials.searchEngineId,
      q: query,
      num: 2,
      imgSize: 'huge',
      searchType: 'image'
    })

    const imagesUrl = response.data.items?.map(item => item.link)?.filter(item => typeof item === 'string')

    return imagesUrl as string[]
  }
}