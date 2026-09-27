import { api } from '../api';
import { describePlace } from '../location';
import { loadTagNames } from '../tagNames';
import { loadHistoryContext } from './historyContext';

/** Same endpoint, tag-name storage and place lookup as the existing buzz UI. */
export const getHistoryContext = () => loadHistoryContext({
  points: () => api.locationHistory(50), names: loadTagNames, place: describePlace,
});
