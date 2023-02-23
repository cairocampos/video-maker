import { Content } from "../types/content";
import queryString from 'node:querystring'
import { WikipediaResponse } from "../types/wikipedia-response";
import sentenceBoundaryDetection from 'sbd'

export async function robot(content: Content) {
  await fetchContentFromWikipedia()
  sanitizeContent()
  breakContentIntoSentences()


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
        images: []
      })
    })
  }
}