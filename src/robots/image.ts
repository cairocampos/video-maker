import { google } from 'googleapis'
const customSearch = google.customsearch('v1')
import googleSearchCredentials from '../credentials/google-search.json'
import imageDownloader from 'image-downloader'
import * as state from './state'
import path from 'path'


export async function robot() {
  console.log(`> [image-robot] Starting... `)
  const content = state.load()
  await fetchImagesOfAllSentences();
  await downloadAllImages()
  state.save(content);

  async function fetchImagesOfAllSentences() {
    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      let query = '';

      if(sentenceIndex === 0) {
        query = `${content.searchTerm}`
      } else {
        query = `${content.searchTerm} ${content.sentences[sentenceIndex].keywords[0]}`
      }

      console.log(`> [image-robot] Querying Google Images with:  ${query}`)
      content.sentences[sentenceIndex].images = await fetchGoogleAndReturnImagesLinks(query);
      content.sentences[sentenceIndex].googleSearchQuery = query;
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

  async function downloadAllImages() {
    content.downloadedImages = []
    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      const images = content.sentences[sentenceIndex].images;

      for(let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        const imageUrl = images[imageIndex]

        try {
        if(content.downloadedImages?.includes(imageUrl)) {
          throw new Error('Image already downloaded')
        }
        await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)
        content.downloadedImages.push(imageUrl);
        console.log(`> [image-robot] [${sentenceIndex}][${imageIndex}] Image successfully downloaded: ${imageUrl}`)
        break;
        } catch(error) {
        console.log(`> [image-robot] [${sentenceIndex}][${imageIndex}] Error (${imageUrl} ${error})`)
        }
      }
    }
  }

  async function downloadAndSave(imageUrl: string, fileName: string)  {
    return imageDownloader.image({
      url: imageUrl,
      dest: path.join(__dirname, '..', 'content', fileName)
    })
  }
}