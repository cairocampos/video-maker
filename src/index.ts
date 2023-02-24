import { Content } from './types/content';
import { robot as textRobot } from './robots/text'
import { userInput } from './user-input';

const robots = {
  userInput,
  text: textRobot
}

async function start() {
  const content: Content = robots.userInput()
  await robots.text(content)

  console.log(JSON.stringify(content, null, 4))
}

start();