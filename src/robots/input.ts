import readline from 'readline-sync'
import { Content } from "../types/content";
import * as state from  '../robots/state'

export function input(): Content {
  const content: Content = {
    searchTerm: "",
    prefix: "",
    sourceContentOriginal: "",
    sourceContentSanitized: "",
    sentences: [],
    maximumSentences: 7
  }
  content.searchTerm = askAndReturnSearchTerm();
  content.prefix = askAndReturnPrefix(content.searchTerm);
  state.save(content);

  function askAndReturnSearchTerm() {
    return readline.question('Digite um termo de busca da Wikipedia: ');
  }

  function askAndReturnPrefix(term:string) {
    const prefixes = ['Quem é', 'O que é', 'A história de']
    const selectedPrefixIndex = readline.keyInSelect(prefixes, `Escolha uma opção para ${term}: `)
    const selectedPrefixText = prefixes[selectedPrefixIndex];

    return selectedPrefixText;
  }

  return content
}