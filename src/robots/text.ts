import { Content } from "../types/content";
import queryString from 'node:querystring'
import { WikipediaResponse } from "../types/wikipedia-response";
import sentenceBoundaryDetection from 'sbd'
import watsonNlu from 'ibm-watson/natural-language-understanding/v1'
import {IamAuthenticator} from 'ibm-watson/auth'
import watsonNluCredentials from '../credentials/watson-nlu.json'
import * as state from './state'

export async function robot() {
  const content = state.load()
  await fetchContentFromWikipedia()
  sanitizeContent()
  breakContentIntoSentences()
  limitMaximumSentences()
  await fetchKeywordsOfAllSentences()

  state.save(content)


  async function fetchContentFromWikipedia(): Promise<void> {
    const query = queryString.stringify({
      action: 'query',
      prop: 'extracts',
      format: 'json',
      exintro: 1, // retorna apenas o conteúdo antes da primeira seção. Se você quiser os dados completos, basta removê-los.
      exlimit: 'max',
      formatversion: 2,
      redirects: 1,
      explaintext: 1,
      titles: content.searchTerm
    });
    const response = await fetch('https://pt.wikipedia.org/w/api.php?' + query)
    const data: WikipediaResponse = await response.json();
    const wikipediaContent = data.query.pages[0].extract;
    content.sourceContentOriginal = wikipediaContent;
  }

  function sanitizeContent() {
    const withouBlankLinesAndMarkDown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
    const withouDatesInParentheses = removeDatesInParentheses(withouBlankLinesAndMarkDown)
    content.sourceContentSanitized = withouDatesInParentheses
    function removeBlankLinesAndMarkdown(text: string) {
      const allLines = text.split('\n')
      return allLines
        .filter(line => !line.trim().startsWith('=') || line.trim().length !== 0)
        .join(' ')
    }

    function removeDatesInParentheses(text:string) {
      return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/ /g, ' ')
    }
  }

  function breakContentIntoSentences() {
    const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
    sentences.forEach(sentence => {
      content.sentences.push({
        text: sentence,
        keywords: [],
        images: [],
        googleSearchQuery: ''
      })
    })
  }

  function limitMaximumSentences() {
    content.sentences = content.sentences.slice(0, content.maximumSentences)
  }

  async function fetchWatsonAndReturnKeywords(sentence: string): Promise<string[]> {
    const client = new watsonNlu({
      authenticator: new IamAuthenticator({apikey: watsonNluCredentials.apikey}),
      version: '2018-04-05',
      serviceUrl: watsonNluCredentials.url,
    });
  
    const response = await client.analyze({
      text: sentence,
      features: {
        keywords: {}
      }
    })

    if(!response.result.keywords?.length) return [];

    const keywords = response.result.keywords
      .map(keyword => keyword?.text)
      .filter(text => typeof text !== undefined);

    return keywords as string[]
  }

  async function fetchKeywordsOfAllSentences() {
    for await (const sentence of content.sentences) {
      sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
    }
  }
}