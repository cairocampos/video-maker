import readline from 'readline-sync'
import { Content } from "./types/content";

export function userInput(): Content {
  const content: Content = {
    searchTerm: "",
    prefix: "",
    sourceContentOriginal: "",
    sourceContentSanitized: "",
    sentences: []
  }
  content.searchTerm = askAndReturnSearchTerm();
  content.prefix = askAndReturnPrefix(content.searchTerm);

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