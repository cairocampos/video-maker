import readline from 'readline-sync'
import { Content } from './types/content';

function start() {
  const content: Content = {
    searchTerm: "",
    prefix: "",
  }

  content.searchTerm = askAndReturnSearchTerm();
  content.prefix = askAndReturnPrefix();

  function askAndReturnSearchTerm() {
    return readline.question('Digite um termo de busca da Wikipedia: ');
  }

  function askAndReturnPrefix() {
    const prefixes = ['Quem é', 'O que é', 'A história de']
    const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Escolha uma opção')
    const selectedPrefixText = prefixes[selectedPrefixIndex];

    return selectedPrefixText;
  }
}

start();