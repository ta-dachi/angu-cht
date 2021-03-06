import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";
import TwitchClient, { AccessToken, Stream, PrivilegedUser } from "twitch";
import ChatBadgeList from "twitch/lib/API/Badges/ChatBadgeList";
import { EventEmitter } from "events";

const clientId: string = environment.twitch_clientId;
const clientSecret: string = environment.twitch_client_secret;
const refreshToken: string = environment.twitch_refresh_token;

export const CONNECT: string = "twitchapi_service_connect";
export const DISCONNECT: string = "twitchapi_service_disconnect";

@Injectable({
  providedIn: "root"
})
export class TwitchapiService {
  twitchClient: TwitchClient;
  followedLiveStreams: Array<Stream> = null;
  user: PrivilegedUser;
  globalBadgeList: ChatBadgeList;
  on: boolean = false;
  eventEmitter: EventEmitter = new EventEmitter();

  constructor() {
    // dev
    // this.start(environment.twitch_access_token);
  }

  start(accessToken: string) {
    TwitchClient.withCredentials(clientId, accessToken, undefined, {
      clientSecret,
      refreshToken,
      onRefresh: (token: AccessToken) => {
        // do things with the new token data, e.g. save them in your database
        // Apparently this feature is not active yet and access tokens last forever until revoked.
        // console.log(token);
      }
    })
      .then(client => {
        this.twitchClient = client;
        this.on = true;
        this.eventEmitter.emit(CONNECT);

        this.twitchClient.kraken.streams
          .getFollowedStreams()
          .then(followedLiveChannels => {
            this.followedLiveStreams = followedLiveChannels;
          })
          .catch(error => {
            this.followedLiveStreams = null;
            console.error(error);
          });
        this.twitchClient.users
          .getMe()
          .then(user => {
            this.user = user;
            // console.log(this.user);
          })
          .catch(error => {
            this.user = null;
            console.error(error);
          });
        this.twitchClient.badges
          .getGlobalBadges()
          .then(globalbadges => {
            this.globalBadgeList = globalbadges;
            // console.log(globalbadges);
          })
          .catch(error => {
            this.globalBadgeList = null;
            console.error(error);
          });
      })
      .catch(err => {
        console.error(err);
        this.on = false;
        this.eventEmitter.emit(DISCONNECT);
      });
  }
}
