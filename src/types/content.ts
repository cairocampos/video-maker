type Sentence = {
  text:string;
  keywords: string[],
  images: string[]
  googleSearchQuery:string
}

export type Content = {
  searchTerm: string;
  prefix: string;
  sourceContentOriginal:string;
  sourceContentSanitized: string,
  sentences: Sentence[]
  maximumSentences: number
}