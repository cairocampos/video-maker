import { google } from 'googleapis'
const customSearch = google.customsearch('v1')
import googleSearchCredentials from '../credentials/google-search.json'
import imageDownloader from 'image-downloader'
import * as state from './state'
import path from 'path'


export async function robot() {
  const content = state.load()
  await fetchImagesOfAllSentences();
  await downloadAllImages()
  state.save(content);

  async function fetchImagesOfAllSentences() {
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

  async function downloadAllImages() {
    content.downloadedImages = []
    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      const images = content.sentences[sentenceIndex].images;

      for(let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        const imageUrl = images[imageIndex]

        try {
        if(content.downloadedImages?.includes(imageUrl)) {
          throw new Error('Imagem já foi baixada')
        }
        await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)
        content.downloadedImages.push(imageUrl);
        console.log(`> [${sentenceIndex}][${imageIndex}] Baixou imagem com sucesso: ${imageUrl}`)
        break;
        } catch(error) {
        console.log(`> [${sentenceIndex}][${imageIndex}] Erro ao baixar (${imageUrl} ${error})`)
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