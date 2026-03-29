import { combineReducers } from 'redux';
import entry from './entry.js';
import auth from './auth.js';

export default combineReducers({
  entry, auth
});