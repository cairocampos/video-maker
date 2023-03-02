import { Content } from './types/content';
import { robot as textRobot } from './robots/text'
import { input } from './robots/input';
import * as state from  './robots/state'

const robots = {
  input,
  text: textRobot,
  state
}

async function start() {
  robots.input()
  await robots.text()

  const content = robots.state.load()
  console.dir(content, {depth: null})
}

start();