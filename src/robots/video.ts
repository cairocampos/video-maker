import path from 'node:path'
import * as state from './state'
import gm from 'gm'
const imageMagick = gm.subClass({imageMagick: true})

import { spawn } from 'node:child_process'

const rootPath = path.resolve(__dirname, '..')


export async function robot() {
  const content = state.load()
  await convertAllImages();
  await createAllSentenceImages()
  await createYouTubeThumbnail()
  createAfterEffectScript()
  await renderVideoWithAfterEffects()

  state.save(content)

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

  function createAfterEffectScript() {
    state.saveScript(content);
  }

  async function renderVideoWithAfterEffects() {
    return new Promise((resolve, reject) => {
      const aerenderFilePath = '/Applications/Adobe After Effects CC 2019/aerender'
      const templateFilePath = `${rootPath}/templates/1/template.aep`
      const destinationFilePath = `${rootPath}/content/output.mov`;

      console.log('> Starting After Effecs')
      const aerender = spawn(aerenderFilePath, [
        '-comp', 'main',
        '-project', templateFilePath,
        '-output', destinationFilePath
      ])

      aerender.stdout.on('data', (data) => {
        process.stdout.write(data)
      });

      aerender.on('close', () => {
        console.log(`> After Effects closed`)
        resolve(true)
      })
    })
  }
}