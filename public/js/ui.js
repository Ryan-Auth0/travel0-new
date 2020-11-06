window.addEventListener('load', function() {
  var webAuth = new auth0.WebAuth({
    clientID: AUTH0_CLIENT_ID, 
    domain: AUTH0_DOMAIN,
    scope: 'openid profile email',
    responseType: 'token',
    redirectUri: AUTH0_CALLBACK_URL
  });

  document.getElementById('btn-login').addEventListener('click', function() {
    webAuth.authorize();
  });

  document.getElementById('btn-logout').addEventListener('click', function() {
    logout();
  });

  webAuth.parseHash({ hash: window.location.hash }, (err, authResult) => {
    if (err) {
      return console.error(err);
    }
    if (authResult) {
      webAuth.client.userInfo(authResult.accessToken, (err, profile) => {
        if (err) {
          // Remove expired token (if any)
          localStorage.removeItem('token');
          // Remove expired profile (if any)
          localStorage.removeItem('profile');
          console.log("remove items");
          return alert('There was an error getting the profile: ' + err.message);
        } else {
          localStorage.setItem('token', authResult.accessToken);
          localStorage.setItem('profile', JSON.stringify(profile));
          console.log("show tokens/profile");
          showUserProfile(profile);
        }
        window.location.hash = "";
      });
    }
  });

  var checkAuth = function() {
    var token = localStorage.getItem('token');
    if (token) {
      var user_profile = JSON.parse(localStorage.getItem('profile'));
      showUserProfile(user_profile);
    } // else: not authorized
  };

  var showUserProfile = function(profile) {
    console.log("Full Contact details", profile.user_metadata.fullcontact);
  };

  var logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    window.location.href = "/";
    console.log("logout prompt");
  };

  checkAuth();
});




// URL mapping, from hash to a function that responds to that URL action
const router = {
  "/": () => showContent("content-home"),
  "/profile": () =>
    requireAuth(() => showContent("content-profile"), "/profile"),
  "/login": () => login()
};

//Declare helper functions

/**
 * Iterates over the elements matching 'selector' and passes them
 * to 'fn'
 * @param {*} selector The CSS selector to find
 * @param {*} fn The function to execute for every element
 */
const eachElement = (selector, fn) => {
  for (let e of document.querySelectorAll(selector)) {
    fn(e);
  }
};

/**
 * Tries to display a content panel that is referenced
 * by the specified route URL. These are matched using the
 * router, defined above.
 * @param {*} url The route URL
 */
const showContentFromUrl = (url) => {
  if (router[url]) {
    router[url]();
    return true;
  }

  return false;
};

/**
 * Returns true if `element` is a hyperlink that can be considered a link to another SPA route
 * @param {*} element The element to check
 */
const isRouteLink = (element) =>
  element.tagName === "A" && element.classList.contains("route-link");

/**
 * Displays a content panel specified by the given element id.
 * All the panels that participate in this flow should have the 'page' class applied,
 * so that it can be correctly hidden before the requested content is shown.
 * @param {*} id The id of the content to show
 */
const showContent = (id) => {
  eachElement(".page", (p) => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};

/**
 * Updates the user interface
 */
const updateUI = async () => {
  try {
    const isAuthenticated = await auth0.isAuthenticated();

    if (isAuthenticated) {
      const user = await auth0.getUser();

      document.getElementById("profile-data").innerText = JSON.stringify(
        user,
        null,
        2
      );

      document.querySelectorAll("pre code").forEach(hljs.highlightBlock);

      eachElement(".profile-image", (e) => (e.src = user.picture));
      eachElement(".user-name", (e) => (e.innerText = user.name));
      eachElement(".user-email", (e) => (e.innerText = user.email));
      eachElement(".auth-invisible", (e) => e.classList.add("hidden"));
      eachElement(".auth-visible", (e) => e.classList.remove("hidden"));
    } else {
      eachElement(".auth-invisible", (e) => e.classList.remove("hidden"));
      eachElement(".auth-visible", (e) => e.classList.add("hidden"));
    }
  } catch (err) {
    console.log("Error updating UI!", err);
    return;
  }

  console.log("UI updated -ui.js script");
  showUserProfile(profile);
};

window.onpopstate = (e) => {
  if (e.state && e.state.url && router[e.state.url]) {
    showContentFromUrl(e.state.url);
  }
};
