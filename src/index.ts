import { Content } from './types/content';
import { robot as textRobot } from './robots/text'
import { robot as imageRoboto } from './robots/image'
import { input } from './robots/input';
import * as state from  './robots/state'

const robots = {
  input,
  text: textRobot,
  image: imageRoboto,
  state
}

async function start() {
  // robots.input()
  // await robots.text()
  await robots.image()

  const content = robots.state.load()
  console.dir(content, {depth: null})
}

start();