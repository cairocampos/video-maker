import { Content } from './types/content';
import { robot as textRobot } from './robots/text'
import { robot as imageRobot } from './robots/image'
import { robot as youtubeRobot } from './robots/youtube'
import { input } from './robots/input';
import * as state from  './robots/state'

const robots = {
  state,
  input,
  text: textRobot,
  image: imageRobot,
  youtube: youtubeRobot,
}

async function start() {
  // robots.input()
  // await robots.text()
  // await robots.image()
  await robots.youtube();

  // const content = robots.state.load()
  // console.dir(content, {depth: null})
}

start();