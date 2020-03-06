import { app } from "./app";
import { client } from "./mongodb";
import {
  loginAnonymous,
  logoutCurrentUser,
  hasLoggedInUser,
  getCurrentUser,
} from "./authentication";

export { app, client };
export { loginAnonymous, logoutCurrentUser, hasLoggedInUser, getCurrentUser };
