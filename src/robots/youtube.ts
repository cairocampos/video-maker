import * as state from './state'
import googleOAuthCredentials from '../credentials/google-oauth2.json'
import {google, youtube_v3} from 'googleapis'
import { OAuth2Client } from 'google-auth-library';
import express, {Express,} from 'express'
import { Server } from 'http';
import fs from 'node:fs'

const youtube = google.youtube({version: 'v3'})

export async function robot() {
  const content = state.load();
  await authenticateWithOAuth();
  const videoInformation = await uploadVideo()
  await uploadThumbnail(videoInformation)

  async function authenticateWithOAuth() {
    const webServer = await startWebServer();
    const OAuth2Client = await createOAuth2Client()
    requestUserConsent(OAuth2Client);
    const authorizationCode = await waitForGoogleCallback(webServer)
    await requestGoogleForAccessToken(authorizationCode, OAuth2Client)
    setGlobalGoogleAuthentication(OAuth2Client);
    stopWebServer(webServer);


    async function startWebServer(): Promise<{app: Express, server: Server}> {
      return new Promise((resolve, reject) => {
        const port = 3000;
        const app = express();
        const server = app.listen(port)
          .on('listening', () => console.log(`> Server is running`))

        return resolve({
          app,
          server
        })
      })    
    }


    async function createOAuth2Client() {
      return new google.auth.OAuth2({
        clientId: googleOAuthCredentials.web.client_id,
        clientSecret: googleOAuthCredentials.web.client_secret,
        redirectUri: googleOAuthCredentials.web.redirect_uris[0]
      })
    }

    async function requestUserConsent(OAuth2Client: OAuth2Client) {
      const url = OAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: "https://www.googleapis.com/auth/youtube"
      })

      console.log(`> Give consent: ${url}`)
    }

    async function waitForGoogleCallback(webServer: {app: Express, server: Server}): Promise<string> {
      return new Promise((resolve, reject) => {
        console.log('> Waiting for user consent...')
        webServer.app.get('/callback', (req, res) => {
          const code = req.query.code as string;
          res.send('<h1>Thank you!</h1><p>Now close this tab.</p>')
          return resolve(code);
        })
      })
    }

    async function requestGoogleForAccessToken(code: string, OAuth2Client: OAuth2Client) {
      return new Promise((resolve, reject) => {
        OAuth2Client.getToken(code, (error, tokens) => {
          if(error || !tokens) {
            return reject(error)
          }

          OAuth2Client.setCredentials(tokens);
          resolve(true)
        })
      })
    }

    async function setGlobalGoogleAuthentication(OAuth2Client: OAuth2Client) {
      google.options({
        auth: OAuth2Client
      })
    }

    async function stopWebServer(webServer: {app: Express, server: Server}) {
      return new Promise(resolve => {
        webServer.server.close(() => {
          resolve(true)
        })
      })
    }
  }

  async function uploadVideo() {
    const videoFilePath = '../content/output.mov';
    const videoFileSize = fs.statSync(videoFilePath).size;
    const videoTitle = `${content.prefix} ${content.searchTerm}`
    const videoTags = [content.searchTerm, ...content.sentences[0].keywords]
    const videoDescription = content.sentences.map(sentence => sentence.text).join('\n\n')
    const requestParameters = {
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: videoTitle,
          description: videoDescription,
          tags: videoTags
        },
        status: {
          privacyStatus: 'unlisted'
        }
      },
      media: {
        body: fs.createReadStream(videoFilePath)
      }
    }

    const youtubeResponse = await youtube.videos.insert(requestParameters, {
      onUploadProgress: onUploadProgress
    })

    console.log(`> Video available at: https://youtu.be/${youtubeResponse.data.id}`)
    return youtubeResponse.data;

    function onUploadProgress(event: any) {
      const progress = Math.round((event.bytesRead / videoFileSize) * 100) 
      console.log(`> ${progress}% completed`)
    }
  }

  async function uploadThumbnail(videoInformation: youtube_v3.Schema$Video) {
    const videoId = videoInformation.id as string
    const videoThumbnailFilePath = '../content/youtube-thumbnail.jpg';

    const youtubeResponse = await youtube.thumbnails.set({
      videoId,
      media: {
        mimeType: 'jpg',
        body: fs.createReadStream(videoThumbnailFilePath)
      }
    })
    console.log('> Thumbnail uploaded!')
  }
}