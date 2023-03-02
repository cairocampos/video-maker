import { google } from 'googleapis'
const customSearch = google.customsearch('v1')
import googleSearchCredentials from '../credentials/google-search.json'
import imageDownloader, { image } from 'image-downloader'
import gm from 'gm'
import * as state from './state'
import path from 'path'
import { Content } from '../types/content'

const imageMagick = gm.subClass({imageMagick: true})
export async function robot() {
  const content = state.load()
  await fetchImagesOfAllSentences();
  await downloadAllImages()
  await convertAllImages();
  await createAllSentenceImages()
  await createYouTubeThumbnail()
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

  async function convertAllImages() {
    for(let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      await convertImage(sentenceIndex);
    }
  }

  async function convertImage(sentenceIndex: number) {
    return new Promise((resolve, reject) => {
      const inputFile = path.resolve(__dirname, `../content/${sentenceIndex}-original.png[0]`)
      const outputFile = path.resolve(__dirname, `../content/${sentenceIndex}-converted.png`)
      const width = 1920;
      const height = 1080;

      imageMagick('')
        .in(inputFile)
        .out('(')
          .out('-clone')
          .out('-0')
          .out('-background', 'white')
          .out('-blur', '0x9')
          .out('-resize', `${width}x${height}^`)
        .out(')')
        .out('(')
          .out('-clone')
          .out('0')
          .out('-background', 'white')
          .out('-resize', `${width}x${height}`)
        .out(')')
        .out('-delete', '0')
        .out('-gravity', 'center')
        .out('-compose', 'over')
        .out('-composite')
        .out('-extent', `${width}x${height}`)
        .write(outputFile, error => {
          if(error) {
            return reject(error)
          }

          console.log(`> Image converted: ${inputFile}`)
          resolve(true)
        })
    })
  }

  async function createAllSentenceImages() {
    for(let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      await createSentenceImage(sentenceIndex, content.sentences[sentenceIndex].text)
    }
  }

  async function createSentenceImage(sentenceIndex: number, sentenceText: string) {
    return new Promise((resolve, reject) => {
      const outputFile = path.join(__dirname, `../content/${sentenceIndex}-sentence.png`);

      type TemplateSetting = {
        [key:number]: {
          size: string;
          gravity: string
        }
      }

      const templateSettings: TemplateSetting = {
        0: {
          size: '1920x400',
          gravity: 'center'
        },
        1: {
          size: '1920x1080',
          gravity: 'center'
        },
        2: {
          size: '800x1080',
          gravity: 'west'
        },
        3: {
          size: '1920x400',
          gravity: 'center'
        },
        4: {
          size: '1920x1080',
          gravity: 'center'
        },
        5: {
          size: '800x1080',
          gravity: 'west'
        },
        6: {
          size: '1920x400',
          gravity: 'center'
        }
      }

      imageMagick('')
        .out('-size', templateSettings[sentenceIndex].size)
        .out('-gravity', templateSettings[sentenceIndex].gravity)
        .out('-background', 'transparent')
        .out('-fill', 'white')
        .out('-kerning', '-1')
        .out(`caption:${sentenceText}`)
        .write(outputFile, error => {
          if(error) {
            return reject(error)
          }

          console.log(`> Sentence created: ${outputFile}`)
          resolve(true)
        })

    })
  }

  async function createYouTubeThumbnail() {
    return new Promise((resolve, reject) => {
      imageMagick('')
        .in(path.resolve(__dirname, '../content/0-converted.png'))
        .write(path.resolve(__dirname, '../content/youtube-thumbnail.jpg'), error => {
          if(error) {
            return reject(error)
          }

          console.log(`> Creating YouTube thumbnail`)
          resolve(true)
        })
    })
  }
}