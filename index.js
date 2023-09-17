const { IgApiClient } = require("instagram-private-api");
const fs = require("fs");
require("dotenv").config();
const ig = new IgApiClient();

async function loadSession() {
  try {
    const serializedSession = fs.readFileSync("./session.json", "utf8");
    ig.state.deserializeCookieJar(serializedSession);
    console.log("Session loaded.");
  } catch (error) {
    console.error("Session could not be loaded.");
  }
}

async function saveSession() {
  try {
    const serializedSession = await ig.state.serializeCookieJar();
    const sessionString = JSON.stringify(serializedSession);
    fs.writeFileSync("./session.json", sessionString, "utf8");
    console.log("Session saved.");
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function login(username, password) {
  ig.state.generateDevice(username);
  if (!ig.state.cookieJar._authenticated) {
    try {
      await ig.simulate.preLoginFlow();
      await ig.account.login(username, password);
      process.nextTick(async () => await ig.simulate.postLoginFlow());

      console.log("Logged in successfully.");
      await saveSession();
    } catch (error) {
      console.error("Login failed:", error);
    }
  }
}

async function getUserFeed(userId) {
  const userFeed = ig.feed.user(userId);
  const userFeedItems = await userFeed.items();
  return userFeedItems;
}

async function getLikers(mediaId) {
  try {
    const likersObject = await ig.media.likers(mediaId);
    const likerUsernames = Object.keys(likersObject);
    return likerUsernames;
  } catch (error) {
    console.error("Error fetching likers:", error);
    return [];
  }
}

(async () => {
  try {
    await loadSession();
    // your instagram username
    const username = process.env.USERNAME;
    // your instagram password
    const password = process.env.PASSWORD;
    // put target username to search for
    const targetUsername = "instagram";

    if (!ig.state.cookieJar._authenticated) {
      await login(username, password);
    }

    const userSearch = await ig.user.searchExact(targetUsername);
    const targetUserId = userSearch.pk;

    const userFeedItems = await getUserFeed(targetUserId);
  } catch (error) {
    console.error(error);
  }
})();
