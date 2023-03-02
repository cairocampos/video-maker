import { input } from './robots/input';
import * as state from  './robots/state'
import { robot as textRobot } from './robots/text'
import { robot as imageRobot } from './robots/image'
import { robot as videoRobot } from './robots/image'

const robots = {
  input,
  text: textRobot,
  image: imageRobot,
  video: videoRobot,
  state
}

async function start() {
  robots.input()
  await robots.text()
  await robots.image()

  const content = robots.state.load()
  console.dir(content, {depth: null})
}

start();