import { robot as textRobot } from './robots/text'
import { robot as imageRobot } from './robots/image'
import { robot as youtubeRobot } from './robots/youtube'
import { robot as videoRobot } from './robots/image'
import { input } from './robots/input';
import * as state from  './robots/state'

const robots = {
  state,
  input,
  text: textRobot,
  image: imageRobot,
  youtube: youtubeRobot,
  video: videoRobot,
}

async function start() {
  robots.input();
  await robots.text();
  await robots.image();
  await robots.video();
  await robots.youtube();
}

start();