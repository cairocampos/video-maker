export type WikipediaResponse = {
  query: {
    pages: {
      pageid:number
      ns:number
      title: string;
      extract:string
    }[]
  }
}