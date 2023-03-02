import fs from 'node:fs'
import { join } from 'node:path'
import { Content } from '../types/content';
const scriptFilePath = '../content/after-effects-script.js'

const contentFilePath = join(__dirname, '..', 'state', 'content.json');

export function save(content: Content) {
  fs.writeFileSync(contentFilePath, JSON.stringify(content))
}

export function load(): Content {
  const content = fs.readFileSync(contentFilePath, 'utf-8');
  return JSON.parse(content) as Content
}

export function saveScript(content: Content) {
  const contentString = JSON.stringify(content)
  const scriptString = `var content = ${contentString}`
  return fs.writeFileSync(scriptFilePath, scriptString);
}